import React from "react";
import {
  PanelRight,
  Edit3,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Film,
  Camera,
  ExternalLink,
  Scissors,
  Cpu,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { formatTimecode } from "../../utils/formatters";
import { api } from "../../services/api";
import type { Scene } from "../../types";

interface StoryboardDetailsModalProps {
  scene: Scene | null;
  sceneIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onEditScene: (scene: Scene) => void;
  onTweakPrompt: (scene: Scene) => void;
  projectAspectRatio: string;
}

export const StoryboardDetailsModal: React.FC<StoryboardDetailsModalProps> = ({
  scene,
  sceneIndex,
  isOpen,
  onClose,
  onEditScene,
  onTweakPrompt,
  projectAspectRatio,
}) => {
  if (!scene) return null;

  const isImageReady = scene.image_status === "completed" && Boolean(scene.image_url);
  const isFailed = scene.image_status === "failed";
  const isGenerating = scene.image_status === "generating" || scene.image_status === "pending";
  const sceneAspect = scene.image_metadata?.aspect_ratio || projectAspectRatio;
  const cssAspectRatio = sceneAspect.replace(":", " / ");

  const handleOpenFullImage = () => {
    if (scene.image_url) {
      window.open(api.getMediaUrl(scene.image_url), "_blank");
    }
  };

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
            <PanelRight size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--modal-text-title)", letterSpacing: "-0.02em" }}>
                Scene Telemetry & Technical Spec Sheet
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
                SCENE {String(sceneIndex + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--sb-text-muted)",
                  fontFamily: "monospace",
                  background: "var(--sb-bg)",
                  border: "1px solid var(--sb-border)",
                  padding: "1px 5px",
                  borderRadius: "4px",
                }}
              >
                ID: {scene.id}
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--modal-text-desc)", marginTop: "2px", margin: 0 }}>
              Full directorial telemetry, timing breakdown, camera motion, and diffusion prompt specs.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2.5">
          <div className="flex items-center gap-2 text-xs text-[var(--sb-text-muted)] font-mono">
            <Clock size={12} style={{ color: "var(--sb-accent)" }} />
            <span>
              {formatTimecode(scene.start)} → {formatTimecode(scene.end)} ({scene.duration.toFixed(2)}s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditScene(scene);
              }}
              className="sb-btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11.5px",
                padding: "7px 12px",
              }}
            >
              <Edit3 size={12} />
              <span>Edit Directives</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onTweakPrompt(scene);
              }}
              className="sb-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11.5px",
                padding: "7px 16px",
                borderRadius: "9px",
              }}
            >
              <Wand2 size={12} />
              <span>Tweak Prompt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="sb-btn-secondary"
              style={{ padding: "7px 14px", fontSize: "11.5px" }}
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* 1. High-Density Telemetry Status Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: "6px",
          }}
        >
          {/* Start Time */}
          <div
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "var(--sb-bg)",
              border: "1px solid var(--sb-border)",
            }}
          >
            <span style={{ fontSize: "9.5px", color: "var(--sb-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
              Start
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--sb-text-primary)", fontFamily: "monospace", fontWeight: 700, display: "block" }}>
              {formatTimecode(scene.start)}
            </span>
          </div>

          {/* End Time */}
          <div
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "var(--sb-bg)",
              border: "1px solid var(--sb-border)",
            }}
          >
            <span style={{ fontSize: "9.5px", color: "var(--sb-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
              End
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--sb-text-primary)", fontFamily: "monospace", fontWeight: 700, display: "block" }}>
              {formatTimecode(scene.end)}
            </span>
          </div>

          {/* Duration */}
          <div
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "var(--sb-bg)",
              border: "1px solid var(--sb-border)",
            }}
          >
            <span style={{ fontSize: "9.5px", color: "var(--sb-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
              Duration
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--sb-accent)", fontFamily: "monospace", fontWeight: 700, display: "block" }}>
              {scene.duration.toFixed(2)}s
            </span>
          </div>

          {/* Aspect Ratio */}
          <div
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "var(--sb-bg)",
              border: "1px solid var(--sb-border)",
            }}
          >
            <span style={{ fontSize: "9.5px", color: "var(--sb-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
              Aspect Ratio
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--sb-text-primary)", fontFamily: "monospace", fontWeight: 700, display: "block" }}>
              {sceneAspect}
            </span>
          </div>

          {/* Status */}
          <div
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "var(--sb-bg)",
              border: "1px solid var(--sb-border)",
            }}
          >
            <span style={{ fontSize: "9.5px", color: "var(--sb-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
              Visual Status
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isImageReady ? (
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--sb-success)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <CheckCircle2 size={11} /> Ready
                </span>
              ) : isFailed ? (
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--sb-danger)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <AlertCircle size={11} /> Failed
                </span>
              ) : isGenerating ? (
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--sb-warning)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--sb-warning)] animate-ping" /> Generating
                </span>
              ) : (
                <span style={{ fontSize: "11px", color: "var(--sb-text-muted)" }}>Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Main 2-Column Workstation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* Left Column: Camera and transition directives (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Directorial Camera Motion & Transition Directives */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "var(--sb-bg)",
                  border: "1px solid var(--sb-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: "rgba(59,130,246,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3B82F6",
                    flexShrink: 0,
                  }}
                >
                  <Camera size={13} />
                </div>
                <div className="min-w-0">
                  <span style={{ fontSize: "9.5px", color: "var(--sb-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                    Camera Motion
                  </span>
                  <span className="truncate block" style={{ fontSize: "11px", color: "var(--sb-text-primary)", fontWeight: 600 }}>
                    {scene.suggested_motion || "Standard Push-in"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "var(--sb-bg)",
                  border: "1px solid var(--sb-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: "rgba(245,158,11,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#F59E0B",
                    flexShrink: 0,
                  }}
                >
                  <Scissors size={13} />
                </div>
                <div className="min-w-0">
                  <span style={{ fontSize: "9.5px", color: "var(--sb-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                    Cut Transition
                  </span>
                  <span className="truncate block" style={{ fontSize: "11px", color: "var(--sb-text-primary)", fontWeight: 600 }}>
                    {scene.suggested_transition || "Direct Cut"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Preview & Machine Specs (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            {/* Visual Frame Container - Height constrained to fit window */}
            <div
              style={{
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid var(--sb-border)",
                background: "#08090C",
                position: "relative",
                maxHeight: "min(32vh, 230px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isImageReady && scene.image_url ? (
                <div className="relative group w-full flex items-center justify-center">
                  <div style={{ aspectRatio: cssAspectRatio, maxHeight: "min(32vh, 230px)", overflow: "hidden", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={api.getMediaUrl(scene.image_url)}
                      alt={`Scene ${sceneIndex + 1}`}
                      style={{
                        maxHeight: "min(32vh, 230px)",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>

                  {/* Top Bar on Image */}
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "6px",
                      right: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: "5px",
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(6px)",
                        color: "#22C55E",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        border: "1px solid rgba(34,197,94,0.3)",
                      }}
                    >
                      RENDER MASTER
                    </span>

                    <button
                      type="button"
                      onClick={handleOpenFullImage}
                      title="Open full resolution in new tab"
                      style={{
                        pointerEvents: "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: "2px 7px",
                        borderRadius: "5px",
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(6px)",
                        color: "#FFFFFF",
                        fontSize: "9.5px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        cursor: "pointer",
                      }}
                    >
                      <ExternalLink size={10} />
                      <span>Enlarge</span>
                    </button>
                  </div>
                </div>
              ) : isFailed ? (
                <div
                  style={{
                    padding: "20px 14px",
                    textAlign: "center",
                    background: "var(--sb-danger-glow)",
                    width: "100%",
                  }}
                >
                  <AlertCircle size={24} style={{ color: "var(--sb-danger)", margin: "0 auto 6px" }} />
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--sb-danger)", display: "block" }}>
                    Image Generation Failed
                  </span>
                  <span style={{ fontSize: "10.5px", color: "var(--sb-text-secondary)", marginTop: "2px", display: "block" }}>
                    {scene.image_error || "Diffusion process encountered an error."}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    padding: "24px 14px",
                    textAlign: "center",
                    color: "var(--sb-text-muted)",
                    width: "100%",
                  }}
                >
                  <Film size={24} style={{ margin: "0 auto 6px", opacity: 0.5 }} />
                  <span style={{ fontSize: "11.5px", color: "var(--sb-text-secondary)", display: "block" }}>No Visual Generated Yet</span>
                </div>
              )}
            </div>

            {/* Hardware & Dispatch Telemetry Card */}
            <div
              style={{
                borderRadius: "10px",
                background: "var(--sb-bg)",
                border: "1px solid var(--sb-border)",
                padding: "10px 12px",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Cpu size={12} style={{ color: "var(--sb-accent)" }} />
                <span
                  style={{
                    fontSize: "9.5px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--sb-text-muted)",
                  }}
                >
                  Generation Engine Telemetry
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--sb-border)]">
                  <span style={{ color: "var(--sb-text-secondary)" }}>Model Provider</span>
                  <span style={{ color: "var(--sb-text-primary)", fontWeight: 700, fontFamily: "monospace" }}>
                    {scene.image_metadata?.provider?.toUpperCase() || "AUTO-DISPATCH"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--sb-border)]">
                  <span style={{ color: "var(--sb-text-secondary)" }}>Frame Canvas</span>
                  <span style={{ color: "var(--sb-text-primary)", fontFamily: "monospace" }}>
                    {sceneAspect}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--sb-border)]">
                  <span style={{ color: "var(--sb-text-secondary)" }}>Seed Signature</span>
                  <span style={{ color: "var(--sb-text-primary)", fontFamily: "monospace" }}>
                    {scene.image_metadata?.seed ? `#${scene.image_metadata.seed}` : "Dynamic"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] py-0.5">
                  <span style={{ color: "var(--sb-text-secondary)" }}>Render Output</span>
                  <span style={{ color: isImageReady ? "var(--sb-success)" : "var(--sb-text-muted)", fontWeight: 600 }}>
                    {isImageReady ? "1080p Cine Master" : "Awaiting Render"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
