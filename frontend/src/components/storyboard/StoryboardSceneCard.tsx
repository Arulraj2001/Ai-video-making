import React from "react";
import {
  Film,
  Camera,
  Layers,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Edit3,
  X,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  CheckSquare,
  Square,
  PanelRight,
  Palette,
  MessageSquare,
} from "lucide-react";
import { formatTimecode } from "../../utils/formatters";
import { api } from "../../services/api";
import type { Scene } from "../../types";

interface StoryboardSceneCardProps {
  scene: Scene;
  index: number;
  isSelected: boolean;
  onToggleSelect: (sceneId: string) => void;
  viewLayout: "cards" | "compact";
  isSceneGenerating: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  projectAspectRatio: string;
  sceneAspectRatio: "16:9" | "9:16" | "1:1";
  onGenerateSceneImage: (sceneId: string, regenerate: boolean) => void;
  generatingAllImages: boolean;
  onOpenLightbox: (data: { url: string; sceneNumber: number; caption: string; metadata?: any }) => void;
  onCopyPrompt: (sceneId: string, prompt: string) => void;
  isCopied: boolean;
  onOpenDetails: (scene: Scene) => void;
  onOpenTweakModal: (scene: Scene) => void;
  onOpenVariations: (scene: Scene) => void;
  onOpenGraphicModal: (scene: Scene) => void;
  variationsLoading: boolean;
  // Inline edit
  isEditing: boolean;
  onStartEditing: (scene: Scene) => void;
  onCancelEditing: () => void;
  onSaveEdit: (sceneId: string) => void;
  editPrompt: string;
  setEditPrompt: (p: string) => void;
  editDescription: string;
  setEditDescription: (d: string) => void;
  editMotion: string;
  setEditMotion: (m: string) => void;
  editTransition: string;
  setEditTransition: (t: string) => void;
  editAspectRatio: "16:9" | "9:16" | "1:1";
  setEditAspectRatio: (r: "16:9" | "9:16" | "1:1") => void;
  savingEdit: boolean;
}

