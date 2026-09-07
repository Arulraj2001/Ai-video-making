import React from "react";
import { Layers, Sparkles, RefreshCw, Clock, ArrowRight } from "lucide-react";
import { Modal } from "../ui/Modal";

interface StoryboardClusteringModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusterMode: "fixed_duration" | "smart_llm";
  onChangeClusterMode: (mode: "fixed_duration" | "smart_llm") => void;
  clusterTargetDuration: number;
  onChangeTargetDuration: (duration: number) => void;
  onRunClustering: () => void;
  clusteringInProgress: boolean;
  scenesCount: number;
  totalDuration: number;
}

export const StoryboardClusteringModal: React.FC<StoryboardClusteringModalProps> = ({
  isOpen,
  onClose,
  clusterMode,
  onChangeClusterMode,
  clusterTargetDuration,
  onChangeTargetDuration,
  onRunClustering,
  clusteringInProgress,
  scenesCount,
  totalDuration,
}) => {
  const estimatedScenes = Math.max(1, Math.round(totalDuration / clusterTargetDuration));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2.5">
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
            <Layers size={15} />
          </div>
          <div className="min-w-0">
            <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--modal-text-title)", letterSpacing: "-0.02em" }}>
              Smart Visual Scene Clustering
            </span>
            <p style={{ fontSize: "11px", color: "var(--modal-text-desc)", marginTop: "2px", margin: 0 }}>
              Optimize pacing by grouping rapid micro-captions into cohesive cinematic scenes.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
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
            onClick={onRunClustering}
            disabled={clusteringInProgress}
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
            {clusteringInProgress ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Clustering Scenes...</span>
              </>
            ) : (
              <>
                <Layers size={12} />
                <span>Apply Smart Clustering</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        <p style={{ fontSize: "11.5px", color: "var(--sb-text-secondary)", lineHeight: 1.55, margin: 0 }}>
          Rapid 2–3 second sentence cuts cause jarring visual strobe effects. Smart Clustering groups consecutive lines into 15–25 second visual blocks so images hold naturally while captions animate over them.
        </p>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onChangeClusterMode("fixed_duration")}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: clusterMode === "fixed_duration" ? "var(--sb-accent-glow)" : "var(--sb-bg)",
              border: `1px solid ${clusterMode === "fixed_duration" ? "var(--sb-accent)" : "var(--sb-border)"}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={13} style={{ color: "var(--sb-accent)" }} />
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--sb-text-primary)" }}>
                Target Duration
              </span>
            </div>
            <span style={{ fontSize: "10.5px", color: "var(--sb-text-secondary)", display: "block", lineHeight: 1.35 }}>
              Groups captions into stable ~{clusterTargetDuration}s visual blocks
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeClusterMode("smart_llm")}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: clusterMode === "smart_llm" ? "var(--sb-accent-glow)" : "var(--sb-bg)",
              border: `1px solid ${clusterMode === "smart_llm" ? "var(--sb-accent)" : "var(--sb-border)"}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={13} style={{ color: "var(--sb-accent)" }} />
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--sb-text-primary)" }}>
                AI Narrative Shifts
              </span>
            </div>
            <span style={{ fontSize: "10.5px", color: "var(--sb-text-secondary)", display: "block", lineHeight: 1.35 }}>
              Semantic intelligence detects logical chapter boundaries
            </span>
          </button>
        </div>

        {/* Duration Picker Pills */}
        {clusterMode === "fixed_duration" && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background: "var(--sb-bg)",
              border: "1px solid var(--sb-border)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--sb-text-secondary)", fontWeight: 600, fontSize: "11px" }}>Target Scene Length:</span>
              <span style={{ color: "var(--sb-accent)", fontWeight: 700, fontFamily: "monospace", fontSize: "11px" }}>
                {clusterTargetDuration} seconds
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[10, 15, 20, 25, 30].map((dur) => {
                const isSelected = clusterTargetDuration === dur;
                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => onChangeTargetDuration(dur)}
                    style={{
                      padding: "5px 0",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      background: isSelected ? "var(--sb-accent)" : "var(--sb-card)",
                      border: `1px solid ${isSelected ? "var(--sb-accent)" : "var(--sb-border)"}`,
                      color: isSelected ? "#FFFFFF" : "var(--sb-text-secondary)",
                    }}
                  >
                    {dur}s
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Forecast Summary */}
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "10px",
            background: "var(--sb-bg)",
            border: "1px solid var(--sb-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11.5px",
            fontFamily: "monospace",
          }}
        >
          <span style={{ color: "var(--sb-text-secondary)" }}>
            Current: <strong style={{ color: "var(--sb-text-primary)" }}>{scenesCount}</strong> rapid captions
          </span>
          <ArrowRight size={12} style={{ color: "var(--sb-text-muted)" }} />
          <span style={{ color: "var(--sb-accent)", fontWeight: 700 }}>
            Est. Output: ~{estimatedScenes} cinematic scenes
          </span>
        </div>
      </div>
    </Modal>
  );
};
