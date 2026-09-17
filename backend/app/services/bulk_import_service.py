import io
import os
import re
import zipfile
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image, ImageOps

logger = logging.getLogger("scenora.bulk_import")

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".bmp"}
MAX_UNCOMPRESSED_ZIP_SIZE = 250 * 1024 * 1024  # 250MB
MAX_FILES_COUNT = 150
MAX_IMAGE_DIMENSION = 3840  # 4K limit to guarantee cloud memory safety (<150MB during decode)

class BulkImportService:
    """
    Handles bulk image ingestion from ZIP archives or multi-file uploads.
    Extracts scene numbers using tolerant regex matching, cleans and sanitizes
    all images for 100% FFmpeg rendering safety, and updates project scenes.
    """

    @staticmethod
    def extract_scene_number(filename: str) -> Optional[int]:
        """
        Extracts scene number from filename with tolerant regex heuristics.
        Examples:
          - "scene_01.png" -> 1
          - "scene-2.jpg" -> 2
          - "shot_03.webp" -> 3
          - "04_character.png" -> 4
          - "5.jpg" -> 5
          - "hero_scene_06_sunset.png" -> 6
        """
        stem = Path(filename).stem.lower().strip()
        
        # 1. Explicit scene/shot indicator: scene_01, scene-1, shot3, scene04
        m1 = re.search(r"(?:scene|shot|sc)[-_ ]*0*(\d+)", stem)
        if m1:
            try:
                num = int(m1.group(1))
                if num > 0:
                    return num
            except ValueError:
                pass

        # 2. Leading number: "01_forest", "2-hero", "03.png"
        m2 = re.match(r"^0*(\d+)(?:[-_ .]|$)", stem)
        if m2:
            try:
                num = int(m2.group(1))
                if num > 0:
                    return num
            except ValueError:
                pass

        # 3. Trailing or delimited number: "forest_02", "forest-3"
        m3 = re.search(r"[-_ ]0*(\d+)$", stem)
        if m3:
            try:
                num = int(m3.group(1))
                if num > 0:
                    return num
            except ValueError:
                pass

        # 4. Any isolated number in stem
        m4 = re.search(r"\b0*(\d+)\b", stem)
        if m4:
            try:
                num = int(m4.group(1))
                if num > 0:
                    return num
            except ValueError:
                pass

        return None

    @staticmethod
    def sanitize_image_for_ffmpeg(raw_bytes: bytes, filename: str) -> Tuple[bytes, int, int]:
        """
        Guarantees 100% FFmpeg rendering safety:
        1. EXIF orientation correction (ImageOps.exif_transpose)
        2. Color space normalization (converts CMYK, palette, greyscale to standard 8-bit sRGB)
        3. Even dimension constraint (libx264/yuv420p requires width & height divisible by 2)
        4. Bounds enforcement: scales down images exceeding 3840px to prevent OOM
        5. Encodes as pristine, uncorrupted PNG
        """
        try:
            with Image.open(io.BytesIO(raw_bytes)) as img:
                # 1. Correct EXIF orientation
                try:
                    img = ImageOps.exif_transpose(img)
                except Exception:
                    pass

                # 2. Color space normalization
                # If CMYK or Palette mode, convert to RGB
                if img.mode in ("CMYK", "P", "L", "LA", "1", "YCbCr", "HSV"):
                    img = img.convert("RGB")
                elif img.mode == "RGBA":
                    # Flatten transparency onto solid black background for clean video compositing
                    background = Image.new("RGB", img.size, (0, 0, 0))
                    background.paste(img, mask=img.split()[3])
                    img = background
                elif img.mode != "RGB":
                    img = img.convert("RGB")

                # 3. Dimension bounds check
                w, h = img.size
                max_dim = max(w, h)
                if max_dim > MAX_IMAGE_DIMENSION:
                    ratio = MAX_IMAGE_DIMENSION / float(max_dim)
                    new_w = int(w * ratio)
                    new_h = int(h * ratio)
                    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    w, h = img.size

                # 4. Enforce even dimensions for libx264 compatibility
                even_w = w - (w % 2)
                even_h = h - (h % 2)
                if even_w != w or even_h != h:
                    img = img.crop((0, 0, even_w, even_h))
                    w, h = even_w, even_h

                # 5. Output clean PNG
                out_io = io.BytesIO()
                img.save(out_io, format="PNG", optimize=True)
                clean_bytes = out_io.getvalue()
                return clean_bytes, w, h
        except Exception as e:
            logger.error(f"Failed to sanitize image '{filename}': {e}")
            raise ValueError(f"Image '{filename}' could not be decoded or is corrupted: {e}")

    @classmethod
    def extract_zip_files(cls, zip_bytes: bytes) -> List[Tuple[str, bytes]]:
        """
        Safely extracts images from a ZIP archive with zip-bomb and path-traversal protection.
        """
        extracted = []
        total_size = 0

        with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as z:
            namelist = z.namelist()
            if len(namelist) > MAX_FILES_COUNT:
                raise ValueError(f"ZIP archive contains {len(namelist)} items, exceeding maximum limit of {MAX_FILES_COUNT}")

            for name in namelist:
                # Ignore directory entries, macOS artifacts, and hidden files
                if name.endswith("/") or "__MACOSX" in name or Path(name).name.startswith("."):
                    continue

                # Path traversal guard
                clean_name = os.path.normpath(name)
                if clean_name.startswith("..") or os.path.isabs(clean_name):
                    continue

                ext = Path(clean_name).suffix.lower()
                if ext not in ALLOWED_IMAGE_EXTENSIONS:
                    continue

                info = z.getinfo(name)
                total_size += info.file_size
                if total_size > MAX_UNCOMPRESSED_ZIP_SIZE:
                    raise ValueError("ZIP archive contents exceed maximum uncompressed limit of 250MB")

                file_data = z.read(name)
                extracted.append((Path(clean_name).name, file_data))

        return extracted

    @classmethod
    def match_files_to_scenes(
        cls,
        files: List[Tuple[str, bytes]],
        scenes: List[Any]
    ) -> Tuple[Dict[int, Tuple[str, bytes]], List[str]]:
        """
        Matches files to scene indices (1-based).
        Returns (mapping of scene_num -> (filename, bytes), list of unmatched filenames).
        """
        total_scenes = len(scenes)
        scene_numbers = set(range(1, total_scenes + 1))
        
        assigned: Dict[int, Tuple[str, bytes]] = {}
        unmatched: List[Tuple[str, bytes]] = []

        # Pass 1: Match by explicit number in filename
        for fname, fbytes in files:
            num = cls.extract_scene_number(fname)
            if num and num in scene_numbers and num not in assigned:
                assigned[num] = (fname, fbytes)
            else:
                unmatched.append((fname, fbytes))

        # Pass 2: Fill remaining unassigned scenes in alphabetical order
        unassigned_scenes = sorted(list(scene_numbers - set(assigned.keys())))
        unmatched_sorted = sorted(unmatched, key=lambda x: x[0].lower())
        
        leftover_files = []
        for i, (fname, fbytes) in enumerate(unmatched_sorted):
            if i < len(unassigned_scenes):
                target_scene_num = unassigned_scenes[i]
                assigned[target_scene_num] = (fname, fbytes)
            else:
                leftover_files.append(fname)

        return assigned, leftover_files

bulk_import_service = BulkImportService()
