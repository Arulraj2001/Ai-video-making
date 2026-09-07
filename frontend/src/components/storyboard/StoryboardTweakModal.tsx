import React, { useState } from "react";
import {
  Wand2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Film,
  Clock,
  Quote,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { formatTimecode } from "../../utils/formatters";
import type { Scene } from "../../types";

interface StoryboardTweakModalProps {
  scene: Scene | null;
  isOpen: boolean;
  onClose: () => void;
  regenInstructions: string;
  onChangeInstructions: (text: string) => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

// Curated cinematic modifiers for instant directorial injection
const DIRECTORIAL_PRESETS = [
  {
    label: "35mm Anamorphic",
    icon: "🎥",
    snippet: "shot on 35mm anamorphic lens, subtle horizontal streak flares, shallow depth of field",
  },
  {
    label: "Golden Hour Rim",
    icon: "🌅",
    snippet: "dramatic low-angle golden hour sunlight, warm amber rim lighting, atmospheric dust motes",
  },
  {
    label: "Cyberpunk Rain",
    icon: "🌧",
    snippet: "wet asphalt with neon puddle reflections, heavy cinematic rain, cyan and magenta rim light",
  },
  {
    label: "Macro Close-Up",
    icon: "🔍",
    snippet: "extreme macro close-up detail, razor-sharp focus on facial expression, hyper-detailed skin texture",
  },
  {
    label: "Volumetric Fog",
    icon: "🌫",
    snippet: "dense atmospheric fog, striking volumetric god-rays, moody high-contrast silhouette",
  },
  {
    label: "Action Motion Blur",
    icon: "⚡",
    snippet: "dynamic low-angle action framing, directional motion blur, high-octane cinematic kinetic energy",
  },
  {
    label: "Teal & Orange Grade",
    icon: "🎨",
    snippet: "classic cinema teal and orange color grading, deep film shadows, organic 35mm Kodak film grain",
  },
  {
    label: "Aerial Drone Wide",
    icon: "🚁",
    snippet: "sweeping ultra-wide high-altitude drone shot, epic grand scale, cinematic landscape composition",
  },
];

export const StoryboardTweakModal: React.FC<StoryboardTweakModalProps> = ({
  scene,
  isOpen,
  onClose,
  regenInstructions,
  onChangeInstructions,
  onRegenerate,
  regenerating,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showOriginalPrompt, setShowOriginalPrompt] = useState(false);

  if (!scene) return null;

  const handleCopyPrompt = async () => {
    if (!scene.image_prompt) return;
    try {
      await navigator.clipboard.writeText(scene.image_prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleInjectPreset = (snippet: string) => {
    const current = regenInstructions.trim();
    if (!current) {
      onChangeInstructions(snippet);
    } else {
      if (current.toLowerCase().includes(snippet.toLowerCase().slice(0, 20))) return;
      onChangeInstructions(`${current}, ${snippet}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !regenerating) {
      e.preventDefault();
      onRegenerate();
    }
  };

  const charCount = regenInstructions.length;
  const wordCount = regenInstructions.trim() ? regenInstructions.trim().split(/\s+/).length : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "var(--sb-accent-glow)",
              color: "var(--sb-accent)",
              flexShrink: 0,
            }}
          >
            <Wand2 size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--modal-text-title)", letterSpacing: "-0.02em" }}>
                Directorial Prompt Synthesizer
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: "var(--sb-accent)",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  letterSpacing: "0.04em",
                }}
              >
                SCENE {scene.id}
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--modal-text-desc)", marginTop: "2px", margin: 0 }}>
              Inject custom photographic directives and visual modifiers while preserving Video Bible continuity.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5 text-xs text-[var(--sb-text-muted)]">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Clock size={12} style={{ color: "var(--sb-accent)" }} />
              {formatTimecode(scene.start)} → {formatTimecode(scene.end)} ({scene.duration.toFixed(2)}s)
            </span>
            <span className="hidden sm:inline text-[11px] opacity-40">·</span>
            <span className="hidden sm:inline text-[11px] opacity-75">
              Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--sb-border)] text-[var(--sb-text-primary)] font-mono text-[10px]">Ctrl+↵</kbd>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="sb-btn-secondary"
              style={{ padding: "7px 14px", fontSize: "11.5px" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              className="sb-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 18px",
                fontSize: "11.5px",
                borderRadius: "9px",
              }}
            >
              {regenerating ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Synthesizing Directives...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Synthesize Directives</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* 1. Voiceover Script Anchor */}
        <div
          style={{
            background: "var(--sb-bg)",
            border: "1px solid var(--sb-border)",
            borderRadius: "10px",
            padding: "10px 14px",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Quote size={11} style={{ color: "var(--sb-accent)" }} />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--sb-text-muted)",
                }}
              >
                Voiceover Narration Script
              </span>
            </div>
            <span
              style={{
                fontSize: "10px",
                color: "var(--sb-success)",
                fontWeight: 600,
                background: "var(--sb-success-glow)",
                padding: "1px 6px",
                borderRadius: "9999px",
                border: "1px solid var(--sb-success)",
              }}
            >
              Audio Synced
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              fontStyle: "italic",
              lineHeight: 1.55,
              color: "var(--sb-text-primary)",
              margin: 0,
            }}
          >
            "{scene.caption || "No narration text recorded for this scene."}"
          </p>
        </div>

        {/* 2. Active Image Prompt (Collapsible Reference) */}
        {scene.image_prompt && (
          <div
            style={{
              background: "var(--sb-bg)",
              border: "1px solid var(--sb-border)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setShowOriginalPrompt(!showOriginalPrompt)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div className="flex items-center gap-2">
                <Film size={12} style={{ color: "var(--sb-text-muted)" }} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--sb-text-secondary)",
                  }}
                >
                  Active Base Image Prompt Reference
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: "10px", color: "var(--sb-text-muted)", fontFamily: "monospace" }}>
                  {showOriginalPrompt ? "Hide" : "Expand"}
                </span>
                {showOriginalPrompt ? (
                  <ChevronUp size={12} style={{ color: "var(--sb-text-muted)" }} />
                ) : (
                  <ChevronDown size={12} style={{ color: "var(--sb-text-muted)" }} />
                )}
              </div>
            </button>

            {showOriginalPrompt && (
              <div
                style={{
                  padding: "10px 12px",
                  borderTop: "1px solid var(--sb-border)",
                  background: "#0F172A",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    style={{
                      fontSize: "11px",
                      fontFamily: "monospace",
                      lineHeight: 1.55,
                      color: "#E2E8F0",
                      margin: 0,
                      maxHeight: "80px",
                      overflowY: "auto",
                      userSelect: "all",
                    }}
                  >
                    {scene.image_prompt}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    title="Copy active base prompt"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 7px",
                      borderRadius: "6px",
                      background: copiedPrompt ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)",
                      border: `1px solid ${copiedPrompt ? "#22C55E" : "rgba(255,255,255,0.2)"}`,
                      color: copiedPrompt ? "#22C55E" : "#E2E8F0",
                      fontSize: "10px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {copiedPrompt ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedPrompt ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Directorial Quick-Injection Preset Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap size={12} style={{ color: "var(--sb-accent)" }} />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--sb-text-muted)",
                }}
              >
                Quick Directorial Injections (Click to add)
              </span>
            </div>
            <span style={{ fontSize: "10px", color: "var(--sb-text-muted)" }}>Click to append</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DIRECTORIAL_PRESETS.map((preset) => {
              const isIncluded = regenInstructions.toLowerCase().includes(preset.snippet.toLowerCase().slice(0, 15));
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleInjectPreset(preset.snippet)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    borderRadius: "7px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: isIncluded ? "var(--sb-accent-glow)" : "var(--sb-bg)",
                    border: `1px solid ${isIncluded ? "var(--sb-accent)" : "var(--sb-border)"}`,
                    color: isIncluded ? "var(--sb-accent)" : "var(--sb-text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isIncluded) {
                      e.currentTarget.style.borderColor = "var(--sb-accent)";
                      e.currentTarget.style.color = "var(--sb-text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isIncluded) {
                      e.currentTarget.style.borderColor = "var(--sb-border)";
                      e.currentTarget.style.color = "var(--sb-text-secondary)";
                    }
                  }}
                >
                  <span style={{ fontSize: "11px" }}>{preset.icon}</span>
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Creative Directives Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--sb-text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Sliders size={12} style={{ color: "var(--sb-accent)" }} />
              Custom Directorial Adjustments
            </label>
            <div className="flex items-center gap-2.5">
              {regenInstructions.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeInstructions("")}
                  style={{
                    fontSize: "10px",
                    color: "var(--sb-danger)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <X size={10} />
                  <span>Clear</span>
                </button>
              )}
              <span style={{ fontSize: "10px", color: "var(--sb-text-muted)", fontFamily: "monospace" }}>
                {wordCount} words · {charCount} chars
              </span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <textarea
              rows={3}
              value={regenInstructions}
              onChange={(e) => onChangeInstructions(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Extreme close-up on cybernetic eye with rain droplets, macro lens, cinematic depth of field, neon teal reflections..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "var(--sb-bg)",
                border: "1px solid var(--sb-border)",
                color: "var(--sb-text-primary)",
                fontSize: "12px",
                fontFamily: "inherit",
                lineHeight: 1.55,
                outline: "none",
                resize: "vertical",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--sb-accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--sb-accent-glow)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--sb-border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Continuity Guarantee Note */}
          <div
            className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
            style={{
              background: "var(--sb-accent-glow-lg)",
              border: "1px solid var(--sb-accent-glow)",
            }}
          >
            <ShieldCheck size={14} style={{ color: "var(--sb-accent)", flexShrink: 0 }} />
            <p style={{ fontSize: "11px", color: "var(--sb-text-secondary)", margin: 0, lineHeight: 1.4 }}>
              <strong style={{ color: "var(--sb-text-primary)" }}>Video Bible Continuity:</strong> Character identities, recurring elements, and color palettes are automatically preserved.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
