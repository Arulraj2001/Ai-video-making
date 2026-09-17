import React, { useState, useEffect, useRef } from "react";
import { Scissors, Copy, Trash2 } from "lucide-react";
import type { Project, Scene, ImageMotion, TransitionType, ImageFit, ImagePosition, ImageCrop, ColorFilter } from "../../types/project";
import { api } from "../../services/api";

interface SceneInspectorProps {
  project: Project;
  scene: Scene;
  currentTime: number;
  onUpdateScene: (updatedScene: Partial<Scene>, ripple?: boolean) => Promise<void>;
  onSplitScene: (sceneId: string, splitTime: number) => Promise<void>;
  onDuplicateScene: (sceneId: string) => Promise<void>;
  onDeleteScene: (sceneId: string) => Promise<void>;
  onMoveScene: (sceneId: string, direction: "earlier" | "later") => Promise<void>;
  onRegenerateImage: (sceneId: string, promptOverride?: string) => Promise<void>;
  onUploadImage: (sceneId: string, file: File) => Promise<void>;
  onShowToast?: (message: string, type?: "error" | "success" | "info") => void;
}

const MOTION_OPTIONS: { value: ImageMotion; label: string; icon: string }[] = [
  { value: "none", label: "None (Static)", icon: "⏸" },
  { value: "slow zoom in", label: "Slow Zoom In", icon: "🔍" },
  { value: "slow zoom out", label: "Slow Zoom Out", icon: "🔎" },
  { value: "pan left", label: "Pan Left", icon: "⬅" },
  { value: "pan right", label: "Pan Right", icon: "➡" },
  { value: "pan up", label: "Pan Up", icon: "⬆" },
  { value: "pan down", label: "Pan Down", icon: "⬇" },
];

const TRANSITION_OPTIONS: { value: TransitionType; label: string; icon: string }[] = [
  { value: "none", label: "None (Cut)", icon: "✂" },
  { value: "fade", label: "Fade (Black)", icon: "🌑" },
  { value: "crossfade", label: "Crossfade", icon: "⚡" },
  { value: "slide", label: "Slide Left", icon: "➡" },
];