export const StoryboardSceneCard: React.FC<StoryboardSceneCardProps> = ({
  scene,
  index,
  isSelected,
  onToggleSelect,
  viewLayout: _viewLayout,
  isSceneGenerating,
  isCompleted,
  isFailed,
  projectAspectRatio,
  sceneAspectRatio,
  onGenerateSceneImage,
  generatingAllImages,
  onOpenLightbox,
  onCopyPrompt,
  isCopied,
  onOpenDetails,
  onOpenTweakModal,
  onOpenVariations,
  onOpenGraphicModal,
  variationsLoading,
  isEditing,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  editPrompt,
  setEditPrompt,
  editDescription,
  setEditDescription,
  editMotion,
  setEditMotion,
  editTransition,
  setEditTransition,
  editAspectRatio,
  setEditAspectRatio,
  savingEdit,
}) => {
  const cardStatusClass = isSceneGenerating
    ? "is-generating"
    : isCompleted
    ? "is-completed"
    : isFailed
    ? "is-failed"
    : "";

  const imageAspectStyle = { aspectRatio: projectAspectRatio.replace(":", " / ") };

  const lightboxData = {
    url: api.getMediaUrl(scene.image_url || undefined),
    sceneNumber: index + 1,
    caption: scene.caption,
    metadata: scene.image_metadata,
  };

  return (
    <div
      className={`sb-scene-card ${cardStatusClass} ${isSelected ? "is-selected" : ""}`}
      id={`scene-card-${scene.id}`}
    >
      {/* ── Card Header ─────────────────────────────────────────────── */}
      <div className="sb-card-header">
        {/* Left: checkbox + scene number + timecode */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => onToggleSelect(scene.id)}
            className="p-0.5 transition-opacity hover:opacity-70 shrink-0"
            style={{ color: isSelected ? "var(--sb-accent)" : "var(--sb-text-muted)" }}
            title={isSelected ? "Deselect scene" : "Select scene"}
            aria-label={isSelected ? "Deselect scene" : "Select scene"}
          >
            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>

          <span className="sb-scene-number">
            <Film size={11} />
            {String(index + 1).padStart(2, "0")}
          </span>

          <span className="sb-timecode">
            {formatTimecode(scene.start)} → {formatTimecode(scene.end)}
            <span className="ml-1.5 opacity-50">({scene.duration.toFixed(1)}s)</span>
          </span>

          {scene.suggested_motion && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-medium"
              style={{ color: "var(--sb-text-muted)" }}>
              <Camera size={10} />
              {scene.suggested_motion}
            </span>
          )}
          {scene.suggested_transition && (
            <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-medium"
              style={{ color: "var(--sb-text-muted)" }}>
              <Layers size={10} />
              {scene.suggested_transition}
            </span>
          )}
        </div>

        {/* Right: status badge + quick header actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isCompleted && (
            <span className="sb-card-badge success">
              <CheckCircle2 size={11} /> Ready
            </span>
          )}
          {isSceneGenerating && (
            <span className="sb-card-badge warning">
              <RefreshCw size={11} className="animate-spin" /> Synthesizing
            </span>
          )}
          {isFailed && (
            <span className="sb-card-badge danger">
              <AlertCircle size={11} /> Failed
            </span>
          )}

          <button
            type="button"
            onClick={() => onStartEditing(scene)}
            className="sb-mini-btn"
            title="Edit scene directives"
            aria-label="Edit scene"
          >
            <Edit3 size={12} />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDetails(scene)}
            className="sb-mini-btn"
            title="View scene details"
            aria-label="Scene details"
          >
            <PanelRight size={12} />
            <span className="hidden sm:inline">Details</span>
          </button>
        </div>
      </div>

      {/* ── Hero Image Canvas ────────────────────────────────────────── */}
      <div className="sb-image-canvas" style={imageAspectStyle}>
        {isCompleted && scene.image_url ? (
          <>
            <img
              src={api.getMediaUrl(scene.image_url || undefined)}
              alt={`Scene ${index + 1} visual`}
              loading="lazy"
              decoding="async"
              onClick={() => onOpenLightbox(lightboxData)}
              style={{ cursor: "pointer" }}
            />

            {/* Hover overlay */}
            <div className="sb-image-overlay" onClick={() => onOpenLightbox(lightboxData)} style={{ cursor: "zoom-in" }}>
              <Maximize2 size={28} style={{ color: "rgba(255,255,255,0.9)" }} />
            </div>

            {/* Top-left: source pill */}
            <div className="sb-image-pill-top">
              {scene.image_metadata?.source === "graphic_template"
                ? "📊 Graphic Card"
                : `🎨 ${scene.image_metadata?.model || "AI Visual"}`}
            </div>

            {/* Bottom-left: resolution */}
            <div className="sb-image-pill-bottom">
              {scene.image_metadata?.width || 1024}×{scene.image_metadata?.height || 576}
            </div>

            {/* Bottom-right: controls */}
            <div className="sb-image-controls">
              <button
                type="button"
                className="sb-image-btn"
                onClick={() => onOpenLightbox(lightboxData)}
                title="Fullscreen preview"
                aria-label="Fullscreen preview"
              >
                <Maximize2 size={13} />
              </button>
              <button
                type="button"
                className="sb-image-btn primary-regen"
                onClick={() => onGenerateSceneImage(scene.id, true)}
                disabled={isSceneGenerating || generatingAllImages}
                title="Regenerate this scene"
                aria-label="Regenerate visual"
              >
                <RefreshCw size={13} className={isSceneGenerating ? "animate-spin" : ""} />
              </button>
            </div>
          </>
        ) : isSceneGenerating ? (
          /* Generating State */
          <div className="sb-generating-state">
            <div className="sb-shimmer-ring">
              <div className="sb-shimmer-ring-inner" />
            </div>
            <div style={{ textAlign: "center" }}>
              <span className="block text-xs font-semibold" style={{ color: "var(--sb-text-primary)" }}>
                Synthesizing Visual
              </span>
              <span className="block text-[10px] font-mono mt-0.5" style={{ color: "var(--sb-text-muted)" }}>
                {sceneAspectRatio}
              </span>
            </div>
          </div>
        ) : isFailed ? (
          /* Failed State */
          <div className="sb-failed-state">
            <AlertCircle size={26} style={{ color: "var(--sb-danger)" }} />
            <div style={{ textAlign: "center" }}>
              <span className="block text-xs font-bold" style={{ color: "var(--sb-danger)" }}>
                Generation Failed
              </span>
              <p className="text-[10px] mt-0.5 max-w-[200px] line-clamp-2" style={{ color: "var(--sb-text-secondary)" }}>
                {scene.image_error || "An unexpected error occurred."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onGenerateSceneImage(scene.id, true)}
              className="sb-btn-danger"
              style={{ padding: "5px 14px", fontSize: "11px" }}
            >
              <RefreshCw size={11} />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          /* Pending State */
          <div className="sb-pending-state">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--sb-border-hover)" }}
            >
              <ImageIcon size={18} style={{ color: "var(--sb-text-muted)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <span className="block text-xs font-medium" style={{ color: "var(--sb-text-secondary)" }}>
                Visual Pending
              </span>
              <span className="block text-[10px]" style={{ color: "var(--sb-text-muted)" }}>
                Ready for synthesis
              </span>
            </div>
            <button
              type="button"
              onClick={() => onGenerateSceneImage(scene.id, false)}
              disabled={generatingAllImages}
              className="sb-mini-btn accent"
              style={{ padding: "5px 14px" }}
            >
              <Sparkles size={11} />
              <span>Generate Visual</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Card Body ────────────────────────────────────────────────── */}
      {!isEditing && (
        <div className="sb-card-body">
          {/* Narration Quote */}
          {scene.caption && (
            <div className="sb-narration-quote">
              <MessageSquare size={12} style={{ color: "var(--sb-accent)", display: "inline", marginRight: "6px" }} />
              "{scene.caption}"
            </div>
          )}

          {/* Scene Direction */}
          {scene.visual_description && (
            <div className="sb-scene-direction">
              <div className="sb-field-label">Scene Direction</div>
              <div className="sb-direction-text">{scene.visual_description}</div>
            </div>
          )}

          {/* Prompt Block */}
          {scene.image_prompt && (
            <div className="sb-prompt-section">
              <div className="sb-prompt-header">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} style={{ color: "var(--sb-accent)" }} />
                  <span className="sb-field-label accent">Prompt Directive ({sceneAspectRatio})</span>
                </div>
                <div className="sb-prompt-actions">
                  <button
                    type="button"
                    onClick={() => onCopyPrompt(scene.id, scene.image_prompt || "")}
                    className={`sb-mini-btn ${isCopied ? "success-state" : ""}`}
                    title="Copy prompt"
                  >
                    {isCopied ? <><Check size={11} /><span>Copied</span></> : <><Copy size={11} /><span>Copy</span></>}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenTweakModal(scene)}
                    className="sb-mini-btn accent"
                    title="Tweak prompt with guidance"
                  >
                    <Sparkles size={11} />
                    <span>Tweak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenVariations(scene)}
                    disabled={variationsLoading}
                    className="sb-mini-btn"
                    title="Generate 3 visual variations"
                  >
                    <Palette size={11} />
                    <span>Variations</span>
                  </button>
                </div>
              </div>
              <div className="sb-prompt-block">{scene.image_prompt}</div>
            </div>
          )}

          {/* No prompt yet */}
          {!scene.image_prompt && (
            <div className="sb-prompt-section">
              <div className="sb-field-label">Prompt Directive</div>
              <div className="sb-prompt-block">
                <span style={{ color: "var(--sb-text-muted)", fontStyle: "italic" }}>
                  No prompt synthesized yet. Generate the storyboard first.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Inline Edit Panel (slides in below image) ─────────────── */}
      {isEditing && (
        <div className="sb-edit-panel">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--sb-text-primary)" }}>
              <Edit3 size={13} style={{ color: "var(--sb-accent)" }} />
              Edit Scene {index + 1} Directives
            </span>
            <button
              type="button"
              onClick={onCancelEditing}
              className="p-1 rounded transition-opacity hover:opacity-60"
              style={{ color: "var(--sb-text-muted)" }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="sb-edit-field">
            <label className="sb-edit-label">Image Generation Prompt</label>
            <textarea
              rows={3}
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="sb-edit-textarea mono"
              placeholder="Describe the visual you want to generate…"
            />
          </div>

          <div className="sb-edit-field">
            <label className="sb-edit-label">Visual Description</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="sb-edit-textarea"
              placeholder="Scene direction for the director…"
            />
          </div>

          <div className="sb-edit-grid">
            <div className="sb-edit-field">
              <label className="sb-edit-label">Camera Motion</label>
              <input
                type="text"
                value={editMotion}
                onChange={(e) => setEditMotion(e.target.value)}
                placeholder="e.g. Slow Zoom In"
                className="sb-edit-input"
              />
            </div>
            <div className="sb-edit-field">
              <label className="sb-edit-label">Transition</label>
              <input
                type="text"
                value={editTransition}
                onChange={(e) => setEditTransition(e.target.value)}
                placeholder="e.g. Cross Dissolve"
                className="sb-edit-input"
              />
            </div>
          </div>

          <div className="sb-edit-field">
            <label className="sb-edit-label">Image Aspect Ratio</label>
            <select
              value={editAspectRatio}
              onChange={(e) => setEditAspectRatio(e.target.value as "16:9" | "9:16" | "1:1")}
              className="sb-edit-select"
            >
              <option value="16:9">16:9 — Landscape</option>
              <option value="9:16">9:16 — Portrait</option>
              <option value="1:1">1:1 — Square</option>
            </select>
          </div>

          <div className="sb-edit-actions">
            <button type="button" onClick={onCancelEditing} className="sb-btn-secondary" style={{ padding: "6px 14px", fontSize: "11.5px" }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSaveEdit(scene.id)}
              disabled={savingEdit}
              className="sb-btn-primary"
              style={{ padding: "6px 18px", fontSize: "11.5px" }}
            >
              {savingEdit ? <><RefreshCw size={12} className="animate-spin" /><span>Saving…</span></> : <span>Save Changes</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Action Row ────────────────────────────────────────── */}
      <div className="sb-card-actions">
        <button
          type="button"
          onClick={() => onOpenGraphicModal(scene)}
          className="sb-mini-btn"
          title="Apply a graphic card template"
        >
          <Layers size={12} />
          <span>Graphic Card</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenVariations(scene)}
          disabled={variationsLoading}
          className="sb-mini-btn"
          title="Generate visual variations"
        >
          <Palette size={12} />
          <span>Variations</span>
        </button>

        <div className="sb-card-actions-right">
          {/* Canvas generate / regen button */}
          {isCompleted ? (
            <button
              type="button"
              onClick={() => onGenerateSceneImage(scene.id, true)}
              disabled={isSceneGenerating || generatingAllImages}
              className="sb-mini-btn"
              title="Regenerate visual"
            >
              <RefreshCw size={11} className={isSceneGenerating ? "animate-spin" : ""} />
              <span>Regenerate</span>
            </button>
          ) : isFailed ? (
            <button
              type="button"
              onClick={() => onGenerateSceneImage(scene.id, true)}
              disabled={isSceneGenerating || generatingAllImages}
              className="sb-mini-btn"
              style={{ color: "var(--sb-danger)", borderColor: "rgba(239,68,68,0.3)" }}
              title="Retry generation"
            >
              <RefreshCw size={11} className={isSceneGenerating ? "animate-spin" : ""} />
              <span>Retry</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onGenerateSceneImage(scene.id, false)}
              disabled={isSceneGenerating || generatingAllImages}
              className="sb-mini-btn accent"
              title="Generate visual for this scene"
            >
              <Sparkles size={11} />
              <span>Generate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
