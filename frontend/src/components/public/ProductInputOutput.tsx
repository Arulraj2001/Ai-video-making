import React, { useState } from "react";
import {
  Play,
  Pause,
  Sparkles,
  Volume2,
  CheckCircle2,
  Maximize2,
  Film,
  User,
} from "lucide-react";

interface ProductInputOutputProps {
  className?: string;
}

export const ProductInputOutput: React.FC<ProductInputOutputProps> = ({ className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeCutIndex, setActiveCutIndex] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  const scenes = [
    {
      id: 1,
      time: "00:00 - 00:04",
      script: "Deep beneath the Europa ice crust, the geothermal vents began to pulse with rhythmic light.",
      angle: "Wide Establishing Shot",
      visualTitle: "Europa Hydrothermal Trench",
      bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)",
    },
    {
      id: 2,
      time: "00:04 - 00:08",
      script: "Dr. Elena Vance checked her pressurized amber visor as internal oxygen levels steadily stabilized.",
      angle: "Character Macro Angle",
      visualTitle: "Dr. Elena Vance • Visor Reflection",
      bgGradient: "linear-gradient(135deg, #111827 0%, #1f2937 40%, #431407 100%)",
    },
    {
      id: 3,
      time: "00:08 - 00:12",
      script: "The telemetry confirmed what no one on Earth was prepared for: the signal was conscious.",
      angle: "Environmental Perspective",
      visualTitle: "Sub-Surface Acoustic Array",
      bgGradient: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #042f2e 100%)",
    },
  ];

  const currentScene = scenes[activeCutIndex];

  return (
    <div className={`w-full ${className}`}>
      {/* Outer Showcase Container */}
      <div className="bg-[var(--white)] rounded-[20px] border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden transition-all">
        {/* Top Workflow Stage Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--orange)] shrink-0 animate-pulse" />
            <span className="text-[14px] font-bold text-[var(--text)]">
              Product Workflow
            </span>
            <span className="text-[var(--border-strong)]">•</span>
            <span className="text-[13px] font-medium text-[var(--purple)] bg-[var(--purple-subtle)] px-3 py-0.5 rounded-full">
              Script Input → AI Continuity → Video Output
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-[var(--text-secondary)] font-medium text-xs sm:text-sm">Aspect Ratio:</span>
            <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--white)] p-0.5 shadow-xs">
              <button
                onClick={() => setAspectRatio("16:9")}
                className={`px-3 py-1 rounded-md font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                  aspectRatio === "16:9"
                    ? "bg-[var(--orange)] text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                16:9 YouTube
              </button>
              <button
                onClick={() => setAspectRatio("9:16")}
                className={`px-3 py-1 rounded-md font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                  aspectRatio === "9:16"
                    ? "bg-[var(--orange)] text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                9:16 Shorts
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Core Flow: Input (Left) -> Video Output & Audio (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)]">
          {/* 1. INPUT: Narration Script + Video Bible Character (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-6 bg-[var(--surface)]/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Film size={16} className="text-[var(--orange)]" />
                  1. Spoken Narration Script
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">3 Scenes</span>
              </div>

              {/* Scene Script Selector Cards */}
              <div className="space-y-2.5">
                {scenes.map((sc, idx) => (
                  <button
                    key={sc.id}
                    onClick={() => setActiveCutIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-[12px] transition-all cursor-pointer border ${
                      activeCutIndex === idx
                        ? "bg-[var(--white)] border-[var(--orange)] shadow-xs"
                        : "bg-[var(--white)]/70 border-[var(--border)] hover:bg-[var(--white)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-[var(--orange)]">Scene {sc.id}</span>
                      <span className="text-[var(--text-muted)] font-medium">{sc.time}</span>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-[var(--text)] font-medium leading-relaxed">
                      "{sc.script}"
                    </p>
                  </button>
                ))}
              </div>

              {/* Video Bible Character Lock Card */}
              <div className="p-4 rounded-[14px] bg-[var(--white)] border border-[var(--border)] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <User size={15} className="text-[var(--purple)]" />
                    Video Bible Continuity
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-success-text)] bg-[var(--color-success-subtle)] px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Character Locked
                  </span>
                </div>
                <div className="text-[13px] text-[var(--text-secondary)] space-y-1">
                  <p className="font-medium text-[var(--text)]">Character Profile: Dr. Elena Vance</p>
                  <p className="text-[var(--text-muted)] leading-relaxed">
                    Facial geometry and wardrobe remain identical across every single cut without distortion.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Click any script cut above to preview the generated video scene.
            </p>
          </div>

          {/* 2. OUTPUT: Video Canvas & Timeline (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-6">
            <div>
              {/* Output Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <Sparkles size={16} className="text-[var(--purple)]" />
                    2. Rendered Video Preview
                  </span>
                  <span className="text-xs font-bold text-white bg-[var(--purple)] px-2.5 py-0.5 rounded-full">
                    1080p Master
                  </span>
                </div>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {currentScene.angle}
                </span>
              </div>

              {/* Video Player Canvas */}
              <div
                className={`relative w-full rounded-[16px] overflow-hidden border border-[var(--border)] shadow-md transition-all duration-300 ${
                  aspectRatio === "9:16" ? "max-w-[340px] mx-auto aspect-[9/16]" : "aspect-[16/9]"
                }`}
                style={{ background: currentScene.bgGradient }}
              >
                {/* Visual Simulation Display */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-medium border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>{currentScene.time}</span>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-semibold border border-white/10 text-white">
                      {currentScene.angle}
                    </div>
                  </div>

                  {/* Center Artistic Title & Subtitle */}
                  <div className="text-center space-y-2 my-auto px-4">
                    <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">
                      {currentScene.visualTitle}
                    </h4>
                    <p className="text-xs sm:text-sm text-white/90 max-w-md mx-auto italic drop-shadow-sm leading-relaxed">
                      "{currentScene.script}"
                    </p>
                  </div>

                  {/* Bottom Video Controls Overlay */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/15">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-md"
                        aria-label={isPlaying ? "Pause preview" : "Play preview"}
                      >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                      </button>
                      <span className="text-xs font-medium text-white/90">00:05 / 00:12</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/90 font-medium">
                      <span className="hidden sm:inline">Auto-Ducked Audio (-16dB)</span>
                      <Maximize2 size={15} className="cursor-pointer opacity-80 hover:opacity-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Waveform & Multi-Track Timeline */}
            <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Volume2 size={14} className="text-[var(--blue)]" />
                  Synchronized Timeline &amp; Audio Ducking
                </span>
                <span className="text-xs font-semibold text-[var(--color-success-text)]">
                  Speech Priority Active
                </span>
              </div>

              {/* Scene Cut Track */}
              <div className="grid grid-cols-3 gap-2 h-8">
                {scenes.map((sc, idx) => (
                  <button
                    key={sc.id}
                    onClick={() => setActiveCutIndex(idx)}
                    className={`rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer border ${
                      activeCutIndex === idx
                        ? "bg-[var(--purple)] text-white border-[var(--purple)] shadow-xs"
                        : "bg-[var(--white)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--purple)]"
                    }`}
                  >
                    Scene 0{sc.id}
                  </button>
                ))}
              </div>

              {/* Audio Waveform Track */}
              <div className="h-7 rounded-lg bg-[var(--white)] border border-[var(--border)] px-2 flex items-center gap-0.5">
                {Array.from({ length: 48 }).map((_, i) => {
                  const h = [35, 65, 90, 80, 45, 95, 100, 60, 30, 80, 85, 40][i % 12];
                  const isCutActive = Math.floor(i / 16) === activeCutIndex;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-full transition-all"
                      style={{
                        height: `${h}%`,
                        backgroundColor: isCutActive ? "var(--orange)" : "var(--border-strong)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