const COLOR_FILTER_OPTIONS: { value: ColorFilter; label: string; previewColor: string; description: string }[] = [
  { value: "none", label: "Normal", previewColor: "#a1a1aa", description: "Default natural lighting" },
  { value: "cinematic", label: "Cinematic", previewColor: "#0284c7", description: "Teal shadows & warm highlights" },
  { value: "warm", label: "Golden Hour", previewColor: "#d97706", description: "Rich sunset warmth & golden skin" },
  { value: "cyberpunk", label: "Cyberpunk", previewColor: "#db2777", description: "Electric neon & deep blue tone" },
  { value: "noir", label: "Noir B&W", previewColor: "#52525b", description: "High-contrast monochrome drama" },
  { value: "vivid", label: "Vivid Pop", previewColor: "#059669", description: "Punchy, saturated brilliance" },
];

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  project,
  scene,
  currentTime,
  onUpdateScene,
  onSplitScene,
  onDuplicateScene,
  onDeleteScene,
  onMoveScene,
  onRegenerateImage,
  onUploadImage,
  onShowToast,
}) => {
  const notify = (message: string, type: "error" | "success" | "info" = "error") => {
    if (onShowToast) {
      onShowToast(message, type);
    } else {
      console.error(message);
    }
  };

  const [start, setStart] = useState(scene.start);
  const [end, setEnd] = useState(scene.end);
  const [caption, setCaption] = useState(scene.caption || "");
  const [prompt, setPrompt] = useState(scene.image_prompt || "");
  const [motion, setMotion] = useState<ImageMotion>(scene.motion || "none");
  const [transition, setTransition] = useState<TransitionType>(scene.transition || "none");
  const [transitionDuration, setTransitionDuration] = useState(scene.transition_duration || 0.5);
  const [imageFit, setImageFit] = useState<ImageFit>(scene.image_fit || "cover");
  const [imagePosition, setImagePosition] = useState<ImagePosition>(scene.image_position || "center");
  const [imageZoom, setImageZoom] = useState<number>(scene.image_zoom || 1.0);
  const [imageCrop, setImageCrop] = useState<ImageCrop | null>(scene.image_crop || null);
  const [brightness, setBrightness] = useState<number>(scene.brightness || 0.0);
  const [contrast, setContrast] = useState<number>(scene.contrast ?? 1.0);
  const [saturation, setSaturation] = useState<number>(scene.saturation ?? 1.0);
  const [colorFilter, setColorFilter] = useState<ColorFilter>(scene.color_filter || "none");
  const [isDraggingOverThumb, setIsDraggingOverThumb] = useState(false);
  const [ripple, setRipple] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"visual" | "framing" | "motion" | "color" | "timing">("visual");

  // Sync state with incoming active scene prop
  useEffect(() => {
    setStart(scene.start);
    setEnd(scene.end);
    setCaption(scene.caption || "");
    setPrompt(scene.image_prompt || "");
    setMotion(scene.motion || "none");
    setTransition(scene.transition || "none");
    setTransitionDuration(scene.transition_duration || 0.5);
    setImageFit(scene.image_fit || "cover");
    setImagePosition(scene.image_position || "center");
    setImageZoom(scene.image_zoom || 1.0);
    setImageCrop(scene.image_crop || null);
    setBrightness(scene.brightness || 0.0);
    setContrast(scene.contrast ?? 1.0);
    setSaturation(scene.saturation ?? 1.0);
    setColorFilter(scene.color_filter || "none");
  }, [scene]);

  // File input ref for upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sceneIndex = (project.scenes || []).findIndex((s) => s.id === scene.id);
  const safeSceneIndex = sceneIndex !== -1 ? sceneIndex : 0;
  const canMoveEarlier = sceneIndex > 0;
  const canMoveLater = sceneIndex !== -1 && sceneIndex < (project.scenes || []).length - 1;

  // Can split if playhead is strictly inside the scene
  const canSplitAtPlayhead =
    currentTime > scene.start + 0.2 && currentTime < scene.end - 0.2;

  const handleSaveTimes = async () => {
    if (end <= start) {
      notify("End time must be greater than start time.");
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateScene(
        {
          start,
          end,
          caption,
          image_prompt: prompt,
          motion,
          transition,
          transition_duration: transitionDuration,
          image_fit: imageFit,
          image_position: imagePosition,
          image_zoom: imageZoom,
          image_crop: imageCrop,
          brightness,
          contrast,
          saturation,
          color_filter: colorFilter,
        },
        ripple
      );
    } catch (err: any) {
      notify(err.message || "Failed to update scene");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFitChange = async (newFit: ImageFit) => {
    setImageFit(newFit);
    await onUpdateScene({ image_fit: newFit }, false);
  };

  const handlePositionChange = async (newPos: ImagePosition) => {
    setImagePosition(newPos);
    await onUpdateScene({ image_position: newPos }, false);
  };

  const handleZoomChange = async (newZoom: number) => {
    setImageZoom(newZoom);
    await onUpdateScene({ image_zoom: newZoom }, false);
  };

  const handleCropPreset = async (preset: "none" | "16:9" | "9:16" | "1:1") => {
    let crop: ImageCrop | null = null;
    if (preset === "16:9") {
      crop = { x: 0, y: 21.875, width: 100, height: 56.25 };
    } else if (preset === "9:16") {
      crop = { x: 21.875, y: 0, width: 56.25, height: 100 };
    } else if (preset === "1:1") {
      crop = { x: 12.5, y: 0, width: 75, height: 100 };
    }
    setImageCrop(crop);
    await onUpdateScene({ image_crop: crop }, false);
  };

  const handleQuickMotionChange = async (newMotion: ImageMotion) => {
    setMotion(newMotion);
    await onUpdateScene({ motion: newMotion }, false);
  };

  const handleQuickTransitionChange = async (newTransition: TransitionType) => {
    setTransition(newTransition);
    await onUpdateScene({ transition: newTransition }, false);
  };

  const handleQuickTransitionDurationChange = async (newDuration: number) => {
    setTransitionDuration(newDuration);
    await onUpdateScene({ transition_duration: newDuration }, false);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await onUploadImage(scene.id, file);
    } catch (err: any) {
      notify(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateImage(scene.id, prompt);
    } catch (err: any) {
      notify(err.message || "Regeneration failed");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleBrightnessChange = async (newVal: number) => {
    setBrightness(newVal);
    await onUpdateScene({ brightness: newVal }, false);
  };

  const handleContrastChange = async (newVal: number) => {
    setContrast(newVal);
    await onUpdateScene({ contrast: newVal }, false);
  };

  const handleSaturationChange = async (newVal: number) => {
    setSaturation(newVal);
    await onUpdateScene({ saturation: newVal }, false);
  };

  const handleColorFilterChange = async (newFilt: ColorFilter) => {
    setColorFilter(newFilt);
    await onUpdateScene({ color_filter: newFilt }, false);
  };

  const handleResetVisuals = async () => {
    setBrightness(0.0);
    setContrast(1.0);
    setSaturation(1.0);
    setColorFilter("none");
    await onUpdateScene(
      { brightness: 0.0, contrast: 1.0, saturation: 1.0, color_filter: "none" },
      false
    );
  };

  const handleThumbDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverThumb(true);
  };

  const handleThumbDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverThumb(false);
  };

  const handleThumbDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverThumb(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIsUploading(true);
      try {
        await onUploadImage(scene.id, file);
      } catch (err: any) {
        notify(err.message || "Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Hidden File Input for Image Replacement */}
      <input
        ref={fileInputRef}
        id="scene-file-input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      {/* Header & Scene Navigation */}
      <div
        id="scene-inspector-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            id="scene-index-badge"
            style={{
              background: "rgba(99, 102, 241, 0.15)",
              color: "var(--primary)",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            Scene {safeSceneIndex + 1}
          </span>
          <span
            id="scene-id-label"
            style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}
          >
            ID: {scene.id}
          </span>
        </div>

        {/* Reorder Buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            id="scene-move-earlier-btn"
            onClick={() => onMoveScene(scene.id, "earlier")}
            disabled={!canMoveEarlier}
            title="Move scene earlier in timeline"
            style={{
              padding: "4px 8px",
              fontSize: "0.78rem",
              background: canMoveEarlier ? "rgba(255,255,255,0.06)" : "transparent",
              color: canMoveEarlier ? "var(--text-secondary)" : "var(--text-muted)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--radius-sm)",
              cursor: canMoveEarlier ? "pointer" : "not-allowed",
            }}
          >
            ⬅ Earlier
          </button>
          <button
            id="scene-move-later-btn"
            onClick={() => onMoveScene(scene.id, "later")}
            disabled={!canMoveLater}
            title="Move scene later in timeline"
            style={{
              padding: "4px 8px",
              fontSize: "0.78rem",
              background: canMoveLater ? "rgba(255,255,255,0.06)" : "transparent",
              color: canMoveLater ? "var(--text-secondary)" : "var(--text-muted)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--radius-sm)",
              cursor: canMoveLater ? "pointer" : "not-allowed",
            }}
          >
            Later ➡
          </button>
        </div>
      </div>

      {/* Sub-Branch Navigation Row */}
      <div
        id="scene-subtabs-nav"
        style={{
          display: "flex",
          background: "rgba(255,255,255,0.03)",
          padding: "3px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.08)",
          gap: "3px",
          overflowX: "auto",
        }}
      >
        {[
          { id: "visual", label: "Visual & Prompt", icon: "🎨" },
          { id: "framing", label: "Framing & Crop", icon: "📐" },
          { id: "motion", label: "Motion & FX", icon: "🎬" },
          { id: "color", label: "Color & Filters", icon: "✨" },
          { id: "timing", label: "Timing & Actions", icon: "⏱" },
        ].map((item) => {
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              id={`scene-subtab-${item.id}`}
              type="button"
              onClick={() => setActiveSubTab(item.id as any)}
              style={{
                flex: 1,
                minWidth: "max-content",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "none",
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                fontSize: "0.76rem",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- SUB-TAB 1: VISUAL & PROMPT --- */}
      {activeSubTab === "visual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Visual Preview & Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "16px" }}>
            <div
              onDragOver={handleThumbDragOver}
              onDragLeave={handleThumbDragLeave}
              onDrop={handleThumbDrop}
              onClick={() => fileInputRef.current?.click()}
              title="Click or drag & drop image to replace visual"
              style={{
                width: "130px",
                height: "85px",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                position: "relative",
                background: isDraggingOverThumb ? "rgba(6, 182, 212, 0.15)" : "#000",
                border: isDraggingOverThumb
                  ? "2px dashed var(--accent-cyan)"
                  : "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {scene.image_url ? (
                <img
                  src={api.getMediaUrl(scene.image_url)}
                  alt="Thumbnail"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: isDraggingOverThumb ? 0.4 : 1,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    gap: "4px",
                  }}
                >
                  <span>📷</span>
                  <span>No Visual</span>
                </div>
              )}

              {/* Drag over overlay badge */}
              {isDraggingOverThumb ? (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(6, 182, 212, 0.35)",
                    backdropFilter: "blur(2px)",
                    color: "#FFFFFF",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textAlign: "center",
                    pointerEvents: "none",
                    padding: "4px",
                  }}
                >
                  <span>📥 Drop to Replace</span>
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: "0.68rem",
                    textAlign: "center",
                    padding: "4px 2px",
                    pointerEvents: "none",
                    fontWeight: 500,
                  }}
                >
                  Click or Drop
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  id="scene-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.8rem",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "var(--text-secondary)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {isUploading ? "Uploading..." : "📷 Upload Replacement"}
                </button>

                <button
                  id="scene-regenerate-btn"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.8rem",
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    color: "var(--primary)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {isRegenerating ? "Generating..." : "✨ Regenerate Visual"}
                </button>
              </div>

              <span id="scene-image-status" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Generation Status: <strong style={{ color: "var(--text-secondary)" }}>{scene.image_status || "pending"}</strong>
              </span>
            </div>
          </div>

          {/* Caption & Prompt Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label
                htmlFor="scene-caption-input"
                style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: 600 }}
              >
                Scene Caption Text
              </label>
              <textarea
                id="scene-caption-input"
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onBlur={() => onUpdateScene({ caption }, false)}
                placeholder="Spoken subtitle or narration for this scene..."
                style={{
                  width: "100%",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  padding: "8px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.85rem",
                  resize: "vertical",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="scene-prompt-input"
                style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: 600 }}
              >
                Image Generation Prompt
              </label>
              <textarea
                id="scene-prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onBlur={() => onUpdateScene({ image_prompt: prompt }, false)}
                placeholder="Visual description for AI image generation..."
                style={{
                  width: "100%",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  padding: "8px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.82rem",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: FRAMING & CROP --- */}
      {activeSubTab === "framing" && (
        <div
          style={{
            background: "var(--bg-card-subtle)",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", margin: 0 }}>
              🖼 Image Framing & Transform
            </label>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Fit: {imageFit} • Zoom: {imageZoom.toFixed(1)}x
            </span>
          </div>

          {/* Fit selector: Cover, Contain, Blur, Fill */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fit Mode</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {([
                { value: "cover", label: "Cover (Fill)" },
                { value: "contain", label: "Contain (Bars)" },
                { value: "blur", label: "Blur (Mirror)" },
                { value: "fill", label: "Stretch" },
              ] as const).map((f) => (
                <button
                  key={f.value}
                  id={`scene-fit-${f.value}`}
                  onClick={() => handleFitChange(f.value)}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "var(--radius-sm)",
                    border: imageFit === f.value ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.08)",
                    background: imageFit === f.value ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.03)",
                    color: imageFit === f.value ? "var(--primary)" : "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position & Zoom grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Position */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="scene-position-select" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Alignment Position
              </label>
              <select
                id="scene-position-select"
                value={imagePosition}
                onChange={(e) => handlePositionChange(e.target.value as ImagePosition)}
                className="select-custom"
                style={{ fontSize: "0.8rem", padding: "6px 8px" }}
              >
                <option value="center">Center (Default)</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>

            {/* Zoom */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="scene-zoom-slider" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Zoom Level
                </label>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--primary)" }}>
                  {imageZoom.toFixed(1)}x
                </span>
              </div>
              <input
                id="scene-zoom-slider"
                type="range"
                min={1.0}
                max={2.5}
                step={0.1}
                value={imageZoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer", height: "4px", marginTop: "4px" }}
              />
            </div>
          </div>

          {/* Crop Presets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Aspect Ratio Crop Presets</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {([
                { value: "none", label: "Full" },
                { value: "16:9", label: "16:9" },
                { value: "9:16", label: "9:16" },
                { value: "1:1", label: "1:1" },
              ] as const).map((cp) => (
                <button
                  key={cp.value}
                  id={`scene-crop-${cp.value.replace(":", "-")}`}
                  onClick={() => handleCropPreset(cp.value)}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {cp.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 3: MOTION & FX --- */}
      {activeSubTab === "motion" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Camera Motion Selector */}
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
              🎥 Camera Motion & Dynamics
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "6px" }}>
              {MOTION_OPTIONS.map((opt) => {
                const isSelected = motion === opt.value;
                const safeOptId = opt.value.replace(/\s+/g, "-");
                return (
                  <button
                    key={opt.value}
                    id={`scene-motion-${safeOptId}`}
                    onClick={() => handleQuickMotionChange(opt.value)}
                    style={{
                      padding: "7px 10px",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      background: isSelected ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.04)",
                      border: isSelected ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "var(--radius-sm)",
                      color: isSelected ? "#fff" : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transition Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label htmlFor="scene-transition-duration-slider" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                ⚡ Scene Transition
              </label>
              {transition !== "none" && (
                <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                  {transitionDuration.toFixed(1)}s duration
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
              {TRANSITION_OPTIONS.map((opt) => {
                const isSelected = transition === opt.value;
                return (
                  <button
                    key={opt.value}
                    id={`scene-transition-${opt.value}`}
                    onClick={() => handleQuickTransitionChange(opt.value)}
                    style={{
                      padding: "8px",
                      fontSize: "0.78rem",
                      background: isSelected ? "rgba(6, 182, 212, 0.2)" : "rgba(255,255,255,0.04)",
                      border: isSelected ? "1px solid var(--accent-cyan)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "var(--radius-sm)",
                      color: isSelected ? "#fff" : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {transition !== "none" && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>0.2s</span>
                <input
                  id="scene-transition-duration-slider"
                  type="range"
                  min={0.2}
                  max={2.0}
                  step={0.1}
                  value={transitionDuration}
                  onChange={(e) => handleQuickTransitionDurationChange(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--accent-cyan)", height: "4px" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>2.0s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUB-TAB 4: COLOR & FILTERS --- */}
      {activeSubTab === "color" && (
        <div
          style={{
            background: "var(--bg-card-subtle)",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", margin: 0 }}>
              🎨 Color Grading & Cinematic Filters
            </label>
            {(brightness !== 0 || contrast !== 1 || saturation !== 1 || colorFilter !== "none") && (
              <button
                id="scene-reset-visuals-btn"
                onClick={handleResetVisuals}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "2px 6px",
                }}
              >
                ↺ Reset Visuals
              </button>
            )}
          </div>

          {/* Color Filter Presets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Cinematic Filter Style</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {COLOR_FILTER_OPTIONS.map((filt) => {
                const isSelected = colorFilter === filt.value;
                return (
                  <button
                    key={filt.value}
                    id={`scene-filter-${filt.value}`}
                    onClick={() => handleColorFilterChange(filt.value)}
                    style={{
                      padding: "8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: "var(--radius-sm)",
                      border: isSelected
                        ? `1px solid ${filt.previewColor}`
                        : "1px solid rgba(255,255,255,0.08)",
                      background: isSelected
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.02)",
                      color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                    title={filt.description}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: filt.previewColor,
                        boxShadow: isSelected ? `0 0 6px ${filt.previewColor}` : "none",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {filt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders for Brightness, Contrast, Saturation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Brightness */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="scene-brightness-slider" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Brightness
                </label>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--primary)" }}>
                  {brightness > 0 ? `+${Math.round(brightness * 100)}%` : `${Math.round(brightness * 100)}%`}
                </span>
              </div>
              <input
                id="scene-brightness-slider"
                type="range"
                min={-0.5}
                max={0.5}
                step={0.05}
                value={brightness}
                onChange={(e) => handleBrightnessChange(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer", height: "4px" }}
              />
            </div>

            {/* Contrast */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="scene-contrast-slider" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Contrast
                </label>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--primary)" }}>
                  {Math.round(contrast * 100)}%
                </span>
              </div>
              <input
                id="scene-contrast-slider"
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={contrast}
                onChange={(e) => handleContrastChange(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer", height: "4px" }}
              />
            </div>

            {/* Saturation */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="scene-saturation-slider" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Saturation
                </label>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--primary)" }}>
                  {Math.round(saturation * 100)}%
                </span>
              </div>
              <input
                id="scene-saturation-slider"
                type="range"
                min={0.0}
                max={2.0}
                step={0.1}
                value={saturation}
                onChange={(e) => handleSaturationChange(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer", height: "4px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 5: TIMING & ACTIONS --- */}
      {activeSubTab === "timing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Timing Controls (Master Timeline Rule Enforced) */}
          <div
            style={{
              background: "var(--bg-card-subtle)",
              padding: "14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              ⏱ Master Timestamps (Authoritative)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div>
                <label htmlFor="scene-start-input" style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Start Time (s)
                </label>
                <input
                  id="scene-start-input"
                  type="number"
                  step="0.1"
                  value={start}
                  onChange={(e) => setStart(parseFloat(e.target.value) || 0)}
                  style={{
                    width: "100%",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    padding: "6px 8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label htmlFor="scene-end-input" style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  End Time (s)
                </label>
                <input
                  id="scene-end-input"
                  type="number"
                  step="0.1"
                  value={end}
                  onChange={(e) => setEnd(parseFloat(e.target.value) || 0)}
                  style={{
                    width: "100%",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    padding: "6px 8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label htmlFor="scene-duration-input" style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Duration (s)
                </label>
                <input
                  id="scene-duration-input"
                  type="text"
                  readOnly
                  value={(end - start > 0 ? (end - start).toFixed(2) : "0.00") + "s"}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                    padding: "6px 8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--text-muted)", cursor: "pointer" }}>
                <input
                  id="scene-ripple-checkbox"
                  type="checkbox"
                  checked={ripple}
                  onChange={(e) => setRipple(e.target.checked)}
                  style={{ accentColor: "var(--primary)" }}
                />
                <span>Ripple downstream timestamps automatically</span>
              </label>

              <button
                id="scene-apply-timing-btn"
                onClick={handleSaveTimes}
                disabled={isSaving}
                className="btn-primary"
                style={{
                  padding: "6px 14px",
                  fontSize: "0.8rem",
                }}
              >
                {isSaving ? "Saving..." : "Apply Timing"}
              </button>
            </div>
          </div>

          {/* Clip Operations Toolbar */}
          <div
            id="scene-operations-toolbar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              background: "var(--bg-card-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
            }}
          >
            <button
              id="scene-split-btn"
              onClick={() => onSplitScene(scene.id, Number(currentTime.toFixed(3)))}
              disabled={!canSplitAtPlayhead}
              title={
                canSplitAtPlayhead
                  ? `Split scene at current playhead position (${currentTime.toFixed(2)}s) [Shortcut: S]`
                  : `Playhead must be inside the scene (${scene.start.toFixed(1)}s - ${scene.end.toFixed(1)}s) to split`
              }
              className="btn-secondary text-xs"
              style={{
                padding: "6px 12px",
                opacity: canSplitAtPlayhead ? 1 : 0.5,
                cursor: canSplitAtPlayhead ? "pointer" : "not-allowed",
                background: canSplitAtPlayhead ? "var(--accent-primary-subtle)" : "transparent",
                color: canSplitAtPlayhead ? "var(--accent-primary)" : "var(--text-muted)",
                borderColor: canSplitAtPlayhead ? "var(--accent-primary)" : "var(--border-subtle)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Scissors size={13} />
              <span>Split at Playhead ({canSplitAtPlayhead ? `${currentTime.toFixed(1)}s` : "Seek to clip"})</span>
            </button>

            <button
              id="scene-duplicate-btn"
              onClick={() => onDuplicateScene(scene.id)}
              title="Duplicate scene directly downstream"
              className="btn-secondary text-xs"
              style={{
                padding: "6px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Copy size={13} />
              <span>Duplicate Clip</span>
            </button>

            <button
              id="scene-delete-btn"
              onClick={() => onDeleteScene(scene.id)}
              disabled={(project.scenes || []).length <= 1}
              title="Delete scene from timeline with ripple shift [Shortcut: Del]"
              className="btn-ghost text-xs"
              style={{
                padding: "6px 12px",
                color: "var(--accent-danger-text)",
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                cursor: (project.scenes || []).length > 1 ? "pointer" : "not-allowed",
                opacity: (project.scenes || []).length > 1 ? 1 : 0.5,
              }}
            >
              <Trash2 size={13} />
              <span>Delete Clip</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
