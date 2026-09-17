import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict

from app.api.dependencies.auth import get_current_user, AuthenticatedUser
from app.services.project_service import project_service
from app.services.caption_parser import parse_and_validate_captions
from app.services.tts_service import tts_service
from app.schemas.project import (
    ProjectResponse,
    ProjectCreate,
    GenerateVoiceoverRequest,
    ImportTTSProjectRequest,
)
from app.api.routes.projects import _to_project_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["tts"])


@router.get(
    "/tts/voices",
    response_model=List[Dict[str, str]],
    summary="List curated Microsoft Edge-TTS neural voices",
)
def list_voices():
    """Returns the list of curated neural voices for voiceover generation."""
    return tts_service.list_voices()


@router.post(
    "/projects/{project_id}/generate-voiceover",
    response_model=ProjectResponse,
    summary="Generate voiceover narration and build timeline from script using Edge-TTS",
)
async def generate_voiceover_for_project(
    project_id: str,
    req: GenerateVoiceoverRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Synthesizes the provided script text into a high-quality neural voiceover MP3 using Edge-TTS,
    extracts synchronized subtitle timestamps, updates the project with the audio and timeline scenes,
    and returns the updated project immediately.
    """
    project = project_service.get_project(project_id, owner_id=current_user.uid)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found.",
        )

    try:
        # 1. Synthesize audio + synchronized SRT via Edge-TTS
        audio_bytes, srt_content = await tts_service.generate_voiceover_and_srt(
            script_text=req.script_text,
            voice=req.voice,
            rate_multiplier=req.speed or 1.0,
        )

        # 2. Parse and validate generated SRT captions into scenes
        parse_result = parse_and_validate_captions(srt_content)
        if not parse_result.valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to generate timeline scenes from voiceover timestamps: {'; '.join(parse_result.errors)}",
            )

        # 3. Save audio file into project storage
        project_service.save_audio(
            project_id=project_id,
            filename=f"voiceover_{req.voice or 'default'}.mp3",
            content=audio_bytes,
            content_type="audio/mpeg",
            owner_id=current_user.uid,
        )

        # 4. Save parsed scenes and raw captions into project
        updated_project = project_service.set_captions_and_scenes(
            project_id=project_id,
            raw_captions=srt_content,
            scenes=parse_result.scenes,
            owner_id=current_user.uid,
        )

        return _to_project_response(updated_project)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate voiceover failed for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to synthesize voiceover: {str(e)}",
        )


@router.post(
    "/projects/import-tts",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a project and generate voiceover + timeline from script in 1 step",
)
async def import_tts_project(
    req: ImportTTSProjectRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Creates a new project and synthesizes the script into audio and timeline scenes in one atomic operation.
    """
    parse_result_initial = parse_and_validate_captions(req.script_text)

    # 1. Create empty project
    created = project_service.create_project(
        ProjectCreate(
            name=req.name or "Script Narration Video",
            description=req.description or "Generated from Edge-TTS script narration",
        ),
        owner_id=current_user.uid,
    )

    try:
        # 2. Synthesize audio + synchronized SRT via Edge-TTS
        audio_bytes, srt_content = await tts_service.generate_voiceover_and_srt(
            script_text=req.script_text,
            voice=req.voice,
            rate_multiplier=req.speed or 1.0,
        )

        # 3. Parse synchronized SRT captions into timestamped scenes
        parse_result = parse_and_validate_captions(srt_content)
        if not parse_result.valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse synchronized captions: {'; '.join(parse_result.errors)}",
            )

        # 4. Save audio file
        project_service.save_audio(
            project_id=created.id,
            filename=f"voiceover_{req.voice or 'default'}.mp3",
            content=audio_bytes,
            content_type="audio/mpeg",
            owner_id=current_user.uid,
        )

        # 5. Save scenes
        updated_project = project_service.set_captions_and_scenes(
            project_id=created.id,
            raw_captions=srt_content,
            scenes=parse_result.scenes,
            owner_id=current_user.uid,
        )

        return _to_project_response(updated_project)

    except Exception as e:
        # Clean up project if synthesis failed
        project_service.delete_project(created.id, owner_id=current_user.uid)
        logger.error(f"Import TTS project failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project from script: {str(e)}",
        )
