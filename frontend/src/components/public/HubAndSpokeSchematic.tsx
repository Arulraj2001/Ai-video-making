import React, { useState } from "react";
import {
  FileAudio,
  BookOpen,
  Sparkles,
  Film,
  Download,
  Cpu,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface NodeData {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  busLabel: string;
  status: string;
  telemetry: {
    label: string;
    value: string;
  }[];
  specDetails: string;
}

export const HubAndSpokeSchematic: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [activeNodeId, setActiveNodeId] = useState<string>("bible");

  const nodes: Record<string, NodeData> = {
    audio: {
      id: "audio",
      number: "01",
      title: "Audio Slicer",
      subtitle: "Narration & RMS Alignment",
      busLabel: "BUS-A // WAVEFORM",
      status: "SYNCED (0.02ms)",
      telemetry: [
        { label: "Sample Rate", value: "48.0 kHz" },
        { label: "Pause Threshold", value: "> 350 ms" },
        { label: "RMS Ceiling", value: "-14 dB" },
      ],
      specDetails:
        "Analyzes raw voiceover stems to cluster spoken sentences into natural scene boundaries without cutting off trailing syllables.",
    },
    bible: {
      id: "bible",
      number: "02",
      title: "Video Bible",
      subtitle: "Deterministic Persistence",
      busLabel: "BUS-B // ENTITY_LOCK",
      status: "PERSISTENT (100%)",
      telemetry: [
        { label: "Facial Drift", value: "0.0%" },
        { label: "Token Weight", value: "1.35x" },
        { label: "Entity Manifest", value: "JSON v2" },
      ],
      specDetails:
        "Extracts character facial geometry, wardrobe apparel, and hero props into deterministic visual seeds injected into all scenes.",
    },
    storyboard: {
      id: "storyboard",
      number: "03",
      title: "SANA Diffusion",
      subtitle: "3-Branch Neural Storyboard",
      busLabel: "BUS-C // 1.6B_DiT",
      status: "READY (0.82s)",
      telemetry: [
        { label: "Inference Latency", value: "0.82s" },
        { label: "VRAM Footprint", value: "3.4 GB" },
        { label: "Distilled Steps", value: "4 Steps" },
      ],
      specDetails:
        "Runs SANA-Sprint 1.6B DiT locally on RTX GPUs or cloud fallback to generate Wide, Close-Up, and Cutaway artistic branches simultaneously.",
    },
    timeline: {
      id: "timeline",
      number: "04",
      title: "NLE Timeline",
      subtitle: "Sidechain Ducking Engine",
      busLabel: "BUS-D // MULTI_TRACK",
      status: "ACTIVE (3-TRACK)",
      telemetry: [
        { label: "Track Sync", value: "Frame-Locked" },
        { label: "Music Ducking", value: "-16.5 dB" },
        { label: "Playhead Scrub", value: "60 FPS" },
      ],
      specDetails:
        "Coordinates visual clips, speech stems, and ambient soundtrack. Automatically ducks background music during dialogue passages.",
    },
    export: {
      id: "export",
      number: "05",
      title: "FFmpeg NVENC",
      subtitle: "1080p Master Renderer",
      busLabel: "BUS-E // MASTER_RENDER",
      status: "ONLINE (NVENC)",
      telemetry: [
        { label: "Encoding", value: "H.264 High" },
        { label: "Bitrate", value: "24.0 Mbps" },
        { label: "Color Space", value: "Rec.709" },
      ],
      specDetails:
        "Hardware-accelerated rendering mastering 16:9 YouTube, 9:16 vertical Reels, and burned-in kinetic typography in ~30 seconds.",
    },
  };

  const activeNode = nodes[activeNodeId] || nodes.bible;

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto rounded-[var(--rounded-md)] p-6 sm:p-8 bg-[var(--neu-bg)] border border-[var(--neu-border)] transition-all duration-300 ${className}`}
      style={{
        boxShadow: "var(--shadow-neu-flat)",
      }}
    >
      {/* Precision CAD Grid Blueprint Background */}
      <div className="absolute inset-0 schematic-dot-grid opacity-60 rounded-[var(--rounded-md)] pointer-events-none" />

      {/* Top Telemetry Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[var(--neu-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[var(--neu-accent)] animate-pulse-node shadow-[0_0_8px_rgba(235,87,87,0.7)]" />
          <span className="meta-mono font-bold text-xs text-[var(--neu-text)]">
            SYSTEM SCHEMATIC // HUB-AND-SPOKE AI BUS
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[var(--neu-text-secondary)]">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--neu-bg)] border border-[var(--neu-border-subtle)] shadow-[var(--shadow-neu-inset-sm)]">
            <Cpu size={12} className="text-[var(--neu-accent)]" />
            <span>RTX ACCELERATED</span>
          </div>
          <span className="hidden sm:inline text-[var(--neu-text-muted)]">•</span>
          <span className="text-[var(--neu-text-muted)] text-[11px]">CLOCK: 2.45 GHz</span>
        </div>
      </div>

      {/* Schematic Core Canvas */}
      <div className="relative z-10 py-8 min-h-[380px] sm:min-h-[440px] flex items-center justify-center">
        {/* SVG Flow Lines Connecting Spokes to Central Hub */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 440">
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--neu-accent)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--neu-accent)" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Center Coordinates (400, 220) */}
          {/* Spoke 1 (Audio): (160, 110) */}
          <line
            x1="400"
            y1="220"
            x2="180"
            y2="110"
            stroke="var(--neu-accent)"
            strokeWidth="1.75"
            className="animate-flow-dash"
            opacity={activeNodeId === "audio" ? "1" : "0.35"}
          />
          {/* Spoke 2 (Bible): (620, 110) */}
          <line
            x1="400"
            y1="220"
            x2="620"
            y2="110"
            stroke="var(--neu-accent)"
            strokeWidth="1.75"
            className="animate-flow-dash"
            opacity={activeNodeId === "bible" ? "1" : "0.35"}
          />
          {/* Spoke 3 (Storyboard): (660, 310) */}
          <line
            x1="400"
            y1="220"
            x2="640"
            y2="310"
            stroke="var(--neu-accent)"
            strokeWidth="1.75"
            className="animate-flow-dash"
            opacity={activeNodeId === "storyboard" ? "1" : "0.35"}
          />
          {/* Spoke 4 (Timeline): (140, 310) */}
          <line
            x1="400"
            y1="220"
            x2="160"
            y2="310"
            stroke="var(--neu-accent)"
            strokeWidth="1.75"
            className="animate-flow-dash"
            opacity={activeNodeId === "timeline" ? "1" : "0.35"}
          />
          {/* Spoke 5 (Export): (400, 380) */}
          <line
            x1="400"
            y1="220"
            x2="400"
            y2="370"
            stroke="var(--neu-accent)"
            strokeWidth="1.75"
            className="animate-flow-dash"
            opacity={activeNodeId === "export" ? "1" : "0.35"}
          />

          {/* Concentric Schematic Radar Circles around Central Hub */}
          <circle cx="400" cy="220" r="75" fill="none" stroke="var(--neu-border-subtle)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="400" cy="220" r="130" fill="none" stroke="var(--neu-border-subtle)" strokeWidth="1" strokeDasharray="2 8" opacity="0.6" />
        </svg>

        {/* Central Hub Node (Tactile Soft Circle) */}
        <div
          className="relative z-20 w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all duration-300"
          style={{
            background: "var(--neu-bg)",
            boxShadow:
              "8px 8px 22px var(--neu-shadow-dark), -8px -8px 22px var(--neu-shadow-light)",
            border: "2px solid var(--neu-border-subtle)",
          }}
          onClick={() => setActiveNodeId("bible")}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-primary-subtle)] text-[var(--neu-accent)] mb-1.5 shadow-[var(--shadow-neu-inset-sm)]">
            <Zap size={20} className="animate-pulse" />
          </div>
          <span className="text-[11px] font-bold tracking-tight text-[var(--neu-text)] uppercase font-mono leading-tight">
            Scenora Core
          </span>
          <span className="text-[9px] font-mono text-[var(--neu-accent)] font-semibold mt-0.5">
            ORCHESTRATOR
          </span>
        </div>

        {/* Radial Spoke 1: Audio Slicer (Top Left) */}
        <div
          onClick={() => setActiveNodeId("audio")}
          className={`absolute top-4 left-4 sm:left-12 z-20 flex items-center gap-3 p-2.5 sm:p-3 rounded-[var(--rounded-sm)] cursor-pointer transition-all duration-200 ${
            activeNodeId === "audio"
              ? "border-2 border-[var(--neu-accent)] shadow-[var(--shadow-neu-lifted)]"
              : "border border-[var(--neu-border-subtle)] shadow-[var(--shadow-neu-flat)] hover:-translate-y-1"
          }`}
          style={{ background: "var(--neu-bg)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--neu-bg)] shadow-[var(--shadow-neu-inset-sm)] text-[var(--neu-accent)]">
            <FileAudio size={16} />
          </div>
          <div className="hidden sm:block">
            <div className="meta-mono text-[10px] text-[var(--neu-text-muted)]">NODE 01</div>
            <div className="text-xs font-bold text-[var(--neu-text)]">Audio Slicer</div>
          </div>
        </div>

        {/* Radial Spoke 2: Video Bible (Top Right) */}
        <div
          onClick={() => setActiveNodeId("bible")}
          className={`absolute top-4 right-4 sm:right-12 z-20 flex items-center gap-3 p-2.5 sm:p-3 rounded-[var(--rounded-sm)] cursor-pointer transition-all duration-200 ${
            activeNodeId === "bible"
              ? "border-2 border-[var(--neu-accent)] shadow-[var(--shadow-neu-lifted)]"
              : "border border-[var(--neu-border-subtle)] shadow-[var(--shadow-neu-flat)] hover:-translate-y-1"
          }`}
          style={{ background: "var(--neu-bg)" }}
        >
          <div className="hidden sm:block text-right">
            <div className="meta-mono text-[10px] text-[var(--neu-text-muted)]">NODE 02</div>
            <div className="text-xs font-bold text-[var(--neu-text)]">Video Bible</div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--neu-bg)] shadow-[var(--shadow-neu-inset-sm)] text-[var(--neu-accent)]">
            <BookOpen size={16} />
          </div>
        </div>

        {/* Radial Spoke 3: SANA Diffusion (Bottom Right) */}
        <div
          onClick={() => setActiveNodeId("storyboard")}
          className={`absolute bottom-8 right-4 sm:right-10 z-20 flex items-center gap-3 p-2.5 sm:p-3 rounded-[var(--rounded-sm)] cursor-pointer transition-all duration-200 ${
            activeNodeId === "storyboard"
              ? "border-2 border-[var(--neu-accent)] shadow-[var(--shadow-neu-lifted)]"
              : "border border-[var(--neu-border-subtle)] shadow-[var(--shadow-neu-flat)] hover:-translate-y-1"
          }`}
          style={{ background: "var(--neu-bg)" }}
        >
          <div className="hidden sm:block text-right">
            <div className="meta-mono text-[10px] text-[var(--neu-text-muted)]">NODE 03</div>
            <div className="text-xs font-bold text-[var(--neu-text)]">SANA 1.6B</div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--neu-bg)] shadow-[var(--shadow-neu-inset-sm)] text-[var(--neu-accent)]">
            <Sparkles size={16} />
          </div>
        </div>

        {/* Radial Spoke 4: NLE Timeline (Bottom Left) */}
        <div
          onClick={() => setActiveNodeId("timeline")}
          className={`absolute bottom-8 left-4 sm:left-10 z-20 flex items-center gap-3 p-2.5 sm:p-3 rounded-[var(--rounded-sm)] cursor-pointer transition-all duration-200 ${
            activeNodeId === "timeline"
              ? "border-2 border-[var(--neu-accent)] shadow-[var(--shadow-neu-lifted)]"
              : "border border-[var(--neu-border-subtle)] shadow-[var(--shadow-neu-flat)] hover:-translate-y-1"
          }`}
          style={{ background: "var(--neu-bg)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--neu-bg)] shadow-[var(--shadow-neu-inset-sm)] text-[var(--neu-accent)]">
            <Film size={16} />
          </div>
          <div className="hidden sm:block">
            <div className="meta-mono text-[10px] text-[var(--neu-text-muted)]">NODE 04</div>
            <div className="text-xs font-bold text-[var(--neu-text)]">NLE Timeline</div>
          </div>
        </div>

        {/* Radial Spoke 5: FFmpeg Export (Bottom Center) */}
        <div
          onClick={() => setActiveNodeId("export")}
          className={`absolute bottom-0 z-20 flex items-center gap-3 px-4 py-2.5 rounded-[var(--rounded-sm)] cursor-pointer transition-all duration-200 ${
            activeNodeId === "export"
              ? "border-2 border-[var(--neu-accent)] shadow-[var(--shadow-neu-lifted)]"
              : "border border-[var(--neu-border-subtle)] shadow-[var(--shadow-neu-flat)] hover:-translate-y-1"
          }`}
          style={{ background: "var(--neu-bg)" }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--neu-bg)] shadow-[var(--shadow-neu-inset-sm)] text-[var(--neu-accent)]">
            <Download size={14} />
          </div>
          <div>
            <div className="meta-mono text-[9px] text-[var(--neu-text-muted)]">NODE 05</div>
            <div className="text-xs font-bold text-[var(--neu-text)]">1080p FFmpeg</div>
          </div>
        </div>
      </div>

      {/* Interactive Telemetry Inspector Deck for Active Spoke */}
      <div
        className="relative z-10 mt-6 p-5 sm:p-6 rounded-[var(--rounded-sm)] border border-[var(--neu-border)] transition-all duration-300"
        style={{
          background: "var(--neu-bg)",
          boxShadow: "var(--shadow-neu-inset)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--neu-border-subtle)]">
          <div className="flex items-center gap-3">
            <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--neu-accent)] font-bold text-xs">
              {activeNode.busLabel}
            </span>
            <h4 className="text-sm font-bold text-[var(--neu-text)] font-sans">
              {activeNode.title} — <span className="text-[var(--neu-text-secondary)] font-normal">{activeNode.subtitle}</span>
            </h4>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-mono text-[var(--color-success-text)]">
            <CheckCircle2 size={13} className="text-[var(--color-success)]" />
            <span>STATUS: {activeNode.status}</span>
          </div>
        </div>

        <p className="text-xs text-[var(--neu-text-secondary)] leading-relaxed mt-3 max-w-3xl">
          {activeNode.specDetails}
        </p>

        {/* Live Monospace Metric Tiles */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 pt-3 border-t border-[var(--neu-border-subtle)]">
          {activeNode.telemetry.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-[var(--radius-sm)] bg-[var(--neu-bg)] border border-[var(--neu-border-subtle)] shadow-[var(--shadow-neu-flat)]"
            >
              <div className="meta-mono text-[10px] text-[var(--neu-text-muted)]">{item.label}</div>
              <div className="text-sm font-bold font-mono text-[var(--neu-text)] mt-0.5">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
