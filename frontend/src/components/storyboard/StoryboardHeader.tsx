import React, { useState, useRef, useEffect } from "react";
import {
  RefreshCw,
  Image as ImageIcon,
  Cpu,
  Palette,
  AlertTriangle,
  X,
  ChevronDown,
  Check,
  Layers,
  Film,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { ModelCatalogItem, ProviderUsageStats } from "../../types";

interface StoryboardHeaderProps {
  scenesCount: number;
  storyboardedCount: number;
  imagesCompletedCount: number;
  imagesFailedCount: number;
  projectAspectRatio: string;
  models: ModelCatalogItem[];
  modelCategories: [string, { label: string; items: ModelCatalogItem[] }][];
  selectedModelId: string;
  selectedProvider: string;
  onSelectModel: (modelId: string, provider: string) => void;
  usageStats: ProviderUsageStats | null;
  styleMode: string;
  onChangeStyleMode: (mode: string) => void;
  styleModes: { id: string; label: string }[];
  generatingAllImages: boolean;
  generatingAllStoryboard: boolean;
  retryingFailed: boolean;
  isAllImagesCompleted: boolean;
  onGenerateAllImages: (regenerate: boolean) => void;
  onRetryFailedImages: () => void;
  isRapidPaced: boolean;
  avgSceneDuration: number;
  dismissRapidAlert: boolean;
  onDismissRapidAlert: () => void;
  onOpenClusteringModal: () => void;
}

export const StoryboardHeader: React.FC<StoryboardHeaderProps> = ({
  scenesCount,
  storyboardedCount,
  imagesCompletedCount,
  imagesFailedCount,
  projectAspectRatio,
  models,
  modelCategories,
  selectedModelId,
  selectedProvider,
  onSelectModel,
  usageStats,
  styleMode,
  onChangeStyleMode,
  styleModes,
  generatingAllImages,
  generatingAllStoryboard,
  retryingFailed,
  isAllImagesCompleted,
  onGenerateAllImages,
  onRetryFailedImages,
  isRapidPaced,
  avgSceneDuration,
  dismissRapidAlert,
  onDismissRapidAlert,
  onOpenClusteringModal,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const updateDropdownPosition = () => {
    const picker = pickerRef.current;
    if (!picker) return;

    const rect = picker.getBoundingClientRect();
    const menuWidth = Math.min(352, window.innerWidth - 32);
    const menuHeight = Math.min(560, window.innerHeight * 0.7);
    const preferredTop = rect.bottom + 6;
    const top = preferredTop + menuHeight > window.innerHeight - 16
      ? Math.max(16, rect.top - menuHeight - 6)
      : preferredTop;
    setDropdownPosition({
      top,
      left: Math.max(16, Math.min(rect.left, window.innerWidth - menuWidth - 16)),
    });
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    if (modelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      updateDropdownPosition();
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [modelDropdownOpen]);

  const selectedModelObj = models.find((m) => m.model_id === selectedModelId);
  const pendingCount = scenesCount - imagesCompletedCount - imagesFailedCount;
  const isGeneratingAny = generatingAllImages || generatingAllStoryboard || retryingFailed;

  return (
    <div className="sb-command-bar">
      {/* ── Top Row: Title + Action Cluster ───────────────────────────── */}
      <div className="sb-command-bar-top">
        {/* Left: Title & Stats */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="sb-command-title">Visual Storyboard</h2>
            <span className="sb-stat-chip accent">
              <Film size={11} />
              <span>{projectAspectRatio}</span>
            </span>
          </div>

          <p className="sb-command-subtitle">
            AI-synthesize image prompts and generate cinematic frames for each scene.
          </p>

          {/* Live stat chips */}
          <div className="sb-stat-chips">
            <span className="sb-stat-chip neutral">
              {scenesCount} scenes
            </span>
            <span className="sb-stat-chip neutral">
              {storyboardedCount}/{scenesCount} prompts
            </span>
            {imagesCompletedCount > 0 && (
              <span className="sb-stat-chip success">
                <CheckCircle2 size={11} />
                {imagesCompletedCount} ready
              </span>
            )}
            {imagesFailedCount > 0 && (
              <span className="sb-stat-chip danger">
                <AlertCircle size={11} />
                {imagesFailedCount} failed
              </span>
            )}
            {pendingCount > 0 && imagesCompletedCount < scenesCount && (
              <span className="sb-stat-chip warning">
                {pendingCount} pending
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="sb-action-cluster">
          {/* AI Model Picker */}
          {models.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                id="storyboard-model-picker"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="sb-model-picker"
                ref={pickerRef}
                aria-expanded={modelDropdownOpen}
                title="Select AI image generation model"
              >
                <span className="sb-provider-dot" />
                <Cpu size={13} />
                <span className="max-w-[120px] truncate">
                  {selectedModelObj?.name || selectedModelId}
                </span>
                <ChevronDown
                  size={12}
                  style={{
                    transition: "transform 0.18s",
                    transform: modelDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color: "var(--sb-text-muted)",
                  }}
                />
              </button>

              {modelDropdownOpen && (
                <div
                  className="sb-model-dropdown"
                  style={dropdownPosition ? { top: dropdownPosition.top, left: dropdownPosition.left } : undefined}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-[rgba(255,255,255,0.08)]">
                    <span className="text-[11px] font-bold" style={{ color: "var(--sb-text-primary)" }}>
                      AI Image Model
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.07)", color: "var(--sb-accent)" }}
                    >
                      {selectedProvider.toUpperCase()}
                    </span>
                  </div>

                  {/* Model list */}
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
                    {modelCategories.map(([key, group]) => (
                      <div key={key}>
                        <div className="sb-model-group-label">{group.label}</div>
                        {group.items.map((m) => {
                          const isSel = m.model_id === selectedModelId;
                          return (
                            <button
                              key={m.id || m.model_id}
                              type="button"
                              onClick={() => { onSelectModel(m.model_id, m.provider); setModelDropdownOpen(false); }}
                              className={`sb-model-option ${isSel ? "is-selected" : ""}`}
                            >
                              <span className="truncate">{m.name}</span>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {m.is_free ? (
                                  <span
                                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
                                  >
                                    FREE
                                  </span>
                                ) : m.is_ready ? (
                                  <span
                                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)" }}
                                  >
                                    ACTIVE KEY
                                  </span>
                                ) : (
                                  <span
                                    className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                                  >
                                    NEEDS KEY
                                  </span>
                                )}
                                {isSel && <Check size={13} style={{ color: "var(--sb-accent)" }} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Cloudflare quota */}
                  {selectedProvider === "cloudflare" && usageStats?.cloudflare && (
                    <div className="mt-3 p-2.5 rounded-lg text-[11px]" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa" }}>
                      <div className="flex justify-between font-semibold">
                        <span>Daily Quota</span>
                        <span>{usageStats.cloudflare.used_today} / ~25 used</span>
                      </div>
                      <div className="text-[10px] mt-0.5 opacity-70">
                        ~{usageStats.cloudflare.remaining_today} remaining · Resets 00:00 UTC
                      </div>
                    </div>
                  )}

                  {/* Local SANA */}
                  {selectedProvider === "sana_local" && (
                    <div className="mt-3 p-2.5 rounded-lg text-[11px]" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                      <span className="font-bold block">💻 Local SANA-Sprint Active</span>
                      <span className="text-[10px] opacity-80 mt-0.5 block">
                        100% offline GPU. Run: <code>python scripts/sana_server.py</code>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Art Style Selector */}
          <div className="sb-style-select" title="Visual art style">
            <Palette size={13} style={{ color: "var(--sb-accent)" }} />
            <span style={{ color: "var(--sb-text-muted)", fontSize: "11px", fontWeight: 600 }}>Style:</span>
            <select
              value={styleMode}
              onChange={(e) => onChangeStyleMode(e.target.value)}
              aria-label="Art style mode"
            >
              {styleModes.map((mode) => (
                <option key={mode.id} value={mode.id}>{mode.label}</option>
              ))}
            </select>
          </div>

          {/* Retry Failed (conditional) */}
          {imagesFailedCount > 0 && (
            <button
              type="button"
              onClick={onRetryFailedImages}
              disabled={retryingFailed || isGeneratingAny}
              className="sb-btn-danger"
              title="Retry only failed scenes"
            >
              <RefreshCw size={13} className={retryingFailed ? "animate-spin" : ""} />
              <span>Retry {imagesFailedCount} Failed</span>
            </button>
          )}

          {/* Generate All Images — Primary CTA */}
          <button
            type="button"
            id="storyboard-generate-all-btn"
            onClick={() => onGenerateAllImages(isAllImagesCompleted)}
            disabled={isGeneratingAny || scenesCount === 0}
            className="sb-btn-primary"
            title="Generate images for all scenes"
          >
            {generatingAllImages ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Generating…</span>
              </>
            ) : (
              <>
                <ImageIcon size={14} />
                <span>{isAllImagesCompleted ? "Regenerate All" : "Generate All Images"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Rapid Pacing Advisory Banner ──────────────────────────────── */}
      {isRapidPaced && !dismissRapidAlert && (
        <div className="sb-alert-banner">
          <div className="flex items-start gap-2.5 flex-1">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--sb-warning)" }} />
            <div style={{ fontSize: "12px" }}>
              <span className="font-bold" style={{ color: "var(--sb-warning)" }}>
                Fast subtitle pacing detected ({avgSceneDuration.toFixed(1)}s avg):{" "}
              </span>
              <span style={{ color: "var(--sb-text-secondary)" }}>
                Every 2–3 second cut causes strobe-like flashing. Use{" "}
                <strong style={{ color: "var(--sb-text-primary)" }}>Smart Cluster</strong> to group
                captions into 15–20s scenes for cinematic pacing.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={onOpenClusteringModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{ background: "var(--sb-warning)", color: "#000" }}
            >
              <Layers size={13} />
              <span>Cluster to 15s Pacing</span>
            </button>
            <button
              type="button"
              onClick={onDismissRapidAlert}
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--sb-text-muted)" }}
              title="Dismiss alert"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Generation Progress Bar ────────────────────────────────────── */}
      {(generatingAllImages || retryingFailed) && (
        <div className="sb-progress-bar-wrap">
          <div className="flex items-center justify-between" style={{ fontSize: "11.5px" }}>
            <span className="flex items-center gap-2 font-semibold" style={{ color: "var(--sb-text-primary)" }}>
              <RefreshCw size={13} className="animate-spin" style={{ color: "var(--sb-accent)" }} />
              <span>{retryingFailed ? "Retrying failed scenes…" : "Synthesizing scene visuals…"}</span>
            </span>
            <span className="font-mono" style={{ color: "var(--sb-text-secondary)", fontSize: "11px" }}>
              {imagesCompletedCount} / {scenesCount} · {Math.round((imagesCompletedCount / (scenesCount || 1)) * 100)}%
            </span>
          </div>
          <div className="sb-progress-bar-track">
            <div
              className="sb-progress-bar-fill"
              style={{ width: `${Math.max(4, (imagesCompletedCount / (scenesCount || 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
