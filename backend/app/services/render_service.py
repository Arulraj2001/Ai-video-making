import asyncio
import json
import logging
import os
import re
import shutil
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Union

from app.models.render import RenderJobModel
from app.configuration.config import settings
from app.services.project_service import project_service, STORAGE_DIR

logger = logging.getLogger(__name__)

# Supported Output Resolutions
RESOLUTIONS = {
    "1080x1920": {"width": 1080, "height": 1920, "aspect_ratio": "9:16", "name": "Vertical (TikTok/Shorts/Reels)"},
    "1920x1080": {"width": 1920, "height": 1080, "aspect_ratio": "16:9", "name": "Landscape (YouTube/Cinema)"},
    "1080x1080": {"width": 1080, "height": 1080, "aspect_ratio": "1:1", "name": "Square (Instagram)"},
    "720x1280": {"width": 720, "height": 1280, "aspect_ratio": "9:16", "name": "Vertical 720p"},
    "1280x720": {"width": 1280, "height": 720, "aspect_ratio": "16:9", "name": "Landscape 720p"},
}
DEFAULT_RESOLUTION = "1080x1920"

ASPECT_TO_RESOLUTION = {
    "16:9": "1920x1080",
    "9:16": "1080x1920",
    "1:1": "1080x1080",
}


