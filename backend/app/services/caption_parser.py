import re
from typing import List, Tuple, Optional
from app.models.scene import SceneModel

TIMESTAMP_REGEX = re.compile(
    r"^\s*\[?(\d{1,2}(?::\d{1,2}){1,2}(?:[,\.]\d{1,3})?)\s*(?:-->|→|–|—|-|to)\s*(\d{1,2}(?::\d{1,2}){1,2}(?:[,\.]\d{1,3})?)(?:\s+[^\]\n]+)?\]?\s*$",
    re.UNICODE
)

def parse_time_to_seconds(tc: str) -> Optional[float]:
    """
    Parses timecode string (hh:mm:ss, mm:ss, with optional decimal fractions) into seconds as float.
    Returns None if format or time values are invalid.
    """
    try:
        clean_tc = tc.strip().replace(",", ".")
        parts = clean_tc.split(":")
        
        if len(parts) == 3:
            # hh:mm:ss.mmm
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds = float(parts[2])
            if minutes < 0 or minutes >= 60:
                return None
            if seconds < 0 or seconds >= 60:
                return None
            if hours < 0:
                return None
            return round(hours * 3600 + minutes * 60 + seconds, 3)

        elif len(parts) == 2:
            # mm:ss.mmm
            minutes = int(parts[0])
            seconds = float(parts[1])
            if seconds < 0 or seconds >= 60:
                return None
            if minutes < 0:
                return None
            return round(minutes * 60 + seconds, 3)

        elif len(parts) == 1:
            seconds = float(parts[0])
            return round(seconds, 3) if seconds >= 0 else None

        return None
    except (ValueError, TypeError):
        return None

def clean_caption_text(text: str) -> str:
    """Strips HTML formatting and collapses whitespace."""
    # Strip HTML tags
    cleaned = re.sub(r"<[^>]+>", "", text)
    # Strip leading speaker indicators e.g. "Speaker 1:" or "Narrator:"
    cleaned = re.sub(r"^\[?[A-Za-z0-9\s_\-]+\]?:\s*", "", cleaned)
    # Collapse whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

class CaptionParseResult:
    def __init__(self, valid: bool, scenes: List[SceneModel], errors: List[str]):
        self.valid = valid
        self.scenes = scenes
        self.errors = errors

def parse_and_validate_captions(raw_input: str) -> CaptionParseResult:
    """
    Parses raw Clipchamp timestamped captions and enforces validation rules:
    - Missing timestamps
    - Invalid timestamps
    - End before start (or start == end)
    - Overlapping scenes
    - Duplicate timestamps
    - Empty captions
    """
    errors: List[str] = []
    scenes: List[SceneModel] = []

    clean_input = raw_input.lstrip("\ufeff")
    if not clean_input or not clean_input.strip():
        return CaptionParseResult(valid=False, scenes=[], errors=["Input is empty. Please upload or paste captions."])

    lines = clean_input.replace("\r\n", "\n").replace("\r", "\n").split("\n")

    # Group lines into blocks based on timestamp lines
    raw_blocks: List[Tuple[int, str, str, List[str]]] = []  # (line_num, start_str, end_str, caption_lines)
    current_time: Optional[Tuple[int, str, str]] = None
    current_captions: List[str] = []
    orphan_text_before_first_time: List[Tuple[int, str]] = []

    for line_idx, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped:
            continue
        
        # Skip pure WebVTT header, comments, or SRT index numbers
        if (
            stripped.upper().startswith("WEBVTT")
            or stripped.startswith("NOTE")
            or stripped.startswith("STYLE")
            or (stripped.isdigit() and len(stripped) <= 6)
        ):
            continue

        match = TIMESTAMP_REGEX.match(stripped)
        if match:
            if current_time is not None:
                raw_blocks.append((current_time[0], current_time[1], current_time[2], current_captions))
                current_captions = []
            current_time = (line_idx, match.group(1), match.group(2))
        else:
            if current_time is None:
                orphan_text_before_first_time.append((line_idx, stripped))
            else:
                current_captions.append(stripped)

    # Append trailing block
    if current_time is not None:
        raw_blocks.append((current_time[0], current_time[1], current_time[2], current_captions))

    # Check for missing timestamps
    if orphan_text_before_first_time:
        for line_num, text in orphan_text_before_first_time:
            errors.append(f"Line {line_num}: Missing timestamp for text '{text[:40]}...'.")

    if not raw_blocks:
        errors.append("Missing timestamps: No valid timestamp lines detected. Expected format like '00:00 - 00:05'.")
        return CaptionParseResult(valid=False, scenes=[], errors=errors)

    # Process each block
    seen_start_times: dict[float, int] = {}
    prev_end: Optional[float] = None

    for scene_idx, (line_num, start_str, end_str, cap_lines) in enumerate(raw_blocks, 1):
        scene_id = f"scene-{scene_idx:03d}"
        
        # 1. Validate timestamps syntax
        start_sec = parse_time_to_seconds(start_str)
        end_sec = parse_time_to_seconds(end_str)

        if start_sec is None:
            errors.append(f"Line {line_num} ({scene_id}): Invalid start timestamp '{start_str}'.")
        if end_sec is None:
            errors.append(f"Line {line_num} ({scene_id}): Invalid end timestamp '{end_str}'.")

        if start_sec is None or end_sec is None:
            continue

        # 2. Check end before start or zero duration
        if end_sec <= start_sec:
            errors.append(
                f"Line {line_num} ({scene_id}): End timestamp ({end_str} / {end_sec}s) must be greater than start timestamp ({start_str} / {start_sec}s)."
            )

        # 3. Check duplicate start timestamps
        if start_sec in seen_start_times:
            errors.append(
                f"Line {line_num} ({scene_id}): Duplicate start timestamp {start_str} (identical to scene-{seen_start_times[start_sec]:03d})."
            )
        else:
            seen_start_times[start_sec] = scene_idx

        # 4. Check overlapping scenes
        if prev_end is not None and start_sec < prev_end:
            errors.append(
                f"Line {line_num} ({scene_id}): Overlapping scene detected. Starts at {start_sec}s, but previous scene ends at {prev_end}s."
            )

        # 5. Check empty captions
        raw_caption = " ".join(cap_lines).strip()
        cleaned_caption = clean_caption_text(raw_caption)

        if not cleaned_caption:
            errors.append(f"Line {line_num} ({scene_id}): Empty caption text for time range {start_str} -> {end_str}.")

        duration = round(end_sec - start_sec, 3) if end_sec > start_sec else 0.0

        scenes.append(
            SceneModel(
                id=scene_id,
                start=start_sec,
                end=end_sec,
                duration=duration,
                caption=cleaned_caption
            )
        )
        prev_end = end_sec

    is_valid = len(errors) == 0
    return CaptionParseResult(valid=is_valid, scenes=scenes if is_valid else [], errors=errors)
