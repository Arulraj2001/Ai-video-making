import React, { useState } from 'react';
import { useRouter } from '../../router/Router';
import { useSEO, PAGE_SEO } from '../../utils/seo';
import { Button } from '../../components/ui/Button';
import { SiteContainer } from '../../components/public/SiteContainer';
import { SectionHeader } from '../../components/public/SectionHeader';
import { WorkflowDashboard } from '../../components/public/WorkflowDashboard';
import { ComparisonSection } from '../../components/public/ComparisonSection';
import {
  FileAudio,
  BookOpen,
  Image as ImageIcon,
  Film,
  Download,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Layers,
  HardDrive,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { navigate } = useRouter();
  useSEO(PAGE_SEO.howItWorks);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stages = [
    {
      num: '01',
      title: 'Script Ingestion & Subtitle Audio Slicing',
      time: '< 2 min',
      icon: <FileAudio className="w-4 h-4" />,
      tagline: 'Millisecond-accurate boundary clustering',
      description:
        'Import narration audio (MP3, WAV, M4A) along with subtitle transcripts (SRT, VTT, or plain text). ScenoraEdits parses word-level audio timestamps and clusters speech into logical scene cut slots automatically.',
      input: 'master_narration.wav + captions.srt',
      engine: 'FFmpeg waveform analyzer & speech pause detection algorithm',
      output: 'Timestamped scene boundaries ready for visual assignment',
      technicalDetail:
        'Analyzes RMS audio energy to identify natural rhetorical pauses (>350ms), preventing scene cuts from slicing spoken words.',
    },
    {
      num: '02',
      title: 'Video Bible Entity & Wardrobe Registration',
      time: '< 5 min',
      icon: <BookOpen className="w-4 h-4" />,
      tagline: 'Deterministic character facial persistence',
      description:
        'Declare your cast of characters, signature outfits, recurring locations, and hero props once. These entities become immutable visual anchors automatically injected into every downstream scene prompt.',
      input: 'Character attributes (hair, age, eyes) + apparel + set tokens',
      engine: 'Deterministic JSON entity schema & weighted token embedding injector',
      output: 'Global Video Bible manifest locked across all 100+ scenes',
      technicalDetail:
        'Extracts and enforces positive seed anchors so facial features, jewelry, and uniforms do not drift across cuts.',
    },
    {
      num: '03',
      title: 'Parallel Neural Storyboarding (3 Artistic Branches)',
      time: '0.82s / scene',
      icon: <ImageIcon className="w-4 h-4" />,
      tagline: 'Sub-second local diffusion without cloud queues',
      description:
        'For every scene slot, the prompt engine composes three distinct artistic perspectives: Cinematic Wide, Macro Visor Close-up, and Environmental Cutaway. Pick your favorite cut with one click.',
      input: 'Augmented scene prompt with Video Bible injected tokens',
      engine: 'Local SANA-Sprint 1.6B DiT (4-step distilled) on RTX GPU',
      output: '3 parallel high-fidelity candidates per scene slot',
      technicalDetail:
        'Runs directly in consumer VRAM (under 4GB). Switch between variants instantly without invalidating audio synchronization.',
    },
    {
      num: '04',
      title: 'Multi-Track Timeline Assembly & Audio Ducking',
      time: 'Real-time',
      icon: <Film className="w-4 h-4" />,
      tagline: 'Frame-accurate non-linear orchestration',
      description:
        'Selected storyboard visuals populate the visual track. The audio subsystem aligns voiceover narration, adds ambient sound effects, and automatically ducks background music by -14dB during voice passages.',
      input: 'Visual cut selections + narration track + ambient BGM stems',
      engine: 'HTML5 Web Audio API & sidechain ducking filtergraph simulator',
      output: 'Interactive playable multi-track project timeline',
      technicalDetail:
        'Scrub the playhead anywhere in the project with frame-level accuracy. Edit clip boundaries with keyboard shortcuts.',
    },
    {
      num: '05',
      title: '1080p Master Rendering & Multi-Platform Export',
      time: '~30 seconds',
      icon: <Download className="w-4 h-4" />,
      tagline: 'FFmpeg NVENC broadcast-ready mastering',
      description:
        'Compile your completed project into pristine 1080p Full HD MP4. Choose 16:9 for YouTube, 9:16 vertical for Shorts and TikTok, or 1:1 for social feeds with burned-in kinetic typography.',
      input: 'Multi-track project package & aspect ratio preference',
      engine: 'FFmpeg NVENC hardware-accelerated H.264 / HEVC video encoder',
      output: 'Finished, production-ready 1080p MP4 master video',
      technicalDetail:
        'Exports at Constant Bitrate (CBR 24Mbps) or visually lossless CRF 18 with 320kbps 48kHz stereo master audio.',
    },
  ];

  const faqs = [
    {
      q: 'Can I run ScenoraEdits completely offline without internet?',
      a: 'Yes. The core diffusion engine runs SANA-Sprint 1.6B directly on your local GPU (NVIDIA RTX 3060/4060 or Apple Silicon M-series via PyTorch/MPS). Video assembly and rendering are handled locally by FFmpeg. Zero prompt data or video frames leave your workstation.',
    },
    {
      q: 'How does the Video Bible ensure characters do not change faces?',
      a: 'Traditional AI generation creates each image in a vacuum. ScenoraEdits utilizes an entity persistence registry that injects weighted biometric descriptors, wardrobe constraints, and lighting tokens into every scene prompt, locking facial geometry and clothing colors across consecutive cuts.',
    },
    {
      q: 'What are the minimum hardware requirements?',
      a: 'Any modern PC or Mac with at least 4GB of VRAM (e.g., RTX 3050/3060/4060, or Apple M1/M2/M3 with 16GB unified memory). If you do not have a dedicated GPU, ScenoraEdits includes seamless cloud failover to Cloudflare Workers AI.',
    },
    {
      q: 'Do I own the commercial rights to the rendered videos?',
      a: 'Yes, 100%. Everything generated on your local workstation is yours to monetize on YouTube, TikTok, client productions, or commercial broadcast without royalty obligations.',
    },
  ];

  return (
    <div className="space-y-0">
      {/* ─── 1. HERO HEADER ─────────────────────────────────────────────────────────── */}
      <section className="site-section-compact border-b border-[#244855]/10 bg-white">
        <SiteContainer>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F8F4ED] border border-[#244855]/15 text-[#244855] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#E64833]" />
                <span className="font-mono uppercase text-[11px] font-bold">
                  PRODUCTION METHODOLOGY
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#182C34] tracking-tight">
                How ScenoraEdits turns scripts into finished video.
              </h1>
              <p className="prose-hero text-sm sm:text-base text-[#244855]/80 mt-3 leading-relaxed">
                From raw audio narration to an exported 1080p master in under 30 minutes. Five automated stages engineered to eliminate character drift, manual timeline slicing, and cloud API bills.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight size={14} />}
                onClick={() => navigate('/app')}
                className="font-bold shadow-xs bg-[#E64833] hover:bg-[#d03d29] text-white"
              >
                Launch Studio
              </Button>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── 2. FIVE-STAGE VERTICAL TIMELINE ARCHITECTURE ───────────────────────────── */}
      <section className="site-section bg-[#F8F4ED]/50">
        <SiteContainer>
          <SectionHeader
            eyebrow="Sequential Architecture"
            title="The 5-Stage Automated Production Pipeline"
            description="Inspect the input assets, engine execution, and deliverables at every stage of the production chain."
            className="mb-12 text-center"
          />

          {/* Stage Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
            {stages.map((st, i) => {
              const isActive = activeStage === i;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => setActiveStage(i)}
                  className={`p-3 rounded border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white border-[#E64833] ring-1 ring-[#E64833] shadow-xs'
                      : 'bg-white/60 border-[#244855]/15 hover:border-[#244855]/30 text-[#244855]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#244855]/60 mb-1">
                    <span>STAGE {st.num}</span>
                    <span className="text-[#E64833]">{st.time}</span>
                  </div>
                  <div
                    className={`text-xs font-bold truncate font-serif ${
                      isActive ? 'text-[#182C34]' : 'text-[#244855]/80'
                    }`}
                  >
                    {st.title.split('&')[0]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Featured Stage Showcase */}
          <div className="bg-white border border-[#244855]/15 rounded-lg overflow-hidden shadow-xs">
            {/* Top Stage Metadata Bar */}
            <div className="p-6 sm:p-8 border-b border-[#244855]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded bg-[#182C34] text-white flex items-center justify-center shrink-0">
                  {stages[activeStage].icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase text-[#E64833]">
                      STAGE {stages[activeStage].num} // LATENCY: {stages[activeStage].time}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs font-mono text-[#244855]/70">
                      {stages[activeStage].tagline}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#182C34] mt-0.5">
                    {stages[activeStage].title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="px-3 py-1 rounded bg-[#F8F4ED] border border-[#244855]/15 text-xs font-mono text-[#182C34]">
                  AUTOMATED PIPELINE
                </span>
              </div>
            </div>

            {/* Stage Body Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-sm text-[#244855]/85 font-sans leading-relaxed max-w-3xl">
                {stages[activeStage].description}
              </p>

              {/* Technical Input -> Engine -> Output Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 rounded border border-[#244855]/15 bg-[#FAF8F5] space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-[#244855]/60 uppercase font-bold">
                    <Layers className="w-3.5 h-3.5 text-[#244855]" />
                    <span>Input Assets</span>
                  </div>
                  <p className="text-[#182C34] font-sans text-xs font-medium">
                    {stages[activeStage].input}
                  </p>
                </div>

                <div className="p-4 rounded border border-[#E64833]/30 bg-[#E64833]/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-[#E64833] uppercase font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#E64833]" />
                    <span>Engine Subsystem</span>
                  </div>
                  <p className="text-[#182C34] font-sans text-xs font-medium">
                    {stages[activeStage].engine}
                  </p>
                </div>

                <div className="p-4 rounded border border-emerald-500/30 bg-emerald-50/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-emerald-800 uppercase font-bold">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Output Deliverable</span>
                  </div>
                  <p className="text-[#182C34] font-sans text-xs font-medium">
                    {stages[activeStage].output}
                  </p>
                </div>
              </div>

              {/* Engineering Note Callout */}
              <div className="p-4 rounded bg-[#182C34] text-white flex items-start gap-3">
                <div className="text-xs font-mono bg-[#244855] text-[#8BA4AE] px-2 py-0.5 rounded shrink-0 mt-0.5">
                  TECH NOTE
                </div>
                <p className="text-xs text-[#8BA4AE] font-sans leading-relaxed">
                  {stages[activeStage].technicalDetail}
                </p>
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── 3. INTERACTIVE PIPELINE SIMULATION DASHBOARD ─────────────────────────── */}
      <section className="site-section bg-white border-y border-[#244855]/10">
        <SiteContainer>
          <SectionHeader
            eyebrow="Workflow Simulation"
            title="Interactive Production Performance Estimator"
            description="Select a video format below to simulate scene volumes, rendering latencies, and local GPU cost savings in real time."
            className="mb-10 text-center"
          />

          <WorkflowDashboard />
        </SiteContainer>
      </section>

      {/* ─── 4. EDITORIAL COMPARATIVE MATRIX (Traditional AI vs ScenoraEdits) ───────── */}
      <section className="site-section bg-[#F8F4ED]/50">
        <SiteContainer>
          <SectionHeader
            eyebrow="Production Velocity Benchmark"
            title="The Fragmented Toolchain vs. Unified Neural Studio"
            description="Why modern video creators are abandoning multi-app copy-pasting for an integrated local pipeline."
            className="mb-10 text-center"
          />

          <ComparisonSection />
        </SiteContainer>
      </section>

      {/* ─── 5. FREQUENTLY ASKED QUESTIONS (Clean Editorial Accordion) ─────────────── */}
      <section className="site-section bg-white border-t border-[#244855]/10">
        <SiteContainer>
          <SectionHeader
            eyebrow="Engineering FAQ"
            title="Frequently asked architecture questions"
            description="Details regarding local compute, video rights, and persistent diffusion algorithms."
            className="mb-10 text-center"
          />

          <div className="max-w-3xl mx-auto divide-y divide-[#244855]/15 border border-[#244855]/15 rounded-lg overflow-hidden bg-[#FAF8F5]">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-[#F8F4ED]/40 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-serif font-bold text-[#182C34]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#244855]/70 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#E64833]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#244855]/80 font-sans leading-relaxed border-t border-[#244855]/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SiteContainer>
      </section>

      {/* ─── 6. STUDIO CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="site-section-compact pb-20 bg-[#F8F4ED]/50">
        <SiteContainer>
          <div className="rounded-xl p-10 sm:p-14 bg-[#182C34] text-white text-center flex flex-col items-center gap-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-1/4 w-80 h-36 bg-[#E64833]/15 blur-3xl pointer-events-none rounded-full" />

            <span className="pill-tag-mono border border-white/20 text-white/90">
              LOCAL PRODUCTION PIPELINE
            </span>

            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white tracking-tight max-w-xl">
              Turn your voiceover script into video today.
            </h2>

            <p className="text-xs sm:text-sm text-[#8BA4AE] max-w-md leading-relaxed font-sans">
              Test your first project in ScenoraEdits Studio with automatic character consistency and local sub-second generation.
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
            </div>
          </div>
        </SiteContainer>
      </section>
    </div>
  );
};
