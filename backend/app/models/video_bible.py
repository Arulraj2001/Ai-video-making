from dataclasses import dataclass, field
from typing import Optional, List

@dataclass
class ReferenceImageModel:
    filename: str
    storage_path: str
    url: str
    file_size: int

@dataclass
class OverallStyleModel:
    visual_style: str = "Cinematic film"
    realism_level: str = "Photorealistic"
    color_treatment: str = "Rich contrast, cinematic film-grade color palette with natural skin tones"
    lighting: str = "Atmospheric natural lighting with subtle directional rim lights"
    camera_style: str = "Eye-level medium shots, smooth cinematic motion"
    lens_cinematography: str = "35mm prime lens, shallow depth of field, f/2.0"
    mood: str = "Dramatic, engaging, immersive"

@dataclass
class CharacterModel:
    id: str
    name: str
    description: str = ""
    appearance: str = ""
    clothing: str = ""
    age_range: str = ""
    personality: str = ""
    reference_image: Optional[ReferenceImageModel] = None

@dataclass
class LocationModel:
    id: str
    name: str
    description: str = ""
    environment: str = ""
    lighting: str = ""
    reference_image: Optional[ReferenceImageModel] = None

@dataclass
class ObjectModel:
    id: str
    name: str
    description: str = ""
    reference_image: Optional[ReferenceImageModel] = None

@dataclass
class VideoBibleModel:
    overall_style: OverallStyleModel = field(default_factory=OverallStyleModel)
    characters: List[CharacterModel] = field(default_factory=list)
    locations: List[LocationModel] = field(default_factory=list)
    objects: List[ObjectModel] = field(default_factory=list)
    rules: List[str] = field(default_factory=lambda: ["cinematic", "realistic", "documentary"])
