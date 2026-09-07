import React, { useState } from "react";
import { Palette, Check, RefreshCw } from "lucide-react";
import type { OverallStyle } from "../../types";

interface OverallStyleSectionProps {
  style: OverallStyle;
  onSave: (updated: Partial<OverallStyle>) => Promise<any>;
}

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
