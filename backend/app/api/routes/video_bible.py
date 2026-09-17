from typing import Optional
from fastapi import APIRouter, Depends, Path, UploadFile, File, HTTPException, status
from app.schemas.video_bible import (
    VideoBibleSchema,
    VideoBibleUpdate,
    OverallStyleSchema,
    OverallStyleUpdate,
    CharacterSchema,
    CharacterCreate,
    CharacterUpdate,
    LocationSchema,
    LocationCreate,
    LocationUpdate,
    ObjectSchema,
    ObjectCreate,
    ObjectUpdate,
    ReferenceImageSchema,
    VisualContextResponse
)
from app.services.project_service import project_service
from app.services.visual_context import build_visual_context
from app.utils.errors import NotFoundException
from app.api.dependencies.auth import get_current_user, AuthenticatedUser

def require_owned_project(
    project_id: str = Path(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    project = project_service.get_project(project_id, owner_id=current_user.uid)
    if not project:
        raise NotFoundException("Project", project_id)
    return project

router = APIRouter(
    prefix="/projects/{project_id}/bible",
    tags=["video-bible"],
    dependencies=[Depends(require_owned_project)],
)

def _serialize_ref(ref) -> Optional[ReferenceImageSchema]:
    if not ref:
        return None
    url = getattr(ref, "url", None)
    # If the reference image lives in Firebase Storage, refresh into a fresh
    # signed URL so it keeps working after Render recycles its local disk.
    storage_path = getattr(ref, "storage_path", None)
    if storage_path and str(storage_path).startswith("users/"):
        try:
            from datetime import timedelta
            from app.configuration.firebase import get_storage_bucket
            bucket = get_storage_bucket()
            if bucket:
                url = bucket.blob(str(storage_path)).generate_signed_url(expiration=timedelta(days=7))
        except Exception:
            pass
    return ReferenceImageSchema(
        filename=ref.filename,
        url=url,
        file_size=ref.file_size
    )

def _serialize_bible(vb) -> VideoBibleSchema:
    style = vb.overall_style
    return VideoBibleSchema(
        overall_style=OverallStyleSchema(
            visual_style=style.visual_style,
            realism_level=style.realism_level,
            color_treatment=style.color_treatment,
            lighting=style.lighting,
            camera_style=style.camera_style,
            lens_cinematography=style.lens_cinematography,
            mood=style.mood
        ),
        characters=[
            CharacterSchema(
                id=c.id,
                name=c.name,
                description=c.description,
                appearance=c.appearance,
                clothing=c.clothing,
                age_range=c.age_range,
                personality=c.personality,
                reference_image=_serialize_ref(c.reference_image)
            )
            for c in vb.characters
        ],
        locations=[
            LocationSchema(
                id=loc.id,
                name=loc.name,
                description=loc.description,
                environment=loc.environment,
                lighting=loc.lighting,
                reference_image=_serialize_ref(loc.reference_image)
            )
            for loc in vb.locations
        ],
        objects=[
            ObjectSchema(
                id=obj.id,
                name=obj.name,
                description=obj.description,
                reference_image=_serialize_ref(obj.reference_image)
            )
            for obj in vb.objects
        ],
        rules=vb.rules
    )

@router.get("", response_model=VideoBibleSchema)
def get_video_bible(project_id: str):
    """Retrieves the project's Video Bible."""
    project = project_service.get_project(project_id)
    if not project:
        raise NotFoundException("Project", project_id)
    return _serialize_bible(project.video_bible)

@router.put("", response_model=VideoBibleSchema)
def update_video_bible(project_id: str, req: VideoBibleUpdate):
    """Updates overall visual style and/or global visual rules."""
    project = project_service.get_project(project_id)
    if not project:
        raise NotFoundException("Project", project_id)

    if req.overall_style:
        project_service.update_overall_style(project_id, req.overall_style)
    if req.rules is not None:
        project_service.update_rules(project_id, req.rules)

    updated_proj = project_service.get_project(project_id)
    return _serialize_bible(updated_proj.video_bible)

@router.get("/visual-context", response_model=VisualContextResponse)
def get_visual_context(project_id: str):
    """
    Executes build_visual_context(video_bible) to produce normalized visual-consistency
    data ready for downstream prompt synthesis.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise NotFoundException("Project", project_id)

    context = build_visual_context(project.video_bible)
    return VisualContextResponse(**context)


@router.post("/auto-extract", response_model=VideoBibleSchema)
async def auto_extract_video_bible(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Analyzes project captions and script narration to automatically extract
    recurring characters, environments/locations, key objects, and cinematic style,
    merging them directly into the Video Bible.
    """
    project = project_service.get_project(project_id, owner_id=current_user.uid)
    if not project:
        raise NotFoundException("Project", project_id)

    if not project.scenes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no parsed scenes or narration to analyze. Import captions in Stage 1 first."
        )

    captions_text = "\n".join(
        [f"Scene {idx+1}: {s.caption}" for idx, s in enumerate(project.scenes) if s.caption]
    )

    from app.services.llm.factory import get_llm_provider
    import json
    import re
    import uuid
    from app.models.video_bible import CharacterModel, LocationModel, ObjectModel

    provider = get_llm_provider(user_id=current_user.uid)
    extracted_data = {}

    prompt = (
        "You are an expert film director and AI video bible architect.\n"
        "Analyze this video script/narration and extract the recurring visual continuity elements.\n\n"
        f"Script scenes:\n{captions_text}\n\n"
        "Return a JSON object with:\n"
        "{\n"
        '  "visual_style": "Photorealistic cinematic / 3D Animation / Anime / etc",\n'
        '  "mood": "Dramatic, inspiring, mystery, etc",\n'
        '  "characters": [\n'
        '    {"name": "...", "description": "...", "appearance": "...", "clothing": "...", "age_range": "..."}\n'
        "  ],\n"
        '  "locations": [\n'
        '    {"name": "...", "description": "...", "environment": "...", "lighting": "..."}\n'
        "  ],\n"
        '  "objects": [\n'
        '    {"name": "...", "description": "..."}\n'
        "  ],\n"
        '  "rules": ["rule 1", "rule 2", "rule 3"]\n'
        "}\n"
        "Return pure valid JSON."
    )

    try:
        if hasattr(provider, "api_key") and provider.api_key and getattr(provider, "provider_name", "") in ("gemini", "openai", "openrouter"):
            if provider.provider_name == "gemini":
                import httpx
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{provider.model}:generateContent?key={provider.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.3}
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                        raw_clean = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
                        raw_clean = re.sub(r"\s*```$", "", raw_clean).strip()
                        extracted_data = json.loads(raw_clean)
            elif provider.provider_name in ("openai", "openrouter"):
                import httpx
                base = getattr(provider, "base_url", None) or "https://api.openai.com/v1"
                headers = {"Authorization": f"Bearer {provider.api_key}", "Content-Type": "application/json"}
                payload = {
                    "model": provider.model or "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(f"{base}/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        content_clean = re.sub(r"^```(?:json)?\s*", "", content.strip(), flags=re.IGNORECASE)
                        content_clean = re.sub(r"\s*```$", "", content_clean).strip()
                        extracted_data = json.loads(content_clean)
    except Exception as e:
        logger.warning(f"LLM extraction encountered error, falling back to heuristic parsing: {e}")

    # Fallback heuristic extraction if LLM didn't return characters or locations
    if not extracted_data.get("characters") and not extracted_data.get("locations"):
        extracted_data["visual_style"] = "Cinematic film"
        extracted_data["mood"] = "Immersive and cinematic"
        words = re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', " ".join([s.caption for s in project.scenes]))
        candidates = list(dict.fromkeys([w for w in words if len(w) > 3 and w.lower() not in ("scene", "deep", "with", "this", "then", "into", "from")]))[:3]
        
        extracted_data["characters"] = [
            {"name": candidates[0] if candidates else "Protagonist", "description": "Main narrative subject", "appearance": "Distinctive cinematic presence", "clothing": "Detailed wardrobe fitting the setting", "age_range": "Adult"}
        ]
        extracted_data["locations"] = [
            {"name": candidates[1] if len(candidates) > 1 else "Primary Setting", "description": "Key narrative environment featured in narration", "environment": "Rich detailed cinematic backdrop", "lighting": "Atmospheric cinematic lighting"}
        ]
        extracted_data["rules"] = ["Consistent cinematic lighting", "High detail texture", "No distorted faces or hands"]

    vb = project.video_bible
    if extracted_data.get("visual_style"):
        vb.overall_style.visual_style = extracted_data["visual_style"]
    if extracted_data.get("mood"):
        vb.overall_style.mood = extracted_data["mood"]

    for c in extracted_data.get("characters", []):
        name = c.get("name", "").strip()
        if name and not any(existing.name.lower() == name.lower() for existing in vb.characters):
            char_id = f"char-{uuid.uuid4().hex[:6]}"
            vb.characters.append(CharacterModel(
                id=char_id,
                name=name,
                description=c.get("description", ""),
                appearance=c.get("appearance", ""),
                clothing=c.get("clothing", ""),
                age_range=c.get("age_range", ""),
                personality=c.get("personality", "")
            ))

    for loc in extracted_data.get("locations", []):
        name = loc.get("name", "").strip()
        if name and not any(existing.name.lower() == name.lower() for existing in vb.locations):
            loc_id = f"loc-{uuid.uuid4().hex[:6]}"
            vb.locations.append(LocationModel(
                id=loc_id,
                name=name,
                description=loc.get("description", ""),
                environment=loc.get("environment", ""),
                lighting=loc.get("lighting", "")
            ))

    for obj in extracted_data.get("objects", []):
        name = obj.get("name", "").strip()
        if name and not any(existing.name.lower() == name.lower() for existing in vb.objects):
            obj_id = f"obj-{uuid.uuid4().hex[:6]}"
            vb.objects.append(ObjectModel(
                id=obj_id,
                name=name,
                description=obj.get("description", "")
            ))

    if extracted_data.get("rules"):
        merged_rules = list(dict.fromkeys(vb.rules + [r for r in extracted_data["rules"] if isinstance(r, str)]))
        vb.rules = merged_rules

    project_service._save_to_disk(project)
    return _serialize_bible(vb)

# Character endpoints
@router.post("/characters", response_model=CharacterSchema, status_code=status.HTTP_201_CREATED)
def add_character(project_id: str, data: CharacterCreate):
    """Adds a recurring character to the Video Bible."""
    try:
        char = project_service.add_character(project_id, data)
        return CharacterSchema(
            id=char.id,
            name=char.name,
            description=char.description,
            appearance=char.appearance,
            clothing=char.clothing,
            age_range=char.age_range,
            personality=char.personality,
            reference_image=_serialize_ref(char.reference_image)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/characters/{char_id}", response_model=CharacterSchema)
def update_character(project_id: str, char_id: str, update: CharacterUpdate):
    """Edits a recurring character."""
    try:
        char = project_service.update_character(project_id, char_id, update)
        return CharacterSchema(
            id=char.id,
            name=char.name,
            description=char.description,
            appearance=char.appearance,
            clothing=char.clothing,
            age_range=char.age_range,
            personality=char.personality,
            reference_image=_serialize_ref(char.reference_image)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/characters/{char_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_character(project_id: str, char_id: str):
    """Deletes a character from the Video Bible."""
    deleted = project_service.delete_character(project_id, char_id)
    if not deleted:
        raise NotFoundException("Character", char_id)
    return None

@router.post("/characters/{char_id}/reference", response_model=ReferenceImageSchema)
async def upload_character_reference(project_id: str, char_id: str, file: UploadFile = File(...)):
    """Uploads a reference image for a character."""
    content = await file.read()
    try:
        ref = project_service.save_reference_image(
            project_id=project_id,
            entity_type="character",
            entity_id=char_id,
            filename=file.filename or "reference.png",
            content=content
        )
        return _serialize_ref(ref)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/characters/{char_id}/reference", status_code=status.HTTP_204_NO_CONTENT)
def delete_character_reference(project_id: str, char_id: str):
    """Removes the reference image from a character."""
    deleted = project_service.delete_reference_image(project_id, "character", char_id)
    if not deleted:
        raise NotFoundException("Character", char_id)
    return None

# Location endpoints
@router.post("/locations", response_model=LocationSchema, status_code=status.HTTP_201_CREATED)
def add_location(project_id: str, data: LocationCreate):
    """Adds a recurring location to the Video Bible."""
    try:
        loc = project_service.add_location(project_id, data)
        return LocationSchema(
            id=loc.id,
            name=loc.name,
            description=loc.description,
            environment=loc.environment,
            lighting=loc.lighting,
            reference_image=_serialize_ref(loc.reference_image)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/locations/{loc_id}", response_model=LocationSchema)
def update_location(project_id: str, loc_id: str, update: LocationUpdate):
    """Edits a recurring location."""
    try:
        loc = project_service.update_location(project_id, loc_id, update)
        return LocationSchema(
            id=loc.id,
            name=loc.name,
            description=loc.description,
            environment=loc.environment,
            lighting=loc.lighting,
            reference_image=_serialize_ref(loc.reference_image)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/locations/{loc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(project_id: str, loc_id: str):
    """Deletes a location from the Video Bible."""
    deleted = project_service.delete_location(project_id, loc_id)
    if not deleted:
        raise NotFoundException("Location", loc_id)
    return None

@router.post("/locations/{loc_id}/reference", response_model=ReferenceImageSchema)
async def upload_location_reference(project_id: str, loc_id: str, file: UploadFile = File(...)):
    """Uploads a reference image for a location."""
    content = await file.read()
    try:
        ref = project_service.save_reference_image(
            project_id=project_id,
            entity_type="location",
            entity_id=loc_id,
            filename=file.filename or "reference.png",
            content=content
        )
        return _serialize_ref(ref)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/locations/{loc_id}/reference", status_code=status.HTTP_204_NO_CONTENT)
def delete_location_reference(project_id: str, loc_id: str):
    """Removes the reference image from a location."""
    deleted = project_service.delete_reference_image(project_id, "location", loc_id)
    if not deleted:
        raise NotFoundException("Location", loc_id)
    return None


# Object endpoints
@router.post("/objects", response_model=ObjectSchema, status_code=status.HTTP_201_CREATED)
def add_object(project_id: str, data: ObjectCreate):
    """Adds a recurring object to the Video Bible."""
    try:
        obj = project_service.add_object(project_id, data)
        return ObjectSchema(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            reference_image=_serialize_ref(obj.reference_image)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/objects/{obj_id}", response_model=ObjectSchema)
def update_object(project_id: str, obj_id: str, update: ObjectUpdate):
    """Edits a recurring object."""
    try:
        obj = project_service.update_object(project_id, obj_id, update)
        return ObjectSchema(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            reference_image=_serialize_ref(obj.reference_image)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/objects/{obj_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_object(project_id: str, obj_id: str):
    """Deletes an object from the Video Bible."""
    deleted = project_service.delete_object(project_id, obj_id)
    if not deleted:
        raise NotFoundException("Object", obj_id)
    return None

@router.post("/objects/{obj_id}/reference", response_model=ReferenceImageSchema)
async def upload_object_reference(project_id: str, obj_id: str, file: UploadFile = File(...)):
    """Uploads a reference image for an object."""
    content = await file.read()
    try:
        ref = project_service.save_reference_image(
            project_id=project_id,
            entity_type="object",
            entity_id=obj_id,
            filename=file.filename or "reference.png",
            content=content
        )
        return _serialize_ref(ref)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/objects/{obj_id}/reference", status_code=status.HTTP_204_NO_CONTENT)
def delete_object_reference(project_id: str, obj_id: str):
    """Removes the reference image from an object."""
    deleted = project_service.delete_reference_image(project_id, "object", obj_id)
    if not deleted:
        raise NotFoundException("Object", obj_id)
    return None

