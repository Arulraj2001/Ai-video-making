import React from "react";
import { Sliders, CheckCircle2 } from "lucide-react";

export const TimelineShowcase: React.FC = () => {
  return (
    <div className="w-full space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] shadow-sm mb-3">
            <Sliders size={12} className="text-[var(--color-primary)]" />
            <span className="meta-mono uppercase text-[11px] font-bold">Timeline Automation</span>
          </div>
          <h2 className="section-headline">
            Frame-accurate multi-track video assembly.
          </h2>
        </div>
        <p className="prose-body text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-md">
          Narration timestamps automatically govern video cut points, and background music ducks whenever dialogue begins.
        </p>
      </div>

      {/* Software Timeline Canvas (Level 3 Creative Software UI) */}
      <div className="card-feature p-5 sm:p-6 bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3 meta-mono text-xs relative overflow-hidden">
        {/* Playhead Timecode Ruler */}
        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pb-2 border-b border-[var(--color-border-subtle)] px-2">
          <span>00:00.00</span>
          <span>00:04.00</span>
          <span className="text-[var(--color-primary)] font-bold">00:08.00 (PLAYHEAD)</span>
          <span>00:12.00</span>
          <span>00:16.00</span>
        </div>

        {/* Track 1: Video Scene Clips */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-bold">
            <span>TRACK 1: VISUAL STORYBOARD (1080p60)</span>
            <span>4 Clips Active</span>
          </div>
          <div className="grid grid-cols-12 gap-1.5 h-10">
            <div className="col-span-3 rounded-lg bg-[var(--color-secondary)] text-white text-[10px] flex items-center justify-center font-bold px-2 truncate">
              SCENE 01 (3.2s)
            </div>
            <div className="col-span-4 rounded-lg bg-[var(--color-secondary)] text-white text-[10px] flex items-center justify-center font-bold px-2 truncate">
              SCENE 02 (4.8s)
            </div>
            <div className="col-span-3 rounded-lg bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center font-bold px-2 truncate border border-white/40 shadow-sm">
              SCENE 03 (IN FOCUS)
            </div>
            <div className="col-span-2 rounded-lg bg-[var(--color-secondary)] text-white text-[10px] flex items-center justify-center font-bold px-2 truncate">
              SCENE 04
            </div>
          </div>
        </div>

        {/* Track 2: Voiceover Narration Waveform */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-bold">
            <span>TRACK 2: VOICEOVER NARRATION (SYNCED WAVEFORM)</span>
            <span>0dB Master</span>
          </div>
          <div className="h-8 rounded-lg bg-[var(--scenora-rust)]/85 text-white text-[10px] flex items-center px-4 font-semibold justify-between">
            <span>narration_europa_master.wav</span>
            <span className="text-[9px] meta-mono bg-black/30 px-2 py-0.5 rounded">AUTO-SLICED</span>
          </div>
        </div>

        {/* Track 3: Background Score with Ducking */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-bold">
            <span>TRACK 3: BACKGROUND SCORE (AMBIENCE)</span>
            <span>-18dB Ducked</span>
          </div>
          <div className="h-8 rounded-lg bg-[var(--scenora-petrol)]/75 text-[var(--scenora-linen)] text-[10px] flex items-center px-4 font-semibold justify-between">
            <span>abyssal_synth_ambient_loop.mp3</span>
            <span className="text-[9px] meta-mono bg-black/30 px-2 py-0.5 rounded">DUCKING ON</span>
          </div>
        </div>
      </div>

      {/* 3 Inline Value Indicators Below (Level 4: No enclosing card) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div className="flex items-start gap-2 text-xs">
          <CheckCircle2 size={15} className="text-[var(--color-success)] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[var(--color-text)] block">Frame-accurate cuts</strong>
            <span className="text-[var(--color-text-secondary)]">Clips snap precisely to speech pauses.</span>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <CheckCircle2 size={15} className="text-[var(--color-success)] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[var(--color-text)] block">Intelligent audio ducking</strong>
            <span className="text-[var(--color-text-secondary)]">Music lowers automatically during narration.</span>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <CheckCircle2 size={15} className="text-[var(--color-success)] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[var(--color-text)] block">Full Cinema Preview</strong>
            <span className="text-[var(--color-text-secondary)]">Test-drive the final export in real time.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
