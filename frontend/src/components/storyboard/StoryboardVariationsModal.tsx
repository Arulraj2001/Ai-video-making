import React, { useState } from "react";
import {
  Palette,
  RefreshCw,
  Check,
  Sparkles,
  AlertCircle,
  Film,
  Layers,
  CheckCircle2,
  Hash,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { api } from "../../services/api";
import type { Scene, SceneVariationItem } from "../../types";

interface StoryboardVariationsModalProps {
  scene: Scene | null;
  isOpen: boolean;
  onClose: () => void;
  variations: SceneVariationItem[];
  variationsLoading: boolean;
  variationsError: string | null;
  onApplyVariation: (sceneId: string, variation: SceneVariationItem) => void;
  onRerollVariations: (scene: Scene) => void;
  projectAspectRatio: string;
}

export const StoryboardVariationsModal: React.FC<StoryboardVariationsModalProps> = ({
  scene,
  isOpen,
  onClose,
  variations,
  variationsLoading,
  variationsError,
  onApplyVariation,
  onRerollVariations,
  projectAspectRatio,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [copiedSeed, setCopiedSeed] = useState<number | null>(null);

  if (!scene) return null;

  const handleSelect = (v: SceneVariationItem) => {
    setSelectedCandidateId(v.id);
    onApplyVariation(scene.id, v);
  };

  const handleCopySeed = async (seed: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(String(seed));
      setCopiedSeed(seed);
      setTimeout(() => setCopiedSeed(null), 2000);
    } catch {
      // fallback
    }
  };

  const cssAspectRatio = projectAspectRatio.replace(":", " / ");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
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
            <Palette size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--modal-text-title)", letterSpacing: "-0.02em" }}>
                Parallel Candidate Variations
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
              Compare candidate renders against your active timeline visual. Click any card to apply immediately.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRerollVariations(scene)}
              disabled={variationsLoading}
              className="sb-btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11.5px",
                padding: "7px 14px",
              }}
            >
              <RefreshCw size={12} className={variationsLoading ? "animate-spin text-[var(--sb-accent)]" : ""} />
              <span>{variationsLoading ? "Synthesizing..." : "Re-roll 3 More Candidates"}</span>
            </button>
            <span style={{ fontSize: "11px", color: "var(--sb-text-muted)", fontFamily: "monospace" }}>
              Ratio: {projectAspectRatio}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sb-btn-secondary"
            style={{ padding: "7px 16px", fontSize: "11.5px" }}
          >
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Active Scene vs Variations Comparison Header Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: "10px",
            background: "var(--sb-bg)",
            border: "1px solid var(--sb-border)",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {/* Active scene preview strip */}
          <div className="flex items-center gap-2.5 min-w-0">
            {scene.image_url ? (
              <div
                style={{
                  width: "44px",
                  height: "30px",
                  borderRadius: "5px",
                  overflow: "hidden",
                  border: "1px solid var(--sb-border)",
                  background: "#000",
                  flexShrink: 0,
                }}
              >
                <img
                  src={api.getMediaUrl(scene.image_url)}
                  alt="Current timeline visual"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "44px",
                  height: "30px",
                  borderRadius: "5px",
                  background: "var(--sb-card)",
                  border: "1px solid var(--sb-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--sb-text-muted)",
                  flexShrink: 0,
                }}
              >
                <Film size={13} />
              </div>
            )}
            <div className="min-w-0">
              <span style={{ fontSize: "9.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--sb-text-muted)", letterSpacing: "0.05em", display: "block" }}>
                Current Active Visual
              </span>
              <span className="truncate block" style={{ fontSize: "11px", color: "var(--sb-text-primary)", fontWeight: 500 }}>
                {scene.caption ? `"${scene.caption.slice(0, 40)}..."` : "No narration assigned"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              style={{
                fontSize: "11px",
                color: "var(--sb-text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "var(--sb-card)",
                border: "1px solid var(--sb-border)",
                padding: "3px 8px",
                borderRadius: "6px",
              }}
            >
              <Layers size={11} style={{ color: "var(--sb-accent)" }} />
              <span>Click card below to select</span>
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {variationsError && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "var(--sb-danger-glow)",
              border: "1px solid var(--sb-danger)",
              color: "var(--sb-danger)",
              fontSize: "11.5px",
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <strong style={{ fontWeight: 700 }}>Synthesis Issue:</strong> {variationsError}
            </div>
          </div>
        )}

        {/* Loading State */}
        {variationsLoading ? (
          <div className="py-8 space-y-4">
            <div className="text-center space-y-2">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "var(--sb-accent-glow)",
                  border: "1px solid var(--sb-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <RefreshCw size={20} className="animate-spin text-[var(--sb-accent)]" />
              </div>
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--sb-text-primary)", margin: 0 }}>
                  Generating 3 Parallel Visual Candidates
                </h4>
                <p style={{ fontSize: "11.5px", color: "var(--sb-text-secondary)", marginTop: "2px", margin: 0 }}>
                  Running parallel diffusion passes with distinct seeds and composition angles...
                </p>
              </div>
            </div>

            {/* Skeleton Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: "12px",
                    background: "var(--sb-bg)",
                    border: "1px solid var(--sb-border)",
                    padding: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: cssAspectRatio,
                      maxHeight: "180px",
                      borderRadius: "8px",
                      background: "var(--sb-card)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(90deg, transparent 0%, var(--sb-accent-glow) 50%, transparent 100%)",
                        animation: "sbCandidateShimmer 1.8s infinite",
                      }}
                    />
                  </div>
                  <div className="mt-2 space-y-2">
                    <div style={{ height: "10px", width: "50%", background: "var(--sb-border)", borderRadius: "4px" }} />
                    <div style={{ height: "26px", width: "100%", background: "var(--sb-border)", borderRadius: "6px" }} />
                  </div>
                </div>
              ))}
            </div>

            <style>{`
              @keyframes sbCandidateShimmer {
                0%   { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
          </div>
        ) : variations.length === 0 ? (
          /* Empty State */
          <div
            style={{
              padding: "36px 20px",
              textAlign: "center",
              borderRadius: "12px",
              border: "1px dashed var(--sb-border)",
              background: "var(--sb-bg)",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "var(--sb-accent-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                color: "var(--sb-accent)",
              }}
            >
              <Sparkles size={20} />
            </div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--sb-text-primary)", marginBottom: "4px" }}>
              No Candidate Variations Synthesized Yet
            </h4>
            <p style={{ fontSize: "11.5px", color: "var(--sb-text-secondary)", maxWidth: "380px", margin: "0 auto 16px" }}>
              Generate 3 parallel photographic candidate options with alternative seeds and lighting to find the best look.
            </p>
            <button
              type="button"
              onClick={() => onRerollVariations(scene)}
              className="sb-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                fontSize: "11.5px",
                borderRadius: "9px",
              }}
            >
              <Sparkles size={13} />
              <span>Synthesize 3 Candidate Variations</span>
            </button>
          </div>
        ) : (
          /* 3-Candidate Cards Grid - Height capped to fit window */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {variations.map((v, i) => {
              const isCurrentlyActive = scene.image_url === v.image_url;
              const isJustSelected = selectedCandidateId === v.id;
              const candidateLetters = ["A", "B", "C", "D", "E"];
              const letter = candidateLetters[i] || String(i + 1);

              return (
                <div
                  key={v.id || i}
                  onClick={() => handleSelect(v)}
                  style={{
                    borderRadius: "12px",
                    background: "var(--sb-card)",
                    border: `1px solid ${
                      isCurrentlyActive || isJustSelected
                        ? "var(--sb-success)"
                        : "var(--sb-border)"
                    }`,
                    boxShadow:
                      isCurrentlyActive || isJustSelected
                        ? "0 0 0 2px var(--sb-success-glow), var(--sb-shadow-card)"
                        : "var(--sb-shadow-card)",
                    padding: "8px",
                    cursor: "pointer",
                    transition: "all 0.16s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrentlyActive && !isJustSelected) {
                      e.currentTarget.style.borderColor = "var(--sb-accent)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentlyActive && !isJustSelected) {
                      e.currentTarget.style.borderColor = "var(--sb-border)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {/* Image Container - Capped max-height to ensure fit in window */}
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#08090C",
                      aspectRatio: cssAspectRatio,
                      maxHeight: "min(28vh, 180px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={api.getMediaUrl(v.image_url)}
                      alt={`Candidate ${letter}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    {/* Candidate Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        left: "6px",
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 7px",
                        borderRadius: "5px",
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(6px)",
                        color: "#FFFFFF",
                        fontSize: "9.5px",
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        fontFamily: "monospace",
                      }}
                    >
                      <span>OPTION {letter}</span>
                    </div>

                    {/* Active Timeline Badge if selected */}
                    {(isCurrentlyActive || isJustSelected) && (
                      <div
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          padding: "2px 7px",
                          borderRadius: "5px",
                          background: "#16A34A",
                          color: "#FFFFFF",
                          fontSize: "9.5px",
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle2 size={10} />
                        <span>ACTIVE</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between px-0.5">
                    {v.seed ? (
                      <button
                        type="button"
                        onClick={(e) => handleCopySeed(v.seed, e)}
                        title="Copy seed"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "9.5px",
                          fontFamily: "monospace",
                          color: copiedSeed === v.seed ? "var(--sb-success)" : "var(--sb-text-muted)",
                          background: "var(--sb-bg)",
                          border: "1px solid var(--sb-border)",
                          padding: "1px 5px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <Hash size={9} />
                        <span>{copiedSeed === v.seed ? "Copied" : v.seed}</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: "9.5px", color: "var(--sb-text-muted)", fontFamily: "monospace" }}>
                        SEED: AUTO
                      </span>
                    )}

                    <span style={{ fontSize: "9.5px", color: "var(--sb-text-muted)", fontFamily: "monospace" }}>
                      {projectAspectRatio}
                    </span>
                  </div>

                  {/* Apply / Selected Button */}
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "7px",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      cursor: "pointer",
                      border: "1px solid",
                      transition: "all 0.15s ease",
                      background: isCurrentlyActive || isJustSelected ? "var(--sb-success-glow)" : "var(--sb-accent)",
                      color: isCurrentlyActive || isJustSelected ? "var(--sb-success)" : "#FFFFFF",
                      borderColor: isCurrentlyActive || isJustSelected ? "var(--sb-success)" : "transparent",
                    }}
                  >
                    {isCurrentlyActive || isJustSelected ? (
                      <>
                        <Check size={12} />
                        <span>Active on Timeline</span>
                      </>
                    ) : (
                      <>
                        <Check size={12} />
                        <span>Select Option {letter}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
