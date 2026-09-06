import React, { useState } from 'react';
import { Film, Check, Sparkles, Monitor, Smartphone, Square, Layers, Music, Subtitles } from 'lucide-react';

interface FormatPreset {
  id: 'landscape' | 'vertical' | 'square';
  name: string;
  ratio: string;
  resolution: string;
  icon: React.ReactNode;
  recommendedFor: string;
  aspectClass: string;
}

export const ExportShowcase: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<'landscape' | 'vertical' | 'square'>('landscape');
  const [codec, setCodec] = useState<'h264' | 'hevc' | 'prores'>('h264');
  const [burnCaptions, setBurnCaptions] = useState(true);
  const [duckAudio, setDuckAudio] = useState(true);

  const formats: FormatPreset[] = [
    {
      id: 'landscape',
      name: '16:9 Master Cinema',
      ratio: '16:9',
      resolution: '1920 × 1080 (FHD)',
      icon: <Monitor className="w-4 h-4" />,
      recommendedFor: 'YouTube Main, Vimeo, Web Portals',
      aspectClass: 'aspect-video',
    },
    {
      id: 'vertical',
      name: '9:16 Social Vertical',
      ratio: '9:16',
      resolution: '1080 × 1920 (Portrait)',
      icon: <Smartphone className="w-4 h-4" />,
      recommendedFor: 'TikTok, Instagram Reels, YT Shorts',
      aspectClass: 'aspect-[9/16] max-h-[380px]',
    },
    {
      id: 'square',
      name: '1:1 Feed Standard',
      ratio: '1:1',
      resolution: '1080 × 1080 (Square)',
      icon: <Square className="w-4 h-4" />,
      recommendedFor: 'Instagram Feed, LinkedIn Video, Ads',
      aspectClass: 'aspect-square max-h-[360px]',
    },
  ];

  const currentFormat = formats.find((f) => f.id === selectedFormat)!;

  return (
    <div className="card-feature overflow-hidden border border-[var(--color-border)] shadow-md">
      {/* Top Header Bar */}
      <div className="bg-[var(--color-surface-sunken)] px-5 py-3.5 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2.5">
          <Film className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-sm font-semibold tracking-tight font-serif text-[var(--color-text)]">
            Export Composer &amp; Multi-Platform Mastering
          </span>
          <span className="text-[11px] font-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] px-2 py-0.5 rounded font-bold">
            v2.4 Core
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
          <span>RENDER ENGINE: FFMPEG NVENC HARDWARE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Interactive Config Controls (40%) */}
        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex flex-col justify-between space-y-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] font-semibold mb-3">
              1. Delivery Format &amp; Framing
            </div>
            <div className="space-y-2">
              {formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedFormat === fmt.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] shadow-xs'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        selectedFormat === fmt.id
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {fmt.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-text)]">{fmt.name}</div>
                      <div className="text-[11px] text-[var(--color-text-muted)] font-mono">{fmt.resolution}</div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface-sunken)] px-2 py-1 rounded">
                    {fmt.ratio}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] font-semibold mt-6 mb-3">
              2. Compression Codec
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'h264', label: 'H.264 (NVENC)', sub: 'Universal' },
                { id: 'hevc', label: 'H.265 (HEVC)', sub: 'Compact' },
                { id: 'prores', label: 'ProRes 422', sub: 'Master' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCodec(c.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    codec === c.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold">{c.label}</div>
                  <div
                    className={`text-[10px] ${
                      codec === c.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {c.sub}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] font-semibold mt-6 mb-3">
              3. Production Automation
            </div>
            <div className="space-y-2.5">
              <label
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border-subtle)] cursor-pointer hover:bg-[var(--color-surface-sunken)] transition-colors"
                onClick={() => setBurnCaptions(!burnCaptions)}
              >
                <div className="flex items-center gap-2.5">
                  <Subtitles className="w-4 h-4 text-[var(--color-primary)]" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text)]">Burn-in Kinetic Captions</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">Word-synced typography with auto-highlight</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    burnCaptions
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border-strong)] bg-[var(--color-surface)]'
                  }`}
                >
                  {burnCaptions && <Check className="w-3.5 h-3.5" />}
                </div>
              </label>

              <label
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border-subtle)] cursor-pointer hover:bg-[var(--color-surface-sunken)] transition-colors"
                onClick={() => setDuckAudio(!duckAudio)}
              >
                <div className="flex items-center gap-2.5">
                  <Music className="w-4 h-4 text-[var(--color-primary)]" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text)]">Intelligent Audio Ducking</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">Automatically ducks BGM by -14dB during voiceover</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    duckAudio
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border-strong)] bg-[var(--color-surface)]'
                  }`}
                >
                  {duckAudio && <Check className="w-3.5 h-3.5" />}
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] mb-2">
              <span>Estimated Render Time:</span>
              <span className="text-[var(--color-text)] font-bold">14.2 seconds</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] mb-3">
              <span>Output File Size:</span>
              <span className="text-[var(--color-text)] font-bold">~42.8 MB</span>
            </div>
            <button className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-xs font-sans flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">
              <Sparkles className="w-4 h-4" />
              <span>Compile Master 1080p Export</span>
            </button>
          </div>
        </div>

        {/* Right Dynamic Aspect Canvas Preview (60%) */}
        <div className="lg:col-span-7 bg-[#0E171B] p-6 lg:p-8 flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#8BA4AE 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Top Canvas Status */}
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#8BA4AE] mb-4 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>CANVAS MONITOR</span>
            </div>
            <div>{currentFormat.resolution} @ 30.00 FPS</div>
          </div>

          {/* Video Preview Aspect Frame */}
          <div
            className={`w-full max-w-[480px] bg-[#182C34] border border-[#244855]/80 rounded-md overflow-hidden shadow-2xl relative transition-all duration-300 flex flex-col justify-between ${currentFormat.aspectClass}`}
          >
            {/* Mock video content inside canvas */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 flex flex-col justify-between p-4 z-0">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/80">
                <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">SCENE 04</span>
                <span className="bg-[#E64833]/80 px-2 py-0.5 rounded text-white font-medium">
                  {currentFormat.ratio}
                </span>
              </div>

              {/* Dynamic simulated caption burn-in */}
              {burnCaptions && (
                <div className="text-center my-auto px-4 z-10">
                  <div className="inline-block bg-black/70 backdrop-blur-xs px-3 py-1 rounded text-xs sm:text-sm font-bold text-white tracking-wide shadow-md">
                    "The neural diffusion model generates{' '}
                    <span className="text-[#E64833] underline decoration-[#E64833] decoration-2">
                      frame-perfect
                    </span>{' '}
                    fidelity."
                  </div>
                </div>
              )}

              {/* Audio & Codec telemetry overlay */}
              <div className="flex items-center justify-between text-[10px] font-mono text-white/70 pt-2 border-t border-white/10">
                <span>{codec.toUpperCase()} / CBR 24Mbps</span>
                <span className="flex items-center gap-1">
                  <Music className="w-3 h-3 text-[#E64833]" />
                  {duckAudio ? 'DUCKING: -14dB ACTIVE' : 'DUCKING: OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Canvas Description */}
          <div className="w-full mt-4 flex items-center justify-between text-xs text-[#8BA4AE] z-10">
            <span className="flex items-center gap-1.5 font-sans">
              <Layers className="w-3.5 h-3.5 text-[#E64833]" />
              {currentFormat.recommendedFor}
            </span>
            <span className="font-mono text-[11px] text-emerald-400">Zero Aspect Stretching</span>
          </div>
        </div>
      </div>
    </div>
  );
};
