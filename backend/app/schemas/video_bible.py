from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ReferenceImageSchema(BaseModel):
    filename: str
    url: str
    file_size: int

class OverallStyleSchema(BaseModel):
    visual_style: str = "Cinematic film"
    realism_level: str = "Photorealistic"
    color_treatment: str = "Rich contrast, cinematic film-grade color palette with natural skin tones"
    lighting: str = "Atmospheric natural lighting with subtle directional rim lights"
    camera_style: str = "Eye-level medium shots, smooth cinematic motion"
    lens_cinematography: str = "35mm prime lens, shallow depth of field, f/2.0"
    mood: str = "Dramatic, engaging, immersive"

class OverallStyleUpdate(BaseModel):
    visual_style: Optional[str] = None
    realism_level: Optional[str] = None
    color_treatment: Optional[str] = None
    lighting: Optional[str] = None
    camera_style: Optional[str] = None
    lens_cinematography: Optional[str] = None
    mood: Optional[str] = None

class CharacterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = ""
    appearance: Optional[str] = ""
    clothing: Optional[str] = ""
    age_range: Optional[str] = ""
    personality: Optional[str] = ""

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    appearance: Optional[str] = None
    clothing: Optional[str] = None
    age_range: Optional[str] = None
    personality: Optional[str] = None

class CharacterSchema(BaseModel):
    id: str
    name: str
    description: str = ""
    appearance: str = ""
    clothing: str = ""
    age_range: str = ""
    personality: str = ""
    reference_image: Optional[ReferenceImageSchema] = None

class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = ""
    environment: Optional[str] = ""
    lighting: Optional[str] = ""

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    environment: Optional[str] = None
    lighting: Optional[str] = None

class LocationSchema(BaseModel):
    id: str
    name: str
    description: str = ""
    environment: str = ""
    lighting: str = ""
    reference_image: Optional[ReferenceImageSchema] = None

class ObjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = ""

class ObjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ObjectSchema(BaseModel):
    id: str
    name: str
    description: str = ""
    reference_image: Optional[ReferenceImageSchema] = None

class VideoBibleSchema(BaseModel):
    overall_style: OverallStyleSchema
    characters: List[CharacterSchema] = Field(default_factory=list)
    locations: List[LocationSchema] = Field(default_factory=list)
    objects: List[ObjectSchema] = Field(default_factory=list)
    rules: List[str] = Field(default_factory=list)

class VideoBibleUpdate(BaseModel):
    overall_style: Optional[OverallStyleUpdate] = None
    rules: Optional[List[str]] = None

class VisualContextResponse(BaseModel):
    style_prompt_fragment: str
    characters_catalog: Dict[str, Any]
    locations_catalog: Dict[str, Any]
    objects_catalog: Dict[str, Any]
    active_rules: List[str]
    reference_images_catalog: List[Dict[str, Any]]
