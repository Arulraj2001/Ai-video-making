import React from "react";
import { FileAudio, BookOpen, Clapperboard, Sliders, Download } from "lucide-react";

export interface ProductPreviewFrameProps {
  activeStage: number;
  onSelectStage: (stage: number) => void;
  children: React.ReactNode;
  projectName?: string;
  resolution?: string;
  timecode?: string;
  gpuStatus?: string;
  className?: string;
}

export const STAGES = [
  { num: "01", name: "Audio & Script", icon: <FileAudio size={13} />, subtitle: "Waveform & Timestamps" },
  { num: "02", name: "Video Bible", icon: <BookOpen size={13} />, subtitle: "Character Anchors" },
  { num: "03", name: "AI Storyboard", icon: <Clapperboard size={13} />, subtitle: "3-Branch Variants" },
  { num: "04", name: "Timeline Editor", icon: <Sliders size={13} />, subtitle: "Multi-Track Sync" },
  { num: "05", name: "1080p Export", icon: <Download size={13} />, subtitle: "FFmpeg Master" },
];

export const ProductPreviewFrame: React.FC<ProductPreviewFrameProps> = ({
  activeStage,
  onSelectStage,
  children,
  projectName = "Europa Abyssal Expedition",
  resolution = "1080p60",
  timecode = "00:02:14:08",
  gpuStatus = "SANA-Sprint 1.6B: 0.8s/frame",
  className = "",
}) => {
  return (
    <div className={`app-preview-window ${className}`}>
      {/* Top Window Chrome */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-error)] opacity-80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)] opacity-80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] opacity-80" />
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--color-border-subtle)]">
            <span className="text-xs font-semibold text-[var(--color-text)] truncate max-w-[180px] sm:max-w-none">
              {projectName}
            </span>
            <span className="pill-tag-mono bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] hidden sm:inline">
              {resolution}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-[var(--color-success)] bg-[var(--color-success-subtle)] px-2.5 py-0.5 rounded-full font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] pulse-indicator" />
            {gpuStatus}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
            {timecode}
          </span>
        </div>
      </div>

      {/* Stage Navigation Strip */}
      <div className="p-2 sm:p-3 bg-[var(--color-surface-sunken)]/50 border-b border-[var(--color-border-subtle)]">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
          {STAGES.map((stg, idx) => {
            const isActive = activeStage === idx;
            return (
              <button
                key={stg.num}
                type="button"
                onClick={() => onSelectStage(idx)}
                className={`text-left p-2.5 rounded-xl transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[var(--color-surface)] border-[var(--color-primary)] shadow-sm"
                    : "hover:bg-[var(--color-surface)]/60 border-transparent text-[var(--color-text-secondary)]"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)] mb-1">
                  <span>{stg.num}</span>
                  <span className={isActive ? "text-[var(--color-primary)]" : ""}>
                    {stg.icon}
                  </span>
                </div>
                <div className={`text-xs font-bold truncate ${isActive ? "text-[var(--color-text)]" : ""}`}>
                  {stg.name}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate hidden sm:block">
                  {stg.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview Content Body */}
      <div className="p-5 sm:p-7 bg-[var(--color-background)] min-h-[380px]">
        {children}
      </div>
    </div>
  );
};
