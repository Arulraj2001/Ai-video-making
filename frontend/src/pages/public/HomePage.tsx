import React, { useState } from 'react';
import { useRouter } from '../../router/Router';
import { useSEO, PAGE_SEO } from '../../utils/seo';
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
  Layers,
  Cpu,
  Zap,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  useSEO(PAGE_SEO.home);

  // Interactive Product Preview State
  const [activeStage, setActiveStage] = useState<number>(2); // 0: Audio, 1: Bible, 2: Storyboard, 3: Timeline, 4: Export
  const [selectedBranch, setSelectedBranch] = useState<string>('B');
  const [activeTestimonialGenre, setActiveTestimonialGenre] = useState<string>('all');

  const stats = [
    {
      value: '2,400+',
      label: 'Active creators worldwide',
      sub: 'Solo YouTubers & Studios',
      icon: <Users size={18} />,
    },
    {
      value: '1.2M+',
      label: 'Scenes generated & cut',
      sub: 'Zero frame dropouts',
      icon: <Clapperboard size={18} />,
    },
    {
      value: '0.82s',
      label: 'Sub-second frame latency',
      sub: 'SANA-Sprint 1.6B DiT',
      icon: <Timer size={18} />,
    },
    {
      value: '$0.00',
      label: 'Cloud subscription cost',
      sub: '100% Free Local RTX GPU',
      icon: <ShieldCheck size={18} />,
    },
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
        'We export both 16:9 for YouTube and 9:16 for Reels from the same project file with burned-in kinetic subtitles. It eliminated our manual Premiere Pro slicing overhead completely.',
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
    <div className="space-y-0 relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="glow-orb glow-orb-crimson w-[520px] h-[520px] -top-32 -left-40 opacity-40" />
      <div className="glow-orb glow-orb-petrol w-[600px] h-[600px] top-60 -right-48 opacity-30" />
      <div className="glow-orb glow-orb-rust w-[450px] h-[450px] top-[1800px] -left-32 opacity-25" />

      {/* ─── 1. HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="site-section-hero relative z-10">
        <SiteContainer className="flex flex-col items-center text-center">
          {/* Eyebrow / Product Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] pulse-indicator" />
            <span className="meta-mono uppercase text-[var(--color-text-secondary)] text-[11px]">
              AI Video Pipeline Engine
            </span>
            <span className="text-[var(--color-border-strong)]">•</span>
            <span className="text-[var(--color-primary)] font-bold text-xs">v2.4 Production Active</span>
          </div>

          {/* Main Headline with Gradient Accent */}
          <h1 className="hero-headline mb-6 text-balance">
            Turn voiceover scripts into <span className="text-gradient-coral">finished video</span>.
          </h1>

          {/* Supporting Paragraph */}
          <p className="prose-hero text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8">
            ScenoraEdits orchestrates voiceover audio, Video Bible character continuity, SANA-Sprint local GPU diffusion, and multi-track FFmpeg assembly in a single production workflow.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8">
            <Button
              size="lg"
              variant="primary"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => navigate('/app')}
              className="px-8 py-3 font-bold shadow-md hover:shadow-lg transition-all"
            >
              Launch ScenoraEdits Studio
            </Button>
            <Button
              size="lg"
              variant="secondary"
              leftIcon={<Play size={15} />}
              onClick={() => navigate('/how-it-works')}
              className="px-7 py-3 font-semibold"
            >
              Explore 5-Stage Pipeline
            </Button>
          </div>

          {/* Trust & Guarantee Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-[var(--color-text-secondary)] font-medium mb-14">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[var(--color-success)] shrink-0" />
              <span>Zero API keys required</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[var(--color-success)] shrink-0" />
              <span>100% Free local RTX GPU</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[var(--color-success)] shrink-0" />
              <span>Full HD 1080p MP4 master</span>
            </span>
          </div>

          {/* ─── 2. PRODUCT UI SHOWCASE (Realistic Creative Software Window) ─────── */}
          <div className="w-full relative z-10">
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text)] font-serif">
                        Audio Track Ingestion &amp; Caption Slicing
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Voiceover audio automatically mapped to 11 scene slots with millisecond cut precision.
                      </p>
                    </div>
                    <span className="pill-tag-mono bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] self-start sm:self-auto">
                      narration_europa.wav
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs meta-mono text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1.5 text-[var(--color-primary)] font-bold">
                        <Volume2 size={14} /> 44.1kHz • 24-bit Stereo
                      </span>
                      <span>Total Duration: 04:12</span>
                    </div>

                    {/* Waveform Slices */}
                    <div className="h-14 flex items-center gap-1 px-3 bg-[var(--color-surface-sunken)]/60 rounded-lg overflow-hidden">
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
                              opacity: isCurrent ? 1 : 0.4,
                            }}
                          />
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                      <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] text-xs">
                        <div className="flex justify-between text-[10px] meta-mono text-[var(--color-text-muted)] mb-1">
                          <span>SCENE 01 // 00:00 - 00:18</span>
                          <span className="text-[var(--color-success)] font-semibold">Locked</span>
                        </div>
                        <p className="text-[var(--color-text-secondary)] italic truncate">
                          "Three kilometers beneath Europa's frozen crust..."
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-xs">
                        <div className="flex justify-between text-[10px] meta-mono text-[var(--color-primary)] font-bold mb-1">
                          <span>SCENE 02 // 00:18 - 00:36 (ACTIVE)</span>
                          <span>In Focus</span>
                        </div>
                        <p className="text-[var(--color-text)] font-semibold truncate">
                          "Dr. Elena Vance adjusts her telemetry visor..."
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] text-xs">
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text)] font-serif">
                        Video Bible Entity Persistence Anchors
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Entities declared once and injected into every scene prompt for facial and apparel continuity.
                      </p>
                    </div>
                    <span className="pill-tag-mono bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] self-start sm:self-auto">
                      3 Anchors Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
                          CHARACTER
                        </span>
                        <span className="text-[10px] meta-mono text-[var(--color-success)] font-bold">100% Seed Lock</span>
                      </div>
                      <h5 className="text-sm font-bold text-[var(--color-text)] font-display">Dr. Elena Vance</h5>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-sans">
                        Astrobiologist, mid-30s, copper-red short hair, high-collared matte obsidian hazmat exosuit with amber telemetry visor HUD.
                      </p>
                      <div className="flex gap-1.5 pt-1 text-[10px] meta-mono text-[var(--color-text-muted)]">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-sunken)]">#obsidian_suit</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-sunken)]">#amber_visor</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="pill-tag-mono bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] font-bold">
                          LOCATION
                        </span>
                        <span className="text-[10px] meta-mono text-[var(--color-success)] font-bold">100% Seed Lock</span>
                      </div>
                      <h5 className="text-sm font-bold text-[var(--color-text)] font-display">Abyssal Basalt Chasm</h5>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-sans">
                        Deep ocean basalt trench 10km beneath ice shelf, bioluminescent cyan vents, volcanic mineral smoke plumes, high water turbidity.
                      </p>
                      <div className="flex gap-1.5 pt-1 text-[10px] meta-mono text-[var(--color-text-muted)]">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-sunken)]">#cyan_vents</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-sunken)]">#basalt_trench</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="pill-tag-mono bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] font-bold">
                          PROP / VEHICLE
                        </span>
                        <span className="text-[10px] meta-mono text-[var(--color-success)] font-bold">100% Seed Lock</span>
                      </div>
                      <h5 className="text-sm font-bold text-[var(--color-text)] font-display">Titan-IV Deep Submersible</h5>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-sans">
                        Dual-cockpit yellow-trimmed titanium hull with exterior robotic sampling arms and quad forward tungsten illumination searchlights.
                      </p>
                      <div className="flex gap-1.5 pt-1 text-[10px] meta-mono text-[var(--color-text-muted)]">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-sunken)]">#titanium_hull</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-sunken)]">#quad_lights</span>
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
                        <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
                          SANA-Sprint 1.6B DiT
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Injected with Dr. Elena Vance + Basalt Chasm anchors. Select your preferred cut:
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" leftIcon={<RefreshCw size={12} />} className="self-start sm:self-auto">
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
                          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all bg-[var(--color-surface)] ${
                            isSelected
                              ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25 shadow-md -translate-y-0.5'
                              : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)] shadow-xs hover:-translate-y-0.5'
                          }`}
                        >
                          <div>
                            {/* Visual Preview Area */}
                            <div
                              className="h-28 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden text-white shadow-inner"
                              style={{ background: b.bg }}
                            >
                              <Clapperboard size={26} className="opacity-35" />
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] meta-mono font-bold bg-black/60 backdrop-blur-xs">
                                BRANCH {b.key}
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] meta-mono font-bold bg-[var(--color-primary)] text-white flex items-center gap-1">
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
                                  ? 'text-[var(--color-primary)] font-bold'
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

      {/* ─── 2. FLOATING GLASS STATS GRID (Seamless Bridge) ────────────────────── */}
      <section className="relative z-20 -mt-6 sm:-mt-10 mb-12">
        <SiteContainer>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {stats.map((s, i) => (
              <div
                key={i}
                className="glass-stat-card p-5 sm:p-6 flex flex-col justify-between gap-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                    {s.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--color-success)] bg-[var(--color-success-subtle)] px-2 py-0.5 rounded-full border border-[var(--color-success)]/20">
                    VERIFIED
                  </span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-text)] tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-xs font-semibold text-[var(--color-text)] mt-1">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ─── 3. ARCHITECTURAL PIPELINE (Flat Dataflow Diagram) ───────────────────── */}
      <section className="site-section relative z-10">
        <SiteContainer>
          <SectionHeader
            eyebrow="Pipeline Architecture"
            eyebrowIcon={<Zap size={13} />}
            title="Five automated stages. Zero manual splicing."
            description="ScenoraEdits coordinates voiceover audio parsing, Video Bible character anchoring, sub-second local DiT generation, and multi-track mastering into a unified sequential pipeline."
            className="mb-12 text-center"
          />

          {/* Sequential Pipeline Diagram */}
          <div className="mb-12">
            <PipelineDiagram />
          </div>

          {/* 4-Item Feature Grid with Visual Elevation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Sliders className="w-5 h-5 text-[var(--color-primary)]" />,
                title: 'Script-to-Scene Parsing',
                desc: 'Raw voiceover audio is sliced at speech pauses with millisecond cut timestamps.',
                tag: 'STAGE 01',
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-[var(--scenora-petrol)]" />,
                title: 'Video Bible Seed Lock',
                desc: 'Persistent character descriptors and styles guarantee 100% cross-scene continuity.',
                tag: 'STAGE 02',
              },
              {
                icon: <Timer className="w-5 h-5 text-[var(--scenora-rust)]" />,
                title: 'SANA-Sprint 1.6B DiT',
                desc: '0.82s sub-second inference running directly on local consumer GPU memory budgets.',
                tag: 'STAGE 03',
              },
              {
                icon: <Clapperboard className="w-5 h-5 text-emerald-600" />,
                title: 'FFmpeg Multi-Master',
                desc: 'Automated 16:9, 9:16, and 1:1 video render with auto audio ducking and subtitles.',
                tag: 'STAGE 04',
              },
            ].map((f, idx) => (
              <div
                key={idx}
                className="card-feature p-5 sm:p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-4 flex flex-col justify-between hover:border-[var(--color-primary)]/40 transition-all shadow-xs"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] flex items-center justify-center mb-3">
                    {f.icon}
                  </div>
                  <h4 className="text-sm font-bold text-[var(--color-text)] font-display">{f.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] font-sans mt-1.5 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[var(--color-text-muted)] pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <span>{f.tag}</span>
                  <span className="text-[var(--color-success)] font-semibold">AUTOMATED</span>
                </div>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ─── 4. VIDEO BIBLE PERSISTENCE SHOWCASE ─────────────────────────────────── */}
      <section className="site-section relative z-10">
        <SiteContainer>
          <SectionHeader
            eyebrow="Entity Persistence"
            eyebrowIcon={<Layers size={13} />}
            title="Filmmaking-grade continuity without re-prompting."
            description="Never struggle with characters morphing faces between scene cuts. The Video Bible locks identity, apparel, and lighting across your entire production."
            className="mb-12 text-center"
          />

          <VideoBibleShowcase />
        </SiteContainer>
      </section>

      {/* ─── 5. MULTI-TRACK TIMELINE AUTOMATION SHOWCASE ─────────────────────────── */}
      <section className="site-section relative z-10">
        <SiteContainer>
          <SectionHeader
            eyebrow="Timeline Assembly"
            eyebrowIcon={<Sliders size={13} />}
            title="Multi-track timeline with automatic audio ducking."
            description="Frame-accurate playhead scrub coordinates visual cuts with spoken narration and background ambience. Spoken voiceover triggers instant -14dB background track ducking."
            className="mb-12 text-center"
          />

          <TimelineShowcase />
        </SiteContainer>
      </section>

      {/* ─── 6. LOCAL GPU TECHNICAL TELEMETRY PANEL ─────────────────────────────── */}
      <section className="site-section relative z-10">
        <SiteContainer>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] mb-3 shadow-xs">
              <Cpu size={13} className="text-[var(--color-primary)]" />
              <span>HARDWARE ACCELERATION</span>
            </span>
            <h2 className="section-headline text-balance">
              Sub-second inference right on your local workstation.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-sans mt-2.5 leading-relaxed">
              No cloud subscription meters. No queuing delays. Run 100+ scene batches on 4GB VRAM using optimized SANA-Sprint diffusion.
            </p>
          </div>

          <GpuTechnicalPanel />
        </SiteContainer>
      </section>

      {/* ─── 7. MULTI-ASPECT 1080P EXPORT COMPOSER ───────────────────────────────── */}
      <section className="site-section relative z-10">
        <SiteContainer>
          <SectionHeader
            eyebrow="Multi-Platform Mastering"
            eyebrowIcon={<Clapperboard size={13} />}
            title="One production project. Every target platform."
            description="Produce 16:9 widescreen masters for YouTube, 9:16 vertical reels for TikTok and Shorts, and 1:1 feeds with burned-in kinetic typography in a single render run."
            className="mb-12 text-center"
          />

          <ExportShowcase />
        </SiteContainer>
      </section>

      {/* ─── 8. CREATOR TESTIMONIALS (Restrained & Purposeful) ──────────────────── */}
      <section className="site-section relative z-10">
        <SiteContainer>
          <SectionHeader
            eyebrow="Creator Spotlight"
            eyebrowIcon={<Users size={13} />}
            title="Trusted by high-velocity video creators"
            description="From solo YouTube documentary producers to high-velocity social studios:"
            className="mb-8 text-center"
          />

          {/* Genre Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              { id: 'all', label: 'All Creators' },
              { id: 'documentary', label: 'Documentaries' },
              { id: 'tech', label: 'Tech Explainers' },
              { id: 'shorts', label: 'Shorts & Reels' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveTestimonialGenre(g.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTestimonialGenre === g.id
                    ? 'bg-[var(--color-primary)] text-white font-bold shadow-xs'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border-subtle)]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTestimonials.map((t, idx) => (
              <div
                key={idx}
                className="card-feature p-6 sm:p-7 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex flex-col justify-between gap-5 shadow-xs hover:border-[var(--color-primary)]/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, r) => (
                      <Star key={r} size={14} fill="#E64833" color="#E64833" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--color-text)] leading-relaxed italic font-serif">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-xs font-bold flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--color-text)]">{t.author}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)] font-mono">
                      {t.role} • {t.subscribers}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ─── 9. STUDIO CTA FINALE (Radiant Deep Container) ───────────────────────── */}
      <section className="site-section-compact pb-24 relative z-10">
        <SiteContainer>
          <div className="rounded-3xl p-10 sm:p-16 bg-gradient-to-br from-[#131F24] via-[#182C34] to-[#244855] text-white text-center flex flex-col items-center gap-6 relative overflow-hidden shadow-xl border border-[#244855]">
            {/* Ambient Coral Flare */}
            <div className="absolute top-0 right-1/4 w-96 h-44 bg-[#E64833]/20 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-1/4 w-80 h-36 bg-[#90AEAD]/15 blur-3xl pointer-events-none rounded-full" />

            <span className="pill-tag-mono border border-white/20 text-white/90 bg-white/5 backdrop-blur-xs">
              LOCAL AI VIDEO PRODUCTION STUDIO
            </span>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-serif text-white tracking-tight max-w-2xl text-balance">
              Ready to produce your next video project?
            </h2>

            <p className="text-xs sm:text-sm text-[#D4E1DE] max-w-lg leading-relaxed font-sans">
              Import your voiceover audio, anchor your characters in the Video Bible, and render a Full HD 1080p master entirely free on your local GPU.
            </p>

            <div className="flex flex-wrap gap-3.5 justify-center pt-2">
              <Button
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate('/app')}
                className="font-bold px-8 py-3 shadow-md bg-[#E64833] hover:bg-[#d03d29] text-white cursor-pointer"
              >
                Launch ScenoraEdits Studio
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate('/how-it-works')}
                className="text-white border-white/30 hover:bg-white/10 px-6 py-3 cursor-pointer"
              >
                Explore Full Pipeline
              </Button>
            </div>

            <p className="text-[11px] text-[#8BA4AE] font-mono">
              Zero cloud API subscriptions • Runs locally on consumer RTX GPUs • Open Source
            </p>
          </div>
        </SiteContainer>
      </section>
    </div>
  );
};
