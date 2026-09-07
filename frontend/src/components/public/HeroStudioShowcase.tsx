import React, { useState } from "react";
import {
  Play,
  Volume2,
  Maximize2,
  User,
  Video,
  Music,
  Download,
  ChevronRight,
} from "lucide-react";

export const HeroStudioShowcase: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Waveform heights for speech narration (high peaks, rhythmic dialogue)
  const narrationPeaks = [
    12, 18, 26, 32, 28, 14, 20, 36, 42, 38, 24, 16, 28, 34, 40, 32, 18, 10,
    14, 22, 30, 38, 34, 20, 16, 28, 36, 44, 40, 26, 18, 24, 32, 38, 30, 14,
    8, 12, 20, 30, 36, 28, 16, 22, 34, 42, 36, 20, 14, 24, 32, 38, 30, 16,
  ];

  // Waveform heights for music with automatic -16dB ducking dip during narration
  const musicPeaks = [
    32, 36, 34, 30, 28, 20, 12, 8, 7, 8, 9, 8, 7, 8, 9, 8, 7, 8,
    9, 8, 7, 8, 9, 8, 7, 8, 9, 8, 7, 8, 9, 8, 7, 8, 9, 8,
    10, 14, 22, 28, 32, 36, 34, 32, 36, 34, 30, 28, 22, 14, 10, 8, 8, 9,
  ];

  return (
    <div className="relative w-full max-w-[690px] mx-auto lg:ml-auto select-none">
      <div className="flex items-start gap-2.5 sm:gap-3.5">
        {/* ─── 1. SCENE CARDS STACK (Left of Video) ──────────────────── */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 pt-2 z-10">
          {/* Scene 1 */}
          <div className="relative w-[72px] sm:w-[84px] aspect-[4/3] rounded-[12px] overflow-hidden border border-white/90 dark:border-white/10 shadow-sm bg-black group hover:scale-105 transition-transform cursor-pointer">
            <img
              src="/assets/scene_1_wide.jpg"
              alt="Scene 1"
              className="w-full h-full object-cover"
            />
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-[5px] bg-black/65 backdrop-blur-xs text-white text-[9px] font-semibold tracking-wide">
              Scene 1
            </span>
          </div>

          {/* Dotted Connector */}
          <div className="w-[1.5px] h-3 bg-[#CBD5E1] dark:bg-gray-700 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
          </div>

          {/* Scene 2 */}
          <div className="relative w-[72px] sm:w-[84px] aspect-[4/3] rounded-[12px] overflow-hidden border border-white/90 dark:border-white/10 shadow-sm bg-black group hover:scale-105 transition-transform cursor-pointer">
            <img
              src="/assets/scene_2_profile.jpg"
              alt="Scene 2"
              className="w-full h-full object-cover"
            />
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-[5px] bg-black/65 backdrop-blur-xs text-white text-[9px] font-semibold tracking-wide">
              Scene 2
            </span>
          </div>

          {/* Dotted Connector */}
          <div className="w-[1.5px] h-3 bg-[#CBD5E1] dark:bg-gray-700 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
          </div>

          {/* Scene 3 */}
          <div className="relative w-[72px] sm:w-[84px] aspect-[4/3] rounded-[12px] overflow-hidden border border-white/90 dark:border-white/10 shadow-sm bg-black group hover:scale-105 transition-transform cursor-pointer">
            <img
              src="/assets/scene_3_landscape.jpg"
              alt="Scene 3"
              className="w-full h-full object-cover"
            />
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-[5px] bg-black/65 backdrop-blur-xs text-white text-[9px] font-semibold tracking-wide">
              Scene 3
            </span>
          </div>
        </div>

        {/* ─── 2. MAIN VIDEO PLAYER + TIMELINE COLUMN ────────────────── */}
        <div className="flex-1 min-w-0 space-y-2.5 z-10">
          {/* Main Video Player Window */}
          <div className="relative rounded-[16px] overflow-hidden bg-[#0A0D12] border border-black/10 dark:border-white/10 shadow-2xl">
            {/* Top Video Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 px-3.5 py-2.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              <span className="text-white text-xs font-semibold tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--orange)] animate-pulse" />
                <span>Final Video Output</span>
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/60 text-white/90 border border-white/15">
                1080p 60FPS
              </span>
            </div>

            {/* Cinematic Main Astronaut Video Visual */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-black flex items-center justify-center">
              <img
                src="/assets/hero_astronaut_main.jpg"
                alt="Final Video Output"
                className="w-full h-full object-cover"
              />

              {/* Center Circular Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-black/55 hover:bg-black/75 border border-white/40 backdrop-blur-xs flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 cursor-pointer"
                  aria-label="Play video"
                >
                  <Play size={18} className="fill-white translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Bottom Playback Scrubber Bar */}
            <div className="px-3.5 py-2 bg-black/90 backdrop-blur-sm flex items-center justify-between text-white/90 text-xs gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:text-[var(--orange)] transition-colors cursor-pointer"
                  aria-label="Toggle playback"
                >
                  <Play size={12} className="fill-current" />
                </button>
                <span className="text-[11px] font-mono text-white/80">0:00 / 12:34</span>
              </div>

              {/* Progress Scrubber */}
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden relative cursor-pointer">
                <div className="absolute left-0 top-0 bottom-0 w-[28%] bg-gradient-to-r from-[#6366F1] to-[#FF6B00] rounded-full" />
              </div>

              <div className="flex items-center gap-2.5 text-white/70">
                <Volume2 size={13} className="hover:text-white cursor-pointer" />
                <Maximize2 size={13} className="hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Multi-Track Timeline Strip (Directly Attached Underneath) */}
          <div className="relative bg-white dark:bg-[#1E2028] rounded-[14px] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-md p-3 space-y-2">
            {/* Time Ruler */}
            <div className="relative flex justify-between text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] px-2">
              <span>00:00</span>
              <span className="text-[#6366F1] font-bold">00:05</span>
              <span>00:10</span>
              <span>00:15</span>
            </div>

            {/* Vertical Purple Playhead Indicator */}
            <div className="absolute left-[33%] top-2 bottom-2 w-[1.5px] bg-[#6366F1] z-20 pointer-events-none">
              <div className="w-2.5 h-2.5 -translate-x-[4px] -translate-y-1 bg-[#6366F1] rotate-45 rounded-[2px]" />
            </div>

            {/* Video Cut Strip (4 Slices) */}
            <div className="grid grid-cols-4 gap-1 h-7 rounded-md overflow-hidden bg-[#F1F5F9] dark:bg-[#14151B] p-0.5">
              <div className="h-full rounded overflow-hidden relative">
                <img
                  src="/assets/scene_1_wide.jpg"
                  alt="Cut 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-full rounded overflow-hidden relative">
                <img
                  src="/assets/scene_2_profile.jpg"
                  alt="Cut 2"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-full rounded overflow-hidden relative">
                <img
                  src="/assets/hero_astronaut_main.jpg"
                  alt="Cut 3"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-full rounded overflow-hidden relative">
                <img
                  src="/assets/scene_3_landscape.jpg"
                  alt="Cut 4"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Track 1: Narration (Purple Waveform) */}
            <div className="flex items-center gap-2 h-6 px-2 rounded-md bg-[#F8FAFC] dark:bg-[#14151B] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.05)]">
              <span className="text-[10px] font-semibold text-[#6366F1] shrink-0 bg-[#EEF2FF] dark:bg-[#312E81]/60 px-1.5 py-0.5 rounded">
                Narration
              </span>
              <div className="flex-1 flex items-center justify-between h-3.5 overflow-hidden gap-[1.5px]">
                {narrationPeaks.map((height, i) => (
                  <span
                    key={i}
                    className="w-[2px] bg-[#818CF8] dark:bg-[#6366F1] rounded-full shrink-0"
                    style={{ height: `${(height / 44) * 14}px` }}
                  />
                ))}
              </div>
            </div>

            {/* Track 2: Music (Auto Ducking Waveform) */}
            <div className="flex items-center gap-2 h-6 px-2 rounded-md bg-[#F8FAFC] dark:bg-[#14151B] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.05)]">
              <span className="text-[10px] font-semibold text-[#059669] shrink-0 bg-[#ECFDF5] dark:bg-[#064E3B]/60 px-1.5 py-0.5 rounded">
                Music (Auto Ducking)
              </span>
              <div className="flex-1 flex items-center justify-between h-3.5 overflow-hidden gap-[1.5px]">
                {musicPeaks.map((height, i) => (
                  <span
                    key={i}
                    className="w-[2px] bg-[#34D399] dark:bg-[#10B981] rounded-full shrink-0"
                    style={{ height: `${(height / 36) * 14}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. FLOATING AI TOOLS CARD (Right of Video) ────────────── */}
        <div className="hidden sm:block w-[136px] lg:w-[144px] shrink-0 bg-white dark:bg-[#1E2028] rounded-[16px] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-lg p-3 space-y-2 mt-3 self-start z-10">
          <div className="text-[11px] font-bold text-[#111827] dark:text-white mb-1.5">
            AI Tools
          </div>

          <div className="space-y-1 text-[11px] text-[#374151] dark:text-[#D1D5DB] font-medium">
            <div className="flex items-center justify-between p-1 rounded hover:bg-[#F1F5F9] dark:hover:bg-[#2A2C38] cursor-pointer transition-colors">
              <span className="flex items-center gap-1.5">
                <User size={12} className="text-[#6366F1]" />
                <span>Character Lock</span>
              </span>
              <ChevronRight size={11} className="text-gray-400" />
            </div>

            <div className="flex items-center justify-between p-1 rounded hover:bg-[#F1F5F9] dark:hover:bg-[#2A2C38] cursor-pointer transition-colors">
              <span className="flex items-center gap-1.5">
                <Video size={12} className="text-[#FF6B00]" />
                <span>Scene Variations</span>
              </span>
              <ChevronRight size={11} className="text-gray-400" />
            </div>

            <div className="flex items-center justify-between p-1 rounded hover:bg-[#F1F5F9] dark:hover:bg-[#2A2C38] cursor-pointer transition-colors">
              <span className="flex items-center gap-1.5">
                <Music size={12} className="text-[#10B981]" />
                <span>Audio Ducking</span>
              </span>
              <ChevronRight size={11} className="text-gray-400" />
            </div>

            <div className="flex items-center justify-between p-1 rounded hover:bg-[#F1F5F9] dark:hover:bg-[#2A2C38] cursor-pointer transition-colors">
              <span className="flex items-center gap-1.5">
                <Download size={12} className="text-[#3B82F6]" />
                <span>Export 1080p</span>
              </span>
              <ChevronRight size={11} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. HANDWRITTEN ANNOTATION IN BOTTOM RIGHT ──────────────── */}
      <div className="absolute -bottom-8 right-8 hidden md:flex flex-col items-start pointer-events-none select-none z-20">
        <span
          className="text-[19px] font-bold text-[#818CF8] dark:text-[#A5B4FC] leading-[1.15]"
          style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
        >
          One script.
        </span>
        <span
          className="text-[19px] font-bold text-[#818CF8] dark:text-[#A5B4FC] leading-[1.15]"
          style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
        >
          A complete video.
        </span>
        {/* Curved Doodle Arrow Pointing to Timeline */}
        <svg
          className="w-14 h-8 text-[#818CF8] dark:text-[#A5B4FC] mt-0.5 -scale-x-100"
          viewBox="0 0 54 36"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 6 6 Q 34 8 42 26" />
          <path d="M 32 24 L 42 26 L 44 16" />
        </svg>
      </div>
    </div>
  );
};