def _format_ass_time(seconds: float) -> str:
    """Format seconds into ASS timestamp H:MM:SS.cs"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - int(seconds)) * 100))
    if cs >= 100:
        cs = 99
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def _hex_to_ass_color(hex_str: str, alpha: int = 0) -> str:
    """Convert hex color (#RRGGBB) to ASS &HAABBGGRR format."""
    if not hex_str:
        return f"&H{alpha:02X}FFFFFF"
    hex_clean = hex_str.lstrip("#")
    if len(hex_clean) == 6:
        r, g, b = hex_clean[0:2], hex_clean[2:4], hex_clean[4:6]
        return f"&H{alpha:02X}{b}{g}{r}"
    return f"&H{alpha:02X}FFFFFF"


def _generate_ass_subtitles(
    scenes: List,
    caption_settings,
    target_width: int,
    target_height: int
) -> str:
    """Generates an Advanced SubStation Alpha (.ass) subtitle file formatted according to project caption settings."""
    font_family = getattr(caption_settings, "font_family", "Inter") or "Inter"
    font_size = getattr(caption_settings, "font_size", 42) or 42
    position = (getattr(caption_settings, "position", "bottom") or "bottom").lower()
    alignment = (getattr(caption_settings, "alignment", "center") or "center").lower()
    background = (getattr(caption_settings, "background", "semi-transparent") or "semi-transparent").lower()
    outline_shadow = (getattr(caption_settings, "outline_shadow", "subtle") or "subtle").lower()
    safe_area = getattr(caption_settings, "safe_area", True)
    color = getattr(caption_settings, "color", "#FFFFFF") or "#FFFFFF"

    primary_color = _hex_to_ass_color(color, alpha=0)

    # Alignment codes:
    # 1=bottom-left, 2=bottom-center, 3=bottom-right
    # 4=middle-left, 5=middle-center, 6=middle-right
    # 7=top-left, 8=top-center, 9=top-right
    align_map = {
        ("bottom", "left"): 1, ("bottom", "center"): 2, ("bottom", "right"): 3,
        ("center", "left"): 4, ("center", "center"): 5, ("center", "right"): 6,
        ("top", "left"): 7, ("top", "center"): 8, ("top", "right"): 9,
    }
    align_code = align_map.get((position, alignment), 2)

    # Margins / Safe area padding
    if safe_area:
        margin_v = int(target_height * 0.08)
        margin_l = int(target_width * 0.08)
        margin_r = int(target_width * 0.08)
    else:
        margin_v = 30
        margin_l = 30
        margin_r = 30

    # Styling: Background box vs outline / shadow
    if background == "solid":
        border_style = 3  # Opaque backing box
        outline = 8
        shadow = 0
        outline_color = "&H00000000"
        back_color = "&H00000000"
    elif background == "semi-transparent":
        border_style = 3  # Semi-transparent box
        outline = 8
        shadow = 0
        outline_color = "&H80000000"
        back_color = "&H80000000"
    else:  # "none"
        border_style = 1  # Regular text outline
        if outline_shadow == "strong":
            outline = 4
            shadow = 3
        elif outline_shadow == "subtle":
            outline = 2
            shadow = 1
        else:  # "none"
            outline = 0
            shadow = 0
        outline_color = "&H00000000"
        back_color = "&H80000000"

    ass_lines = [
        "[Script Info]",
        "ScriptType: v4.00+",
        f"PlayResX: {target_width}",
        f"PlayResY: {target_height}",
        "WrapStyle: 0",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Default,{font_family},{font_size},{primary_color},&H000000FF,{outline_color},{back_color},1,0,0,0,100,100,0,0,{border_style},{outline},{shadow},{align_code},{margin_l},{margin_r},{margin_v},1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
    ]

    for sc in scenes:
        text = (getattr(sc, "caption", "") or "").strip()
        if not text:
            continue
        cleaned_text = (
            text.replace("{", "(")
            .replace("}", ")")
            .replace("\r\n", "\\N")
            .replace("\n", "\\N")
        )
        start_str = _format_ass_time(sc.start)
        end_str = _format_ass_time(sc.end)
        ass_lines.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{cleaned_text}")

    return "\n".join(ass_lines) + "\n"



def get_ffmpeg_executable() -> str:
    """Safely locate the FFmpeg executable across Render Linux, Windows, and local venvs."""
    # 1. Custom env var override
    env_path = os.environ.get("FFMPEG_PATH")
    if env_path and os.path.isfile(env_path):
        return env_path

    # 2. System PATH (Render Linux, etc.)
    which_path = shutil.which("ffmpeg")
    if which_path:
        return which_path

    # 3. Bundled imageio_ffmpeg binary
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass

    return "ffmpeg"


def probe_video_metadata(file_path: Union[str, Path]) -> dict:
    """Extracts stream properties, codecs, resolution, SAR/DAR, fps, duration, and audio specs using FFmpeg."""
    p = Path(file_path)
    if not p.exists():
        raise FileNotFoundError(f"File not found: {p}")

    ffmpeg_exe = get_ffmpeg_executable()
    res = subprocess.run([ffmpeg_exe, "-i", str(p)], capture_output=True, text=True)
    stderr = res.stderr

    meta = {
        "file_path": str(p),
        "file_size": p.stat().st_size,
        "width": None,
        "height": None,
        "duration": None,
        "aspect_ratio": None,
        "fps": None,
        "video_codec": None,
        "pix_fmt": None,
        "audio_codec": None,
        "audio_channels": None,
        "audio_sample_rate": None,
        "audio_bitrate_kbps": None,
        "is_valid": False,
    }

    dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", stderr)
    if dur_match:
        h, m, s = dur_match.groups()
        meta["duration"] = round(int(h) * 3600 + int(m) * 60 + float(s), 3)

    vid_match = re.search(r"Stream #\d+:\d+.*?: Video:\s*([a-zA-Z0-9_\-]+).*?,\s*([a-zA-Z0-9_]+(?:\([^\)]+\))?),?\s*(\d{3,5})x(\d{3,5})", stderr)
    if vid_match:
        meta["video_codec"] = vid_match.group(1).lower()
        meta["pix_fmt"] = vid_match.group(2).split("(")[0].strip()
        meta["width"] = int(vid_match.group(3))
        meta["height"] = int(vid_match.group(4))

    dar_match = re.search(r"DAR\s*(\d+:\d+)", stderr)
    if dar_match:
        meta["aspect_ratio"] = dar_match.group(1)
    elif meta["width"] and meta["height"]:
        w, h = meta["width"], meta["height"]
        if w == 1920 and h == 1080:
            meta["aspect_ratio"] = "16:9"
        elif w == 1080 and h == 1920:
            meta["aspect_ratio"] = "9:16"
        elif w == h:
            meta["aspect_ratio"] = "1:1"

    fps_match = re.search(r"(\d+(?:\.\d+)?)\s*fps", stderr)
    if fps_match:
        meta["fps"] = float(fps_match.group(1))

    aud_match = re.search(r"Stream #\d+:\d+.*?: Audio:\s*([a-zA-Z0-9_\-]+).*?,\s*(\d+)\s*Hz,\s*([a-zA-Z0-9_]+)", stderr)
    if aud_match:
        meta["audio_codec"] = aud_match.group(1).lower()
        meta["audio_sample_rate"] = int(aud_match.group(2))
        ch_str = aud_match.group(3).lower()
        meta["audio_channels"] = 2 if "stereo" in ch_str else (1 if "mono" in ch_str else 2)

    aud_br_match = re.search(r"Audio:.*?,\s*(\d+)\s*kb/s", stderr)
    if aud_br_match:
        meta["audio_bitrate_kbps"] = int(aud_br_match.group(1))

    if meta["width"] and meta["height"] and meta["duration"] and meta["video_codec"]:
        meta["is_valid"] = True

    return meta


class RenderService:
    def __init__(self):
        self._jobs: Dict[str, RenderJobModel] = {}
        self.renders_root = STORAGE_DIR / "renders"
        self.renders_root.mkdir(parents=True, exist_ok=True)
        self._load_jobs_from_disk()
        self.cleanup_expired_renders()
        project_service.cleanup_temp_files()

    @staticmethod
    def _parse_timestamp(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return timestamp if timestamp.tzinfo else timestamp.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            return None

    def cleanup_expired_renders(self, now: Optional[datetime] = None) -> int:
        """Deletes completed local renders after the configured free-tier retention window."""
        current_time = now or datetime.now(timezone.utc)
        cutoff = current_time - timedelta(hours=settings.RENDER_RETENTION_HOURS)
        expired_jobs = []
        for job in list(self._jobs.values()):
            created_at = self._parse_timestamp(job.created_at)
            if job.status == "completed" and created_at and created_at < cutoff:
                expired_jobs.append(job)

        for job in expired_jobs:
            self.delete_job(job.id)

        return len(expired_jobs)

    def _get_project_renders_dir(self, project_id: str) -> Path:
        pdir = STORAGE_DIR / "projects" / project_id / "renders"
        pdir.mkdir(parents=True, exist_ok=True)
        return pdir

    def _get_jobs_file(self, project_id: str) -> Path:
        return self._get_project_renders_dir(project_id) / "render_jobs.json"

    def _load_jobs_from_disk(self):
        """Loads historical render jobs from project directories."""
        projects_dir = STORAGE_DIR / "projects"
        if not projects_dir.exists():
            return

        for p_dir in projects_dir.iterdir():
            if p_dir.is_dir():
                jobs_file = p_dir / "renders" / "render_jobs.json"
                if jobs_file.exists():
                    try:
                        with open(jobs_file, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            for j_data in data:
                                job = RenderJobModel(
                                    id=j_data["id"],
                                    project_id=j_data["project_id"],
                                    status=j_data["status"],
                                    stage=j_data.get("stage", "Finalizing..."),
                                    progress=j_data.get("progress", 100),
                                    resolution=j_data.get("resolution", DEFAULT_RESOLUTION),
                                    aspect_ratio=j_data.get("aspect_ratio", "9:16"),
                                    output_path=j_data.get("output_path"),
                                    output_filename=j_data.get("output_filename"),
                                    file_size=j_data.get("file_size"),
                                    duration=j_data.get("duration"),
                                    error=j_data.get("error"),
                                    created_at=j_data.get("created_at", datetime.now(timezone.utc).isoformat()),
                                    updated_at=j_data.get("updated_at", datetime.now(timezone.utc).isoformat()),
                                )
                                self._jobs[job.id] = job
                    except Exception as e:
                        logger.warning(f"Could not load render jobs from {jobs_file}: {e}")

    def _save_jobs_for_project(self, project_id: str):
        """Persists jobs metadata to disk."""
        jobs_file = self._get_jobs_file(project_id)
        project_jobs = [
            {
                "id": j.id,
                "project_id": j.project_id,
                "status": j.status,
                "stage": j.stage,
                "progress": j.progress,
                "resolution": j.resolution,
                "aspect_ratio": j.aspect_ratio,
                "output_path": j.output_path,
                "output_filename": j.output_filename,
                "file_size": j.file_size,
                "duration": j.duration,
                "error": j.error,
                "created_at": j.created_at,
                "updated_at": j.updated_at,
            }
            for j in self._jobs.values()
            if j.project_id == project_id
        ]
        try:
            with open(jobs_file, "w", encoding="utf-8") as f:
                json.dump(project_jobs, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to persist render jobs for {project_id}: {e}")

    def get_job(self, job_id: str) -> Optional[RenderJobModel]:
        self.cleanup_expired_renders()
        return self._jobs.get(job_id)

    def list_jobs_for_project(self, project_id: str) -> List[RenderJobModel]:
        self.cleanup_expired_renders()
        return [j for j in self._jobs.values() if j.project_id == project_id]

    def delete_job(self, job_id: str) -> bool:
        job = self._jobs.get(job_id)
        if not job:
            return False
        if job.output_path:
            p = STORAGE_DIR / job.output_path
            if p.exists():
                try:
                    p.unlink(missing_ok=True)
                except Exception:
                    pass
            # Clean up sibling transcode caches
            for ext in [".mp3", "_720p.mp4", ".webm", ".gif", "_preview.gif"]:
                s = p.parent / f"{job_id}{ext}"
                if s.exists():
                    try:
                        s.unlink(missing_ok=True)
                    except Exception:
                        pass
        if job.id in self._jobs:
            del self._jobs[job.id]
            self._save_jobs_for_project(job.project_id)
        return True

    def create_render_job(
        self,
        project_id: str,
        resolution: Optional[str] = None,
        aspect_ratio_override: Optional[str] = None,
        owner_id: Optional[str] = None,
    ) -> RenderJobModel:
        """Validates project and enqueues a background render job."""
        project = project_service.get_project(project_id, owner_id=owner_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found.")

        if not project.scenes or len(project.scenes) == 0:
            raise ValueError("Cannot render a project with no scenes.")

        # Resolve aspect ratio and resolution
        if aspect_ratio_override:
            aspect_ratio = aspect_ratio_override
            if not resolution or resolution == DEFAULT_RESOLUTION or RESOLUTIONS.get(resolution, {}).get("aspect_ratio") != aspect_ratio:
                resolution = ASPECT_TO_RESOLUTION.get(aspect_ratio, resolution or DEFAULT_RESOLUTION)
        elif resolution and resolution in RESOLUTIONS:
            aspect_ratio = RESOLUTIONS[resolution]["aspect_ratio"]
        elif getattr(project, "canvas_settings", None) and getattr(project.canvas_settings, "aspect_ratio", None):
            aspect_ratio = project.canvas_settings.aspect_ratio
            if not resolution:
                resolution = getattr(project.canvas_settings, "resolution", None) or ASPECT_TO_RESOLUTION.get(aspect_ratio, DEFAULT_RESOLUTION)
        else:
            aspect_ratio = "9:16"
            resolution = DEFAULT_RESOLUTION

        # Normalize resolution
        if not resolution or resolution not in RESOLUTIONS:
            resolution = ASPECT_TO_RESOLUTION.get(aspect_ratio, DEFAULT_RESOLUTION)

        job = RenderJobModel(
            project_id=project_id,
            status="queued",
            stage="Preparing...",
            progress=0,
            resolution=resolution,
            aspect_ratio=aspect_ratio,
            output_filename=f"{project.name.lower().replace(' ', '_')[:30]}_{resolution}.mp4",
        )
        self._jobs[job.id] = job
        self._save_jobs_for_project(project_id)

        # Launch background async worker safely across ASGI server and TestClient
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._run_render_worker(job.id))
        except RuntimeError:
            import threading
            def _thread_target():
                asyncio.run(self._run_render_worker(job.id))
            t = threading.Thread(target=_thread_target, daemon=True)
            t.start()

        return job

    def retry_render_job(self, job_id: str, owner_id: Optional[str] = None) -> RenderJobModel:
        """Retries a failed render job using identical resolution and settings."""
        old_job = self.get_job(job_id)
        if not old_job:
            raise ValueError(f"Render job '{job_id}' not found.")

        return self.create_render_job(
            project_id=old_job.project_id,
            resolution=old_job.resolution,
            aspect_ratio_override=old_job.aspect_ratio,
            owner_id=owner_id,
        )

    async def _run_render_worker(self, job_id: str):
        """Asynchronous worker that executes the multi-stage FFmpeg pipeline."""
        job = self._jobs.get(job_id)
        if not job:
            return
        if job.status in ("processing", "completed"):
            return
        job.status = "processing"

        project = project_service.get_project(job.project_id)
        if not project:
            job.status = "failed"
            job.error = "Project was deleted before render began."
            self._save_jobs_for_project(job.project_id)
            return

        renders_dir = self._get_project_renders_dir(job.project_id)
        temp_dir = renders_dir / f"tmp_{job.id}"
        temp_dir.mkdir(parents=True, exist_ok=True)
        final_mp4_path = renders_dir / f"{job.id}.mp4"

        try:
            ffmpeg_exe = get_ffmpeg_executable()
            res_info = RESOLUTIONS.get(job.resolution, RESOLUTIONS[DEFAULT_RESOLUTION])
            target_width = res_info["width"]
            target_height = res_info["height"]
            target_fps = int(getattr(project.canvas_settings, "fps", 30) or 30) if getattr(project, "canvas_settings", None) else 30

            # --- STAGE 1: Preparing... (0% -> 15%) ---
            job.status = "processing"
            job.stage = "Preparing..."
            job.progress = 5
            job.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_jobs_for_project(job.project_id)
            await asyncio.sleep(0.1)

            scenes = sorted(project.scenes, key=lambda s: s.start)
            total_scenes = len(scenes)
            total_duration = max(s.end for s in scenes)

            # Validate or fallback image paths
            scene_image_paths: List[Path] = []
            for idx, sc in enumerate(scenes):
                img_path = None
                if sc.image_path:
                    cand = Path(sc.image_path)
                    if not cand.is_absolute():
                        cand = Path.cwd() / cand
                    if cand.exists():
                        img_path = cand
                elif sc.image_url and sc.image_url.startswith("/media/"):
                    rel = sc.image_url.replace("/media/", "storage/projects/")
                    cand = Path.cwd() / rel
                    if cand.exists():
                        img_path = cand

                # If missing or not generated, create a clean solid background canvas
                if not img_path:
                    fallback_img = temp_dir / f"fallback_{idx:03d}.png"
                    # Safe command array to generate a solid canvas image
                    cmd_fallback = [
                        ffmpeg_exe, "-y",
                        "-f", "lavfi",
                        "-i", f"color=c=0x0f172a:s={target_width}x{target_height}:d=1",
                        "-vframes", "1",
                        str(fallback_img)
                    ]
                    subprocess.run(cmd_fallback, capture_output=True, check=True)
                    img_path = fallback_img

                scene_image_paths.append(img_path)

            job.progress = 15
            job.stage = "Generating timeline..."
            job.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_jobs_for_project(job.project_id)
            await asyncio.sleep(0.1)

            # --- STAGE 2: Generating timeline... (15% -> 55%) ---
            # Render each scene clip with motion and transition filters
            scene_clips: List[Path] = []
            for idx, (scene, img_path) in enumerate(zip(scenes, scene_image_paths)):
                duration = max(0.1, scene.duration)
                num_frames = int(round(duration * target_fps))
                clip_path = temp_dir / f"scene_{idx:03d}.mp4"

                # Construct safe filter chain
                filters = self._build_scene_filters(
                    scene=scene,
                    duration=duration,
                    num_frames=num_frames,
                    target_width=target_width,
                    target_height=target_height,
                    is_last=(idx == total_scenes - 1),
                    target_fps=target_fps,
                )

                # Safe subprocess array
                cmd_clip = [
                    ffmpeg_exe, "-y",
                    "-loop", "1",
                    "-i", str(img_path),
                    "-t", f"{duration:.3f}",
                    "-vf", filters,
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "20",
                    "-pix_fmt", "yuv420p",
                    "-r", str(target_fps),
                    str(clip_path)
                ]

                # Run non-blocking subprocess in executor thread
                loop = asyncio.get_running_loop()
                result = await loop.run_in_executor(
                    None,
                    lambda cmd=cmd_clip: subprocess.run(cmd, capture_output=True, text=True)
                )

                if result.returncode != 0:
                    raise RuntimeError(f"FFmpeg failed rendering scene {idx + 1}: {result.stderr[-400:]}")

                scene_clips.append(clip_path)

                # Incremental progress
                scene_progress = 15 + int(40 * ((idx + 1) / total_scenes))
                job.progress = min(55, scene_progress)
                job.updated_at = datetime.now(timezone.utc).isoformat()
                self._save_jobs_for_project(job.project_id)

            # --- STAGE 3: Rendering... (55% -> 85%) ---
            job.stage = "Rendering..."
            job.progress = 60
            job.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_jobs_for_project(job.project_id)

            # Write concat demuxer file
            concat_list_file = temp_dir / "concat_list.txt"
            with open(concat_list_file, "w", encoding="utf-8") as f:
                for clip in scene_clips:
                    # Concat demuxer expects single forward slashes or safe escaped paths
                    escaped_path = clip.name
                    f.write(f"file '{escaped_path}'\n")

            # Concat video stream first to ensure flawless seamless timing
            merged_video_path = temp_dir / "merged_video.mp4"
            cmd_concat = [
                ffmpeg_exe, "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", "concat_list.txt",
                "-c", "copy",
                "merged_video.mp4"
            ]

            result_concat = await loop.run_in_executor(
                None,
                lambda cmd=cmd_concat: subprocess.run(cmd, capture_output=True, text=True, cwd=str(temp_dir))
            )
            if result_concat.returncode != 0:
                raise RuntimeError(f"FFmpeg concat failed: {result_concat.stderr[-400:]}")

            job.progress = 70
            job.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_jobs_for_project(job.project_id)

            # --- SUBTITLES / CAPTIONS BURNING ---
            video_for_audio = merged_video_path
            caption_settings = getattr(project, "caption_settings", None)
            has_captions = any(bool((getattr(s, "caption", "") or "").strip()) for s in scenes)
            if caption_settings and getattr(caption_settings, "enabled", True) and has_captions:
                job.stage = "Burning captions..."
                job.progress = 78
                job.updated_at = datetime.now(timezone.utc).isoformat()
                self._save_jobs_for_project(job.project_id)

                ass_content = _generate_ass_subtitles(
                    scenes=scenes,
                    caption_settings=caption_settings,
                    target_width=target_width,
                    target_height=target_height
                )
                ass_file = temp_dir / "captions.ass"
                with open(ass_file, "w", encoding="utf-8") as f:
                    f.write(ass_content)

                subtitled_video_path = temp_dir / "subtitled_video.mp4"
                cmd_subs = [
                    ffmpeg_exe, "-y",
                    "-i", "merged_video.mp4",
                    "-vf", "subtitles=captions.ass",
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "20",
                    "-pix_fmt", "yuv420p",
                    "-r", str(target_fps),
                    "subtitled_video.mp4"
                ]
                result_subs = await loop.run_in_executor(
                    None,
                    lambda cmd=cmd_subs: subprocess.run(cmd, capture_output=True, text=True, cwd=str(temp_dir))
                )
                if result_subs.returncode != 0:
                    raise RuntimeError(f"FFmpeg caption burning failed: {result_subs.stderr[-400:]}")
                video_for_audio = subtitled_video_path

            # --- STAGE 4: Finalizing & Audio Mixing (85% -> 100%) ---
            job.stage = "Finalizing..."
            job.progress = 85
            job.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_jobs_for_project(job.project_id)

            # Locate narration audio track
            narr_path: Optional[Path] = None
            if project.audio_file and project.audio_file.storage_path:
                cand_narr = Path(project.audio_file.storage_path)
                if not cand_narr.is_absolute():
                    cand_narr = Path.cwd() / cand_narr
                if cand_narr.exists():
                    narr_path = cand_narr.resolve()

            # Locate background music track
            bgm_path: Optional[Path] = None
            audio_settings = getattr(project, "audio_settings", None)
            if audio_settings and audio_settings.music_file and audio_settings.music_file.storage_path:
                cand_bgm = Path(audio_settings.music_file.storage_path)
                if not cand_bgm.is_absolute():
                    cand_bgm = Path.cwd() / cand_bgm
                if cand_bgm.exists():
                    bgm_path = cand_bgm.resolve()

            # Volume and fade parameters
            narr_vol = 1.0
            narr_muted = False
            bgm_vol = 0.25
            bgm_muted = False
            fade_in = 1.0
            fade_out = 2.0

            if audio_settings:
                narr_vol = max(0.0, min(2.0, getattr(audio_settings, "narration_volume", 1.0)))
                narr_muted = bool(getattr(audio_settings, "narration_muted", False))
                bgm_vol = max(0.0, min(2.0, getattr(audio_settings, "music_volume", 0.25)))
                bgm_muted = bool(getattr(audio_settings, "music_muted", False))
                fade_in = max(0.0, min(10.0, getattr(audio_settings, "music_fade_in", 1.0)))
                fade_out = max(0.0, min(10.0, getattr(audio_settings, "music_fade_out", 2.0)))

            if narr_muted:
                narr_vol = 0.0
            if bgm_muted:
                bgm_vol = 0.0

            fade_out_st = max(0.0, total_duration - fade_out)

            # Construct safe audio mixing command
            if narr_path and bgm_path:
                ducking_enabled = getattr(audio_settings, "ducking_enabled", True) if audio_settings else True
                if ducking_enabled and narr_vol > 0.01:
                    # Broadcast mastering: Auto-duck BGM when voiceover speaks using sidechain compression
                    filter_complex = (
                        f"[1:a]volume={narr_vol:.2f},apad,asplit=2[narr_voice][narr_sc];"
                        f"[2:a]aloop=loop=-1:size=2e+09,atrim=0:{total_duration:.3f},"
                        f"afade=t=in:st=0:d={fade_in:.2f},afade=t=out:st={fade_out_st:.3f}:d={fade_out:.2f},"
                        f"volume={bgm_vol:.2f}[bgm];"
                        f"[bgm][narr_sc]sidechaincompress=threshold=0.08:ratio=3:attack=50:release=350[bgm_ducked];"
                        f"[narr_voice][bgm_ducked]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[aout]"
                    )
                else:
                    filter_complex = (
                        f"[1:a]volume={narr_vol:.2f},apad[narr];"
                        f"[2:a]aloop=loop=-1:size=2e+09,atrim=0:{total_duration:.3f},"
                        f"afade=t=in:st=0:d={fade_in:.2f},afade=t=out:st={fade_out_st:.3f}:d={fade_out:.2f},"
                        f"volume={bgm_vol:.2f}[bgm];"
                        f"[narr][bgm]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[aout]"
                    )
                cmd_final = [
                    ffmpeg_exe, "-y",
                    "-i", str(video_for_audio.resolve()),
                    "-i", str(narr_path),
                    "-i", str(bgm_path),
                    "-filter_complex", filter_complex,
                    "-map", "0:v:0",
                    "-map", "[aout]",
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-ar", "44100",
                    "-ac", "2",
                    "-t", f"{total_duration:.3f}",
                    "-movflags", "+faststart",
                    str(final_mp4_path.resolve())
                ]
            elif narr_path:
                cmd_final = [
                    ffmpeg_exe, "-y",
                    "-i", str(video_for_audio.resolve()),
                    "-i", str(narr_path),
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-ar", "44100",
                    "-ac", "2",
                    "-af", f"volume={narr_vol:.2f},apad",
                    "-t", f"{total_duration:.3f}",
                    "-movflags", "+faststart",
                    str(final_mp4_path.resolve())
                ]
            elif bgm_path:
                af_bgm = (
                    f"aloop=loop=-1:size=2e+09,atrim=0:{total_duration:.3f},"
                    f"afade=t=in:st=0:d={fade_in:.2f},afade=t=out:st={fade_out_st:.3f}:d={fade_out:.2f},"
                    f"volume={bgm_vol:.2f}"
                )
                cmd_final = [
                    ffmpeg_exe, "-y",
                    "-i", str(video_for_audio.resolve()),
                    "-i", str(bgm_path),
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-ar", "44100",
                    "-ac", "2",
                    "-af", af_bgm,
                    "-t", f"{total_duration:.3f}",
                    "-movflags", "+faststart",
                    str(final_mp4_path.resolve())
                ]
            else:
                cmd_final = [
                    ffmpeg_exe, "-y",
                    "-i", str(video_for_audio.resolve()),
                    "-f", "lavfi",
                    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-t", f"{total_duration:.3f}",
                    "-movflags", "+faststart",
                    str(final_mp4_path.resolve())
                ]

            result_final = await loop.run_in_executor(
                None,
                lambda cmd=cmd_final: subprocess.run(cmd, capture_output=True, text=True)
            )
            if result_final.returncode != 0:
                raise RuntimeError(f"FFmpeg finalizing audio muxing failed: {result_final.stderr[-400:]}")

            # Verify file exists and record stats
            if not final_mp4_path.exists() or final_mp4_path.stat().st_size == 0:
                raise RuntimeError("Render output file is empty or missing.")

            # Safe cleanup of intermediate temporary directory
            shutil.rmtree(temp_dir, ignore_errors=True)

            # Update job to completed
            job.status = "completed"
            job.stage = "Finalizing..."
            job.progress = 100
            job.output_path = str(final_mp4_path.relative_to(STORAGE_DIR).as_posix())
            job.file_size = final_mp4_path.stat().st_size
            job.duration = total_duration
            job.error = None
            job.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_jobs_for_project(job.project_id)
            logger.info(f"Render job {job.id} completed successfully: {final_mp4_path}")

        except Exception as e:
            logger.exception(f"Render job {job.id} failed: {e}")
            job.status = "failed"
            job.error = str(e)
            job.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_jobs_for_project(job.project_id)
            # Cleanup temp files on failure
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _build_scene_filters(
        self,
        scene,
        duration: float,
        num_frames: int,
        target_width: int,
        target_height: int,
        is_last: bool,
        target_fps: int = 30,
    ) -> str:
        """Constructs safe FFmpeg filter expressions for scaling, image transforms (fit/crop/zoom/position), motion, and transitions."""
        motion = (getattr(scene, "motion", "none") or "none").lower()
        transition = (getattr(scene, "transition", "none") or "none").lower()
        trans_duration = getattr(scene, "transition_duration", 0.5) or 0.5
        trans_duration = min(trans_duration, duration / 2.0)

        image_fit = (getattr(scene, "image_fit", "cover") or "cover").lower()
        image_position = (getattr(scene, "image_position", "center") or "center").lower()
        image_zoom = getattr(scene, "image_zoom", 1.0) or 1.0
        image_crop = getattr(scene, "image_crop", None)

        brightness = float(getattr(scene, "brightness", 0.0) or 0.0)
        contrast = float(getattr(scene, "contrast", 1.0) or 1.0)
        saturation = float(getattr(scene, "saturation", 1.0) or 1.0)
        color_filter = (getattr(scene, "color_filter", "none") or "none").lower()

        filter_parts = []

        # 1. Bounding Crop (if configured by user in UI)
        if isinstance(image_crop, dict) and "width" in image_crop and "height" in image_crop:
            try:
                cx = max(0.0, min(95.0, float(image_crop.get("x", 0))))
                cy = max(0.0, min(95.0, float(image_crop.get("y", 0))))
                cw = max(5.0, min(100.0 - cx, float(image_crop.get("width", 100))))
                ch = max(5.0, min(100.0 - cy, float(image_crop.get("height", 100))))
                if cw > 5 and ch > 5:
                    filter_parts.append(f"crop=iw*{cw/100:.3f}:ih*{ch/100:.3f}:iw*{cx/100:.3f}:ih*{cy/100:.3f}")
            except Exception:
                pass

        # 2. Image Fit & Motion Logic
        scale_2x_w = target_width * 2
        scale_2x_h = target_height * 2

        if image_fit == "blur":
            # Blurred Mirror Framing: Background is scaled to fill and blurred, foreground is scaled to fit inside
            blur_filter = (
                f"split[fg][bg];"
                f"[bg]scale={target_width}:{target_height}:force_original_aspect_ratio=increase,crop={target_width}:{target_height},boxblur=20:5,eq=brightness=-0.15[bgblur];"
                f"[fg]scale={target_width}:{target_height}:force_original_aspect_ratio=decrease[fgscaled];"
                f"[bgblur][fgscaled]overlay=(W-w)/2:(H-h)/2"
            )
            filter_parts.append(blur_filter)
        elif motion != "none":
            # Motion takes precedence with zoom factor scaling
            base_z = max(1.0, min(2.5, image_zoom))
            if motion == "slow zoom in":
                motion_filter = (
                    f"scale={scale_2x_w}:{scale_2x_h}:force_original_aspect_ratio=increase,crop={scale_2x_w}:{scale_2x_h},"
                    f"zoompan=z='min(zoom+0.0015,{base_z + 0.25:.2f})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={num_frames}:s={target_width}x{target_height}:fps={target_fps}"
                )
            elif motion == "slow zoom out":
                motion_filter = (
                    f"scale={scale_2x_w}:{scale_2x_h}:force_original_aspect_ratio=increase,crop={scale_2x_w}:{scale_2x_h},"
                    f"zoompan=z='if(lte(zoom,1.0),{base_z + 0.25:.2f},max(1.001,zoom-0.0015))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={num_frames}:s={target_width}x{target_height}:fps={target_fps}"
                )
            elif motion == "pan left":
                motion_filter = (
                    f"scale={scale_2x_w}:{scale_2x_h}:force_original_aspect_ratio=increase,crop={scale_2x_w}:{scale_2x_h},"
                    f"zoompan=z={base_z * 1.15:.2f}:x='if(lte(on,1),(iw-iw/zoom),max(0,x-(iw*0.15/{num_frames})))':y='ih/2-(ih/zoom/2)':d={num_frames}:s={target_width}x{target_height}:fps={target_fps}"
                )
            elif motion == "pan right":
                motion_filter = (
                    f"scale={scale_2x_w}:{scale_2x_h}:force_original_aspect_ratio=increase,crop={scale_2x_w}:{scale_2x_h},"
                    f"zoompan=z={base_z * 1.15:.2f}:x='min((iw-iw/zoom), x+(iw*0.15/{num_frames}))':y='ih/2-(ih/zoom/2)':d={num_frames}:s={target_width}x{target_height}:fps={target_fps}"
                )
            elif motion == "pan up":
                motion_filter = (
                    f"scale={scale_2x_w}:{scale_2x_h}:force_original_aspect_ratio=increase,crop={scale_2x_w}:{scale_2x_h},"
                    f"zoompan=z={base_z * 1.15:.2f}:x='iw/2-(iw/zoom/2)':y='if(lte(on,1),(ih-ih/zoom),max(0,y-(ih*0.15/{num_frames})))':d={num_frames}:s={target_width}x{target_height}:fps={target_fps}"
                )
            elif motion == "pan down":
                motion_filter = (
                    f"scale={scale_2x_w}:{scale_2x_h}:force_original_aspect_ratio=increase,crop={scale_2x_w}:{scale_2x_h},"
                    f"zoompan=z={base_z * 1.15:.2f}:x='iw/2-(iw/zoom/2)':y='min((ih-ih/zoom), y+(ih*0.15/{num_frames}))':d={num_frames}:s={target_width}x{target_height}:fps={target_fps}"
                )
            else:
                motion_filter = f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase,crop={target_width}:{target_height}"
            filter_parts.append(motion_filter)

        else:
            # Static framing with fit/position/zoom - strictly prevent stretching
            if image_fit == "contain":
                # Scale down to fit within bounding box and pad canvas with black background
                filter_parts.append(
                    f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,"
                    f"pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2:color=black"
                )
            else:
                # "cover", "fill", or unhandled fit defaults to stretch-free cover
                zoom_factor = max(1.0, min(2.5, image_zoom))
                if zoom_factor > 1.01:
                    filter_parts.append(f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase,scale=iw*{zoom_factor:.2f}:ih*{zoom_factor:.2f}")
                else:
                    filter_parts.append(f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase")

                if image_position == "top":
                    filter_parts.append(f"crop={target_width}:{target_height}:(in_w-out_w)/2:0")
                elif image_position == "bottom":
                    filter_parts.append(f"crop={target_width}:{target_height}:(in_w-out_w)/2:(in_h-out_h)")
                elif image_position == "left":
                    filter_parts.append(f"crop={target_width}:{target_height}:0:(in_h-out_h)/2")
                elif image_position == "right":
                    filter_parts.append(f"crop={target_width}:{target_height}:(in_w-out_w):(in_h-out_h)/2")
                else:  # "center"
                    filter_parts.append(f"crop={target_width}:{target_height}:(in_w-out_w)/2:(in_h-out_h)/2")

        # 3. Color Filter Presets
        if color_filter == "noir":
            filter_parts.append("hue=s=0,eq=contrast=1.2:brightness=-0.02")
        elif color_filter == "warm":
            filter_parts.append("colorbalance=rs=0.15:gs=0.05:bs=-0.15:rm=0.1:gm=0.03:bm=-0.1")
        elif color_filter == "cyberpunk":
            filter_parts.append("colorbalance=rs=-0.1:gs=0.05:bs=0.25:rh=0.2:gh=-0.05:bh=0.15,eq=saturation=1.3")
        elif color_filter == "cinematic":
            filter_parts.append("colorbalance=rs=-0.1:gs=0.02:bs=0.15:rh=0.18:gh=0.05:bh=-0.12,eq=contrast=1.1")
        elif color_filter == "vivid":
            filter_parts.append("eq=saturation=1.4:contrast=1.1")

        # 4. Color Grading (Brightness, Contrast, Saturation)
        brightness = max(-1.0, min(1.0, brightness))
        contrast = max(0.1, min(3.0, contrast))
        saturation = max(0.0, min(3.0, saturation))
        if abs(brightness) > 0.001 or abs(contrast - 1.0) > 0.001 or abs(saturation - 1.0) > 0.001:
            filter_parts.append(f"eq=brightness={brightness:.2f}:contrast={contrast:.2f}:saturation={saturation:.2f}")

        # 5. Transition Filter Logic
        if transition in ("fade", "crossfade") and trans_duration > 0 and duration > trans_duration:
            fade_start = duration - trans_duration
            filter_parts.append(f"fade=t=out:st={fade_start:.3f}:d={trans_duration:.3f}")

        # 6. Enforce SAR and target fps
        filter_parts.append("setsar=1")
        filter_parts.append(f"fps={target_fps}")

        return ",".join(filter_parts)


render_service = RenderService()

