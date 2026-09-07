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
    return ReferenceImageSchema(
        filename=ref.filename,
        url=ref.url,
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
