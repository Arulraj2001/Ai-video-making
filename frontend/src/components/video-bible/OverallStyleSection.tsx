import React, { useState, useEffect } from "react";
import { Palette, Check, RefreshCw, Sparkles } from "lucide-react";
import type { OverallStyle } from "../../types";

interface OverallStyleSectionProps {
  style: OverallStyle;
  onSave: (updated: Partial<OverallStyle>) => Promise<any>;
}

const CURATED_PRESETS = [
  {
    id: "cinematic",
    label: "Cinematic Film",
    realism_level: "Photorealistic",
    color_treatment: "Rich contrast, cinematic film-grade color palette with natural skin tones",
    lighting: "Atmospheric natural lighting with subtle directional rim lights",
    camera_style: "Eye-level medium shots, smooth cinematic motion",
    lens_cinematography: "35mm prime lens, shallow depth of field, f/2.0",
    mood: "Dramatic, engaging, immersive",
  },
  {
    id: "documentary",
    label: "Documentary",
    realism_level: "Photorealistic",
    color_treatment: "Authentic restrained color, natural daylight grading",
    lighting: "Available-light realism, natural ambient environment",
    camera_style: "Observational handheld or steady documentary framing",
    lens_cinematography: "50mm prime lens, natural depth of field",
    mood: "Honest, grounded, journalistic",
  },
  {
    id: "3d",
    label: "Stylized 3D Animation",
    realism_level: "Stylized 3D Animation",
    color_treatment: "Vibrant saturated color palette with rich specular highlights",
    lighting: "Directional 3D key and fill lighting with soft bounce",
    camera_style: "Dynamic animated angles, expressive framing",
    lens_cinematography: "Digital cinematic camera, clean spatial depth",
    mood: "Enchanting, vibrant, playful",
  },
  {
    id: "anime",
    label: "2D Anime / Manga",
    realism_level: "2D Anime / Manga",
    color_treatment: "Coherent expressive anime color palette with bold accents",
    lighting: "Dramatic cel-shaded lighting with rim illumination",
    camera_style: "Dynamic illustrated camera angles, dramatic silhouettes",
    lens_cinematography: "Wide angle illustrated perspective",
    mood: "Expressive, energetic, cinematic",
  },
  {
    id: "sketch",
    label: "Hand Drawn Sketch",
    realism_level: "Oil Painting / Painterly",
    color_treatment: "Pencil & ink sketch rendering, natural paper tones",
    lighting: "Soft illustrative shading",
    camera_style: "Observational varied framing with generous negative space",
    lens_cinematography: "Artistic illustrative perspective",
    mood: "Thoughtful, human, expressive",
  },
  {
    id: "vintage",
    label: "Vintage 1980s Film",
    realism_level: "Vintage 1980s Film Grain",
    color_treatment: "Warm retro 1980s tones, muted greens, golden flares",
    lighting: "Warm tungsten interior light, soft nostalgic haze",
    camera_style: "Vintage zoom lens framing, retro composition",
    lens_cinematography: "Vintage anamorphic glass, subtle halation and film grain",
    mood: "Nostalgic, gritty, retro",
  },
];

