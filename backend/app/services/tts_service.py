import asyncio
import io
import logging
from typing import Dict, List, Optional, Tuple
try:
    import edge_tts
except ImportError:
    edge_tts = None

logger = logging.getLogger(__name__)

CURATED_VOICES = [
    {
        "id": "en-US-ChristopherNeural",
        "name": "Christopher (US Documentary Male)",
        "gender": "Male",
        "locale": "en-US",
        "style": "Deep, authoritative, cinematic documentary narration",
    },
    {
        "id": "en-US-JennyNeural",
        "name": "Jenny (US Natural Female)",
        "gender": "Female",
        "locale": "en-US",
        "style": "Clear, friendly, engaging storytelling",
    },
    {
        "id": "en-US-GuyNeural",
        "name": "Guy (US Conversational Male)",
        "gender": "Male",
        "locale": "en-US",
        "style": "Warm, relatable, everyday explainer",
    },
    {
        "id": "en-GB-SoniaNeural",
        "name": "Sonia (UK Narrative Female)",
        "gender": "Female",
        "locale": "en-GB",
        "style": "Refined British narrative voice",
    },
    {
        "id": "en-GB-RyanNeural",
        "name": "Ryan (UK Energetic Male)",
        "gender": "Male",
        "locale": "en-GB",
        "style": "Dynamic, upbeat British accent",
    },
    {
        "id": "en-IN-NeerjaNeural",
        "name": "Neerja (Indian English Female)",
        "gender": "Female",
        "locale": "en-IN",
        "style": "Professional, articulate Indian English",
    },
    {
        "id": "en-IN-PrabhatNeural",
        "name": "Prabhat (Indian English Male)",
        "gender": "Male",
        "locale": "en-IN",
        "style": "Clear, confident Indian English narration",
    },
    {
        "id": "en-AU-WilliamMultilingualNeural",
        "name": "William (Australian Male)",
        "gender": "Male",
        "locale": "en-AU",
        "style": "Calm, natural Australian voice",
    },
]

DEFAULT_VOICE = "en-US-ChristopherNeural"


class TTSService:
    def __init__(self):
        self.voices = CURATED_VOICES

    def list_voices(self) -> List[Dict[str, str]]:
        """Returns list of curated edge-tts voices."""
        return self.voices

    async def generate_voiceover_and_srt(
        self,
        script_text: str,
        voice: Optional[str] = None,
        rate_multiplier: float = 1.0,
    ) -> Tuple[bytes, str]:
        """
        Synthesizes script_text to an MP3 audio stream using edge-tts
        and returns both audio bytes and synchronized SRT subtitle text.
        """
        if edge_tts is None:
            raise RuntimeError("edge-tts library is not installed. Please install edge-tts to use voiceover generation.")

        clean_text = script_text.strip()
        if not clean_text:
            raise ValueError("Script text cannot be empty.")

        selected_voice = voice if voice and any(v["id"] == voice for v in self.voices) else DEFAULT_VOICE

        # Format rate string e.g. "+10%" or "-15%"
        rate_diff = int(round((rate_multiplier - 1.0) * 100))
        rate_str = f"{rate_diff:+d}%" if rate_diff != 0 else "+0%"

        communicate = edge_tts.Communicate(
            text=clean_text,
            voice=selected_voice,
            rate=rate_str,
        )

        submaker = edge_tts.SubMaker()
        audio_buffer = io.BytesIO()

        try:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])
                elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                    submaker.feed(chunk)
        except Exception as e:
            logger.error(f"Edge-TTS synthesis error: {e}")
            raise RuntimeError(f"Edge-TTS generation failed: {e}")

        audio_bytes = audio_buffer.getvalue()
        if not audio_bytes:
            raise RuntimeError("Edge-TTS produced an empty audio stream.")

        srt_content = submaker.get_srt()

        # Fallback if no sentence boundary events were emitted (e.g. extremely short single word)
        if not srt_content or not srt_content.strip():
            srt_content = f"1\n00:00:00,000 --> 00:00:03,000\n{clean_text}\n\n"

        return audio_bytes, srt_content


tts_service = TTSService()
