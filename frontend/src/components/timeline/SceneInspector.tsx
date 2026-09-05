import React, { useState, useEffect, useRef } from "react";
import { Scissors, Copy, Trash2 } from "lucide-react";
import type { Project, Scene, ImageMotion, TransitionType, ImageFit, ImagePosition, ImageCrop } from "../../types/project";
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
}) => {
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
  const [ripple, setRipple] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when selected scene changes
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
  }, [scene]);

  const sceneIndex = (project.scenes || []).findIndex((s) => s.id === scene.id);
  const canMoveEarlier = sceneIndex > 0;
  const canMoveLater = sceneIndex !== -1 && sceneIndex < (project.scenes || []).length - 1;

  // Can split if playhead is strictly inside the scene
  const canSplitAtPlayhead =
    currentTime > scene.start + 0.2 && currentTime < scene.end - 0.2;

  const handleSaveTimes = async () => {
    if (end <= start) {
      alert("End time must be greater than start time.");
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
        },
        ripple
      );
    } catch (err: any) {
      alert(err.message || "Failed to update scene");
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
      alert(err.message || "Failed to upload image");
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
      alert(err.message || "Regeneration failed");
    } finally {
      setIsRegenerating(false);
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
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      {/* Header & Scene Navigation */}
      <div
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
            style={{
              background: "rgba(99, 102, 241, 0.15)",
              color: "var(--primary)",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            Scene {sceneIndex + 1}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
            ID: {scene.id}
          </span>
        </div>

        {/* Reorder Buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
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

      {/* Timeline Clip Operations Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          background: "var(--bg-card-subtle)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => onSplitScene(scene.id, currentTime)}
          disabled={!canSplitAtPlayhead}
          title={
            canSplitAtPlayhead
              ? `Split scene at current playhead position (${currentTime.toFixed(2)}s) [Shortcut: S]`
              : `Playhead must be inside the scene (${scene.start.toFixed(1)}s - ${scene.end.toFixed(1)}s) to split`
          }
          className="btn-secondary text-xs"
          style={{
            padding: "5px 10px",
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
          onClick={() => onDuplicateScene(scene.id)}
          title="Duplicate scene directly downstream"
          className="btn-secondary text-xs"
          style={{
            padding: "5px 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Copy size={13} />
          <span>Duplicate</span>
        </button>

        <button
          onClick={() => onDeleteScene(scene.id)}
          title="Delete scene from timeline with ripple shift [Shortcut: Del]"
          className="btn-ghost text-xs"
          style={{
            padding: "5px 10px",
            color: "var(--accent-danger-text)",
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Trash2 size={13} />
          <span>Delete Clip</span>
        </button>
      </div>

      {/* Visual Preview & Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "16px" }}>
        <div
          style={{
            width: "130px",
            height: "80px",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            position: "relative",
            background: "#000",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {scene.image_url ? (
            <img
              src={api.getMediaUrl(scene.image_url)}
              alt="Thumbnail"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              No Visual
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
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
              {isRegenerating ? "Generating..." : "✨ Regenerate Image"}
            </button>
          </div>

          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Status: <strong style={{ color: "var(--text-secondary)" }}>{scene.image_status || "pending"}</strong>
          </span>
        </div>
      </div>

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
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              Start Time (s)
            </label>
            <input
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
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              End Time (s)
            </label>
            <input
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
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              Duration (s)
            </label>
            <input
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
              type="checkbox"
              checked={ripple}
              onChange={(e) => setRipple(e.target.checked)}
              style={{ accentColor: "var(--primary)" }}
            />
            <span>Ripple downstream timestamps automatically</span>
          </label>

          <button
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

      {/* Phase 8: Image Framing & Transformations */}
      <div
        style={{
          background: "var(--bg-card-subtle)",
          padding: "14px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", margin: 0 }}>
            🖼 Image Framing & Transform
          </label>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Fit: {imageFit} • Zoom: {imageZoom.toFixed(1)}x
          </span>
        </div>

        {/* Fit selector: Cover, Contain, Fill */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fit Mode</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {([
              { value: "cover", label: "Cover (Fill)" },
              { value: "contain", label: "Contain (Bars)" },
              { value: "fill", label: "Stretch" },
            ] as const).map((f) => (
              <button
                key={f.value}
                onClick={() => handleFitChange(f.value)}
                style={{
                  flex: 1,
                  padding: "5px 0",
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {/* Position */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Alignment Position</span>
            <select
              value={imagePosition}
              onChange={(e) => handlePositionChange(e.target.value as ImagePosition)}
              className="select-custom"
              style={{ fontSize: "0.8rem", padding: "5px 8px" }}
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
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Zoom Level</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--primary)" }}>
                {imageZoom.toFixed(1)}x
              </span>
            </div>
            <input
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
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Crop Presets</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {([
              { value: "none", label: "Full" },
              { value: "16:9", label: "16:9" },
              { value: "9:16", label: "9:16" },
              { value: "1:1", label: "1:1" },
            ] as const).map((cp) => (
              <button
                key={cp.value}
                onClick={() => handleCropPreset(cp.value)}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  fontSize: "0.72rem",
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

      {/* Camera Motion Selector */}
      <div>
        <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
          🎥 Image Motion (Camera Dynamics)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "6px" }}>
          {MOTION_OPTIONS.map((opt) => {
            const isSelected = motion === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleQuickMotionChange(opt.value)}
                style={{
                  padding: "6px 8px",
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
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>
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
                onClick={() => handleQuickTransitionChange(opt.value)}
                style={{
                  padding: "6px 8px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>0.2s</span>
            <input
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

      {/* Caption & Prompt Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: 600 }}>
            Caption Text
          </label>
          <textarea
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={() => onUpdateScene({ caption }, false)}
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
          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: 600 }}>
            Image Prompt
          </label>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={() => onUpdateScene({ image_prompt: prompt }, false)}
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

      {/* Timeline Manipulation Operations */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "14px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => onSplitScene(scene.id, currentTime)}
          disabled={!canSplitAtPlayhead}
          title={
            canSplitAtPlayhead
              ? `Split scene into two at current playhead time (${currentTime.toFixed(1)}s)`
              : "Move playhead inside this scene to split"
          }
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: "0.8rem",
            background: canSplitAtPlayhead ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
            border: canSplitAtPlayhead ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.08)",
            color: canSplitAtPlayhead ? "var(--primary)" : "var(--text-muted)",
            borderRadius: "var(--radius-sm)",
            cursor: canSplitAtPlayhead ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          ✂ Split at Playhead ({currentTime.toFixed(1)}s)
        </button>

        <button
          onClick={() => onDuplicateScene(scene.id)}
          style={{
            padding: "8px 12px",
            fontSize: "0.8rem",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--text-secondary)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          📋 Duplicate
        </button>

        <button
          onClick={() => onDeleteScene(scene.id)}
          disabled={(project.scenes || []).length <= 1}
          title="Delete scene from timeline"
          style={{
            padding: "8px 12px",
            fontSize: "0.8rem",
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "var(--accent-rose)",
            borderRadius: "var(--radius-sm)",
            cursor: (project.scenes || []).length > 1 ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
};