export const OverallStyleSection: React.FC<OverallStyleSectionProps> = ({ style, onSave }) => {
  const [visualStyle, setVisualStyle] = useState(style.visual_style || "Cinematic film");
  const [realismLevel, setRealismLevel] = useState(style.realism_level || "Photorealistic");
  const [colorTreatment, setColorTreatment] = useState(style.color_treatment || "");
  const [lighting, setLighting] = useState(style.lighting || "");
  const [cameraStyle, setCameraStyle] = useState(style.camera_style || "");
  const [lensCinematography, setLensCinematography] = useState(style.lens_cinematography || "");
  const [mood, setMood] = useState(style.mood || "");

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Synchronize state whenever style prop changes (fixes stale state on AI auto-extract)
  useEffect(() => {
    if (style) {
      setVisualStyle(style.visual_style || "Cinematic film");
      setRealismLevel(style.realism_level || "Photorealistic");
      setColorTreatment(style.color_treatment || "");
      setLighting(style.lighting || "");
      setCameraStyle(style.camera_style || "");
      setLensCinematography(style.lens_cinematography || "");
      setMood(style.mood || "");
    }
  }, [style]);

  const handleApplyPreset = (preset: typeof CURATED_PRESETS[0]) => {
    setVisualStyle(preset.label);
    setRealismLevel(preset.realism_level);
    setColorTreatment(preset.color_treatment);
    setLighting(preset.lighting);
    setCameraStyle(preset.camera_style);
    setLensCinematography(preset.lens_cinematography);
    setMood(preset.mood);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave({
        visual_style: visualStyle.trim(),
        realism_level: realismLevel.trim(),
        color_treatment: colorTreatment.trim(),
        lighting: lighting.trim(),
        camera_style: cameraStyle.trim(),
        lens_cinematography: lensCinematography.trim(),
        mood: mood.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-indigo-400" />
          <h4 className="text-sm font-bold font-display uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Overall Visual Style & Cinematography
          </h4>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary text-xs py-1.5 px-4"
        >
          {saving ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : savedSuccess ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span>Saved!</span>
            </>
          ) : (
            <span>Save Style Settings</span>
          )}
        </button>
      </div>

      {/* Curated Preset Buttons */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-400" />
          <span>Quick-Apply Curated Style Preset</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CURATED_PRESETS.map((preset) => {
            const isActive = visualStyle.toLowerCase() === preset.label.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`text-xs py-1 px-3 rounded-full border transition-all ${
                  isActive
                    ? "bg-indigo-600/30 border-indigo-400 text-indigo-300 font-semibold shadow-xs"
                    : "bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/[0.06]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visual Style */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Visual Style
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Cinematic Film, Cyberpunk Noir, High-Fantasy Epic"
            value={visualStyle}
            onChange={(e) => setVisualStyle(e.target.value)}
            className="input-text"
          />
        </div>

        {/* Realism Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Realism Level
          </label>
          <select
            value={realismLevel}
            onChange={(e) => setRealismLevel(e.target.value)}
            className="select-custom"
          >
            <option value="Photorealistic">Photorealistic</option>
            <option value="Hyperrealistic">Hyperrealistic</option>
            <option value="Stylized 3D Animation">Stylized 3D Animation</option>
            <option value="2D Anime / Manga">2D Anime / Manga</option>
            <option value="Oil Painting / Painterly">Oil Painting / Painterly</option>
            <option value="Vintage 1980s Film Grain">Vintage 1980s Film Grain</option>
          </select>
        </div>

        {/* Mood */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Mood & Atmosphere
          </label>
          <input
            type="text"
            placeholder="e.g. Mysterious, contemplative, high-stakes dystopian tension"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="input-text"
          />
        </div>

        {/* Lighting */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Lighting Treatment
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Volumetric directional rim lighting, deep atmospheric shadows, soft natural window light"
            value={lighting}
            onChange={(e) => setLighting(e.target.value)}
            className="textarea-custom text-xs"
          />
        </div>

        {/* Color Treatment */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Color Grading & Palette
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Rich contrast, cinematic teal and orange tones, desaturated earth tones with neon accents"
            value={colorTreatment}
            onChange={(e) => setColorTreatment(e.target.value)}
            className="textarea-custom text-xs"
          />
        </div>

        {/* Camera Style */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Camera Style & Angles
          </label>
          <input
            type="text"
            placeholder="e.g. Eye-level medium shots, slow tracking push-in, low-angle hero framing"
            value={cameraStyle}
            onChange={(e) => setCameraStyle(e.target.value)}
            className="input-text"
          />
        </div>

        {/* Lens / Cinematography */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Lens & Cinematography
          </label>
          <input
            type="text"
            placeholder="e.g. 35mm anamorphic prime lens, f/1.8 shallow depth of field, sharp foreground bokeh"
            value={lensCinematography}
            onChange={(e) => setLensCinematography(e.target.value)}
            className="input-text"
          />
        </div>
      </div>
    </form>
  );
};
