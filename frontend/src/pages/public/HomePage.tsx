import React, { useState } from 'react';
import { useRouter } from '../../router/Router';
import { Button } from '../../components/ui/Button';
import { SiteContainer } from '../../components/public/SiteContainer';
import { SectionHeader } from '../../components/public/SectionHeader';
import { ProductPreviewFrame } from '../../components/public/ProductPreviewFrame';
import { PipelineDiagram } from '../../components/public/PipelineDiagram';
import { VideoBibleShowcase } from '../../components/public/VideoBibleShowcase';
import { TimelineShowcase } from '../../components/public/TimelineShowcase';
import { GpuTechnicalPanel } from '../../components/public/GpuTechnicalPanel';
import { ExportShowcase } from '../../components/public/ExportShowcase';
import {
  ArrowRight,
  Play,
  CheckCircle2,
  Users,
  Clapperboard,
  Timer,
  ShieldCheck,
  Star,
  Check,
  Volume2,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();

  // Interactive Product Preview State
  const [activeStage, setActiveStage] = useState<number>(2); // 0: Audio, 1: Bible, 2: Storyboard, 3: Timeline, 4: Export
  const [selectedBranch, setSelectedBranch] = useState<string>('B');
  const [activeTestimonialGenre, setActiveTestimonialGenre] = useState<string>('all');

  const stats = [
    { value: '2,400+', label: 'Active creators', icon: <Users size={16} /> },
    { value: '1.2M+', label: 'Scenes rendered', icon: <Clapperboard size={16} /> },
    { value: '0.82s', label: 'Per-frame latency', icon: <Timer size={16} /> },
    { value: '100%', label: 'Local RTX GPU', icon: <ShieldCheck size={16} /> },
  ];

  const testimonials = [
    {
      genre: 'documentary',
      quote:
        'Went from 3-day production cycles to under 4 hours. The Video Bible keeps Dr. Elena consistent across 45 consecutive scenes without a single facial distortion or wardrobe glitch.',
      author: 'Marcus Chen',
      role: 'Science Documentary Channel',
      subscribers: '280K subscribers',
      initials: 'MC',
      rating: 5,
    },
    {
      genre: 'tech',
      quote:
        'ScenoraEdits understands real video production. Timestamps match narration down to the millisecond, and the multi-track timeline lets me duck background music effortlessly.',
      author: 'Priya Nair',
      role: 'Hardware & Tech Series',
      subscribers: '145K subscribers',
      initials: 'PN',
      rating: 5,
    },
    {
      genre: 'shorts',
      quote:
        'We export both 16:9 for YouTube and 9:16 for Reels from the same project file with burned-in kinetic subtitles. It eliminated our manual Premiere Pro slicing overhead.',
      author: 'David Kovacs',
      role: 'High-Velocity Studio Lead',
      subscribers: '520K followers',
      initials: 'DK',
      rating: 5,
    },
  ];

  const filteredTestimonials =
    activeTestimonialGenre === 'all'
      ? testimonials
      : testimonials.filter((t) => t.genre === activeTestimonialGenre);

  return (
    <div className="space-y-0">
      {/* ─── 1. HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="site-section-hero">
        <SiteContainer className="flex flex-col items-center text-center">
          {/* Eyebrow / Product Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] pulse-indicator" />
            <span className="meta-mono uppercase text-[var(--color-text-secondary)]">
              AI Video Pipeline
            </span>
            <span className="text-[var(--color-border-subtle)]">•</span>
            <span className="text-[var(--color-primary)] font-bold text-xs">Production v2.4</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-headline mb-6">
            Turn voiceover scripts into <span className="text-coral">finished video</span>.
          </h1>

          {/* Supporting Paragraph (Restrained 760px Width) */}
          <p className="prose-hero text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8">
            ScenoraEdits orchestrates voiceover audio, Video Bible character consistency, SANA-Sprint local GPU diffusion, and multi-track FFmpeg assembly in a single production workflow.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Button
              size="lg"
              variant="primary"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => navigate('/app')}
              className="px-7 font-bold shadow-xs"
            >
              Launch ScenoraEdits Studio
            </Button>
            <Button
              size="lg"
              variant="secondary"
              leftIcon={<Play size={15} />}
              onClick={() => navigate('/how-it-works')}
              className="px-6"
            >
              Explore 5-Stage Pipeline
            </Button>
          </div>

          {/* Trust/Value Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--color-text-muted)] font-medium mb-12">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[var(--color-success)] shrink-0" />
              <span>No API keys required</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[var(--color-success)] shrink-0" />
              <span>100% Free local RTX GPU</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[var(--color-success)] shrink-0" />
              <span>Full HD 1080p MP4 master</span>
            </span>
          </div>

          {/* ─── 2. PRODUCT UI SHOWCASE (Realistic Creative Software Window) ─────── */}
          <div className="w-full">
            <ProductPreviewFrame
              activeStage={activeStage}
              onSelectStage={setActiveStage}
              projectName="Europa Abyssal Expedition"
              resolution="1080p60"
              timecode="00:02:14:08"
              gpuStatus="SANA-Sprint 1.6B: 0.82s/frame"
            >
              {/* STAGE 0: Script & Audio Ingestion */}
              {activeStage === 0 && (
                <div className="space-y-4 text-left animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text)] font-serif">
                        Audio Track Ingestion &amp; Caption Slicing
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Voiceover audio automatically mapped to 11 scene slots with millisecond cut precision.
                      </p>
                    </div>
                    <span className="pill-tag-mono bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      narration_europa.wav
                    </span>
                  </div>

                  <div className="p-4 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-3">
                    <div className="flex items-center justify-between text-xs meta-mono text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1.5 text-[var(--color-primary)] font-bold">
                        <Volume2 size={13} /> 44.1kHz • 24-bit Stereo
                      </span>
                      <span>Total Duration: 04:12</span>
                    </div>

                    {/* Waveform Slices */}
                    <div className="h-14 flex items-center gap-1 px-2 bg-[var(--color-surface-sunken)]/60 rounded overflow-hidden">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const heights = [25, 45, 75, 90, 50, 85, 65, 35, 70, 95, 80, 40, 60, 85, 70, 45, 90, 100, 75, 55];
                        const h = heights[i % heights.length];
                        const isCurrent = i >= 16 && i <= 28;
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-full transition-all"
                            style={{
                              height: `${h}%`,
                              backgroundColor: isCurrent ? 'var(--color-primary)' : 'var(--scenora-sage)',
                              opacity: isCurrent ? 1 : 0.45,
                            }}
                          />
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                      <div className="p-2.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs">
                        <div className="flex justify-between text-[10px] meta-mono text-[var(--color-text-muted)] mb-1">
                          <span>SCENE 01 // 00:00 - 00:18</span>
                          <span className="text-[var(--color-success)]">Locked</span>
                        </div>
                        <p className="text-[var(--color-text-secondary)] italic truncate">
                          "Three kilometers beneath Europa's frozen crust..."
                        </p>
                      </div>
                      <div className="p-2.5 rounded border border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/30 text-xs">
                        <div className="flex justify-between text-[10px] meta-mono text-[var(--color-primary)] font-bold mb-1">
                          <span>SCENE 02 // 00:18 - 00:36 (ACTIVE)</span>
                          <span>In Focus</span>
                        </div>
                        <p className="text-[var(--color-text)] font-medium truncate">
                          "Dr. Elena Vance adjusts her telemetry visor..."
                        </p>
                      </div>
                      <div className="p-2.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs">
                        <div className="flex justify-between text-[10px] meta-mono text-[var(--color-text-muted)] mb-1">
                          <span>SCENE 03 // 00:36 - 00:54</span>
                          <span className="text-[var(--color-text-muted)]">Queued</span>
                        </div>
                        <p className="text-[var(--color-text-secondary)] italic truncate">
                          "Luminescent hydrothermal vents release superheated plumes..."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 1: Video Bible */}
              {activeStage === 1 && (
                <div className="space-y-4 text-left animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text)] font-serif">
                        Video Bible Entity Persistence Anchors
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Entities declared once and injected into every scene prompt for facial and apparel continuity.
                      </p>
                    </div>
                    <span className="pill-tag-mono bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      3 Anchors Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded border border-[var(--color-border-subtle)] bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
                          CHARACTER
                        </span>
                        <span className="text-[10px] meta-mono text-[var(--color-success)] font-bold">100% Seed Lock</span>
                      </div>
                      <h5 className="text-sm font-bold text-[var(--color-text)]">Dr. Elena Vance</h5>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-sans">
                        Astrobiologist, mid-30s, copper-red short hair, high-collared matte obsidian hazmat exosuit with amber telemetry visor HUD.
                      </p>
                      <div className="flex gap-1 pt-1 text-[10px] meta-mono text-[var(--color-text-muted)]">
                        <span>#obsidian_suit</span> • <span>#amber_visor</span>
                      </div>
                    </div>

                    <div className="p-4 rounded border border-[var(--color-border-subtle)] bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="pill-tag-mono bg-[#244855]/10 text-[#244855] font-bold">
                          LOCATION
                        </span>
                        <span className="text-[10px] meta-mono text-[var(--color-success)] font-bold">100% Seed Lock</span>
                      </div>
                      <h5 className="text-sm font-bold text-[var(--color-text)]">Abyssal Basalt Chasm</h5>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-sans">
                        Deep ocean basalt trench 10km beneath ice shelf, bioluminescent cyan vents, volcanic mineral smoke plumes, high water turbidity.
                      </p>
                      <div className="flex gap-1 pt-1 text-[10px] meta-mono text-[var(--color-text-muted)]">
                        <span>#cyan_vents</span> • <span>#basalt_trench</span>
                      </div>
                    </div>

                    <div className="p-4 rounded border border-[var(--color-border-subtle)] bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="pill-tag-mono bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] font-bold">
                          PROP
                        </span>
                        <span className="text-[10px] meta-mono text-[var(--color-success)] font-bold">100% Seed Lock</span>
                      </div>
                      <h5 className="text-sm font-bold text-[var(--color-text)]">Titan-IV Deep Submersible</h5>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-sans">
                        Dual-cockpit yellow-trimmed titanium hull with exterior robotic sampling arms and quad forward tungsten illumination searchlights.
                      </p>
                      <div className="flex gap-1 pt-1 text-[10px] meta-mono text-[var(--color-text-muted)]">
                        <span>#titanium_hull</span> • <span>#quad_lights</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2: AI Storyboard (Active Default) */}
              {activeStage === 2 && (
                <div className="space-y-4 text-left animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[var(--color-text)] font-serif">
                          Scene 04 Storyboard — 3 Parallel Artistic Variants
                        </h4>
                        <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                          SANA-Sprint 1.6B DiT
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Injected with Dr. Elena Vance + Basalt Chasm anchors. Select your preferred cut:
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" leftIcon={<RefreshCw size={12} />}>
                      Regenerate Variants
                    </Button>
                  </div>

                  {/* 3 Storyboard Branch Previews */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {[
                      {
                        key: 'A',
                        title: 'Cinematic Wide Establishing',
                        lens: '50mm Anamorphic • Deep Field',
                        desc: 'Wide perspective showing Titan-IV submersible searchlights piercing the abyss as Dr. Vance examines the trench.',
                        bg: 'linear-gradient(135deg, #182C34 0%, #244855 100%)',
                      },
                      {
                        key: 'B',
                        title: 'Telemetry Close-up Angle',
                        lens: '85mm Prime • Macro Amber Visor',
                        desc: "Close-up on Dr. Elena Vance's amber visor reflecting cyan hydrothermal plume smoke, eyes focused on telemetry readings.",
                        bg: 'linear-gradient(135deg, #244855 0%, #874F41 100%)',
                      },
                      {
                        key: 'C',
                        title: 'Environmental Isometric View',
                        lens: 'Top-Down Technical Cutaway',
                        desc: 'Technical perspective capturing the scale of the Europa basalt canyon with miniature submersible illumination.',
                        bg: 'linear-gradient(135deg, #17252C 0%, #1E313A 100%)',
                      },
                    ].map((b) => {
                      const isSelected = selectedBranch === b.key;
                      return (
                        <div
                          key={b.key}
                          onClick={() => setSelectedBranch(b.key)}
                          className={`p-3.5 rounded border flex flex-col justify-between cursor-pointer transition-all bg-white ${
                            isSelected
                              ? 'border-[#E64833] ring-1 ring-[#E64833] shadow-xs'
                              : 'border-[#244855]/15 hover:border-[#244855]/30'
                          }`}
                        >
                          <div>
                            {/* Visual Preview Area (Carries 60% of card) */}
                            <div
                              className="h-28 rounded mb-3 flex items-center justify-center relative overflow-hidden text-white"
                              style={{ background: b.bg }}
                            >
                              <Clapperboard size={26} className="opacity-35" />
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] meta-mono font-bold bg-black/60 backdrop-blur-xs">
                                BRANCH {b.key}
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] meta-mono font-bold bg-[#E64833] text-white flex items-center gap-1">
                                  <Check size={10} /> Active Cut
                                </div>
                              )}
                            </div>

                            <div className="text-xs font-bold text-[var(--color-text)] mb-0.5 font-sans">
                              {b.title}
                            </div>
                            <div className="text-[10px] meta-mono text-[var(--color-text-muted)] mb-1.5">
                              {b.lens}
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-sans">
                              {b.desc}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] meta-mono">
                            <span className="text-[var(--color-text-muted)]">Render: 0.82s</span>
                            <span
                              className={
                                isSelected
                                  ? 'text-[#E64833] font-bold'
                                  : 'text-[var(--color-text-muted)]'
                              }
                            >
                              {isSelected ? 'Selected for Timeline' : 'Click to select'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STAGE 3: Timeline Editor */}
              {activeStage === 3 && (
                <div className="space-y-4 text-left animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text)] font-serif">
                        Multi-Track Audio &amp; Visual Timeline Assembly
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Frame-accurate playhead scrub syncing video clips, narration audio, and background score.
                      </p>
                    </div>
                    <span className="pill-tag-mono bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      3 Synced Tracks
                    </span>
                  </div>

                  <TimelineShowcase />
                </div>
              )}

              {/* STAGE 4: 1080p Export */}
              {activeStage === 4 && (
                <div className="space-y-4 text-left animate-fade-in">
                  <ExportShowcase />
                </div>
              )}
            </ProductPreviewFrame>
          </div>
        </SiteContainer>
      </section>

      {/* ─── 3. INTENTIONAL METRICS BAND (Clean Strip, No Floating Cards) ─────────── */}
      <section className="py-8 bg-white border-y border-[#244855]/10">
        <SiteContainer>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-[#182C34] tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs text-[#244855]/70 font-sans font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ─── 4. ARCHITECTURAL PIPELINE (Flat Dataflow Diagram) ───────────────────── */}
      <section className="site-section">
        <SiteContainer>
          <SectionHeader
            eyebrow="Pipeline Architecture"
            title="Five automated stages. Zero manual splicing."
            description="ScenoraEdits coordinates voiceover audio parsing, Video Bible character anchoring, sub-second local DiT generation, and multi-track mastering into a unified sequential pipeline."
            className="mb-10 text-center"
          />

          {/* Level 3: Flat Architecture Diagram with Connectors */}
          <div className="mb-14">
            <PipelineDiagram />
          </div>

          {/* 4-Item Feature Grid with Visual Subtlety */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              {
                icon: <Sliders className="w-4 h-4 text-[#E64833]" />,
                title: 'Script-to-Scene Parsing',
                desc: 'Raw voiceover audio is sliced at speech pauses with millisecond cut timestamps.',
              },
              {
                icon: <ShieldCheck className="w-4 h-4 text-[#244855]" />,
                title: 'Video Bible Seed Lock',
                desc: 'Persistent character descriptors and styles guarantee 100% cross-scene continuity.',
              },
              {
                icon: <Timer className="w-4 h-4 text-[#874F41]" />,
                title: 'SANA-Sprint 1.6B DiT',
                desc: '0.82s sub-second inference running directly on local consumer GPU memory budgets.',
              },
              {
                icon: <Clapperboard className="w-4 h-4 text-emerald-600" />,
                title: 'FFmpeg Multi-Master',
                desc: 'Automated 16:9, 9:16, and 1:1 video render with auto audio ducking and subtitles.',
              },
            ].map((f, idx) => (
              <div
                key={idx}
                className="p-4 rounded border border-[#244855]/15 bg-white space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded bg-[#F8F4ED] border border-[#244855]/15 flex items-center justify-center mb-3">
                    {f.icon}
                  </div>
                  <h4 className="text-xs font-bold text-[#182C34] font-serif">{f.title}</h4>
                  <p className="text-xs text-[#244855]/70 font-sans mt-1 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[#244855]/50 pt-2 border-t border-[#244855]/10">
                  STAGE 0{idx + 1} AUTOMATED
                </div>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ─── 5. VIDEO BIBLE PERSISTENCE SHOWCASE (45/55 Split) ──────────────────── */}
      <section className="site-section bg-white border-y border-[#244855]/10">
        <SiteContainer>
          <SectionHeader
            eyebrow="Entity Persistence"
            title="Filmmaking-grade continuity without re-prompting."
            description="Never struggle with characters morphing faces between scene cuts. The Video Bible locks identity, apparel, and lighting across your entire production."
            className="mb-10 text-center"
          />

          <VideoBibleShowcase />
        </SiteContainer>
      </section>

      {/* ─── 6. MULTI-TRACK TIMELINE AUTOMATION SHOWCASE ─────────────────────────── */}
      <section className="site-section">
        <SiteContainer>
          <SectionHeader
            eyebrow="Timeline Assembly"
            title="Multi-track timeline with automatic audio ducking."
            description="Frame-accurate playhead scrub coordinates visual cuts with spoken narration and background ambience. Spoken voiceover triggers instant -14dB background track ducking."
            className="mb-10 text-center"
          />

          <TimelineShowcase />
        </SiteContainer>
      </section>

      {/* ─── 7. LEVEL 7: LOCAL GPU TECHNICAL TELEMETRY PANEL ─────────────────────── */}
      <section className="site-section bg-[#111B20] text-white">
        <SiteContainer>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#1b323c] text-[#8BA4AE] border border-[#244855] mb-3">
              <Sparkles size={12} className="text-[#E64833]" />
              HARDWARE ACCELERATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Sub-second inference right on your local workstation.
            </h2>
            <p className="text-xs sm:text-sm text-[#8BA4AE] font-sans mt-2 leading-relaxed">
              No cloud subscription meters. No queuing delays. Run 100+ scene batches on 4GB VRAM using optimized SANA-Sprint diffusion.
            </p>
          </div>

          <GpuTechnicalPanel />
        </SiteContainer>
      </section>

      {/* ─── 8. MULTI-ASPECT 1080P EXPORT COMPOSER ───────────────────────────────── */}
      <section className="site-section">
        <SiteContainer>
          <SectionHeader
            eyebrow="Multi-Platform Mastering"
            title="One production project. Every target platform."
            description="Produce 16:9 widescreen masters for YouTube, 9:16 vertical reels for TikTok and Shorts, and 1:1 feeds with burned-in kinetic typography in a single render run."
            className="mb-10 text-center"
          />

          <ExportShowcase />
        </SiteContainer>
      </section>

      {/* ─── 9. CREATOR TESTIMONIALS (Restrained & Purposeful) ──────────────────── */}
      <section className="site-section bg-white border-y border-[#244855]/10">
        <SiteContainer>
          <SectionHeader
            eyebrow="Creator Spotlight"
            title="Trusted by high-velocity video creators"
            description="From solo YouTube documentary producers to high-velocity social studios:"
            className="mb-8 text-center"
          />

          {/* Genre Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { id: 'all', label: 'All Creators' },
              { id: 'documentary', label: 'Documentaries' },
              { id: 'tech', label: 'Tech Explainers' },
              { id: 'shorts', label: 'Shorts & Reels' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveTestimonialGenre(g.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  activeTestimonialGenre === g.id
                    ? 'bg-[#E64833] text-white font-bold'
                    : 'bg-[#F8F4ED] text-[#244855] hover:text-[#182C34] border border-[#244855]/15'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredTestimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded border border-[#244855]/15 bg-[#FAF8F5] flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, r) => (
                      <Star key={r} size={12} fill="#E64833" color="#E64833" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#182C34] leading-relaxed italic font-serif">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#244855]/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#182C34] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#182C34]">{t.author}</div>
                    <div className="text-[11px] text-[#244855]/70 font-mono">
                      {t.role} • {t.subscribers}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ─── 10. STUDIO CTA (Calm Dark Navy Container with Controlled Coral) ─────── */}
      <section className="site-section-compact pb-20">
        <SiteContainer>
          <div className="rounded-xl p-10 sm:p-14 bg-[#182C34] text-white text-center flex flex-col items-center gap-5 relative overflow-hidden shadow-lg">
            {/* Subtle glow */}
            <div className="absolute top-0 right-1/4 w-80 h-36 bg-[#E64833]/15 blur-3xl pointer-events-none rounded-full" />

            <span className="pill-tag-mono border border-white/20 text-white/90">
              LOCAL AI VIDEO PRODUCTION STUDIO
            </span>

            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white tracking-tight max-w-xl">
              Ready to produce your next video project?
            </h2>

            <p className="text-xs sm:text-sm text-[#8BA4AE] max-w-md leading-relaxed font-sans">
              Import your audio, anchor your characters in the Video Bible, and render a Full HD master entirely free on your local GPU.
            </p>

            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button
                size="md"
                variant="primary"
                rightIcon={<ArrowRight size={15} />}
                onClick={() => navigate('/app')}
                className="font-bold px-6 shadow-xs bg-[#E64833] hover:bg-[#d03d29] text-white"
              >
                Launch ScenoraEdits Studio
              </Button>
              <Button
                size="md"
                variant="ghost"
                onClick={() => navigate('/how-it-works')}
                className="text-white border-white/30 hover:bg-white/10"
              >
                Explore Full Pipeline
              </Button>
            </div>

            <p className="text-[11px] text-[#8BA4AE] font-mono">
              Zero cloud API subscriptions. Runs locally on consumer RTX GPUs.
            </p>
          </div>
        </SiteContainer>
      </section>
    </div>
  );
};
