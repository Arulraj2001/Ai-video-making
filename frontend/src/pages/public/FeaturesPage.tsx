import React, { useState } from "react";
import { useRouter } from "../../router/Router";
import { useSEO } from "../../utils/seo";
import "./FeaturesPage.css";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Cpu,
  ChevronDown,
  ChevronUp,
  Film,
  Sliders,
  Play,
  Key,
  Download,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export const FeaturesPage: React.FC = () => {
  const { navigate } = useRouter();

  useSEO({
    title: "Features — ScenoraEdits Scene-Based Video Composer & Timeline Studio",
    description:
      "Explore ScenoraEdits core capabilities: scene-level image assignment, BYOK AI image keys (OpenAI, Flux, Gemini), Video Bible character persistence, Ken Burns motion, and zero-drift 1080p rendering.",
    canonical: "https://scenoraedits.web.app/features",
    ogTitle: "Features — ScenoraEdits Scene-Based Video Composer",
    ogDescription:
      "Scene-by-scene image control, BYOK raw-cost image generation, Video Bible visual consistency, kinetic captions, and multi-format MP4/720p/WebM/MP3 export.",
  });

  const [activeNav, setActiveNav] = useState<string>("scene-control");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [activeWorkflow, setActiveWorkflow] = useState<"documentary" | "shorts" | "explainer">("documentary");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const navItems = [
    { id: "scene-control", label: "01. Scene Control" },
    { id: "byok", label: "02. BYOK API Keys" },
    { id: "videobible", label: "03. Video Bible™" },
    { id: "timeline", label: "04. Motion & Captions" },
    { id: "multiformat", label: "05. Multi-Format Export" },
    { id: "zerodrift", label: "06. Zero-Drift Pipeline" },
    { id: "specs", label: "07. Technical Specs" },
    { id: "workflows", label: "08. Workflows" },
    { id: "faq", label: "09. FAQ" },
  ];

  return (
    <div className="feat-page">
      {/* 1. HERO SECTION */}
      <section className="feat-hero-section" aria-label="Features Overview">
        <div className="feat-container">
          <div className="feat-hero-badge">
            <Sparkles size={14} className="text-[#FF6B00]" />
            <span>Scene-Based Video Composer Architecture</span>
          </div>

          <h1 className="feat-hero-h1">
            Total Scene-by-Scene Control,{" "}
            <span className="feat-gradient-text">Zero Compromises</span>
          </h1>

          <p className="feat-hero-lead">
            Generic AI video tools generate random clips with no shot control. Traditional video editors take hours of manual timeline alignment. ScenoraEdits combines automated audio scene segmentation with discrete image assignment and cinematic finishing.
          </p>

          <div className="feat-hero-actions">
            <button
              onClick={() => navigate("/app")}
              className="feat-btn-primary"
              id="features-primary-cta"
            >
              <span>Try ScenoraEdits Free</span>
              <ArrowRight size={17} />
            </button>

            <a href="#specs" className="feat-btn-secondary" id="features-specs-cta">
              <Sliders size={16} />
              <span>Technical Specifications</span>
            </a>
          </div>
        </div>
      </section>

      {/* STICKY IN-PAGE JUMP NAVIGATOR */}
      <nav className="feat-subnav-sticky" aria-label="Feature Quick Navigation">
        <div className="feat-container">
          <div className="feat-subnav-list">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveNav(item.id)}
                className={`feat-subnav-item ${activeNav === item.id ? "active" : ""}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ====================================================================
          PILLAR 1: SCENE-LEVEL IMAGE CONTROL
          ==================================================================== */}
      <section className="feat-pillar-section alt-bg" id="scene-control" aria-label="Scene-Level Image Control">
        <div className="feat-container">
          <div className="feat-pillar-row">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <Layers size={14} />
                <span>Pillar 01 • Granular Direction</span>
              </div>
              <h2 className="feat-pillar-title">Scene-Level Image Assignment</h2>
              <p className="feat-pillar-desc">
                Every video is split into distinct acoustic scenes based on your narration pauses. Every single scene gives you a dedicated visual canvas that you control completely.
              </p>

              {/* Problem / Solution Card */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 mb-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <AlertCircle size={14} />
                  <span>The Creator Problem</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Other tools force random 5-second video loops or generic b-roll. If an image doesn't match the voiceover, you can't replace just that shot without regenerating the whole video.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 mb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 size={14} />
                  <span>The ScenoraEdits Solution</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Every scene has its own discrete image slot. Upload your own PNG/JPG artwork, generate a custom image with AI, or replace any frame in 1 click without affecting neighboring scenes.
                </p>
              </div>

              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Flexible Media Sources:</strong> Upload local PNG/JPG/WebP files, generate with AI per scene, or pick from your shared project library.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Drag &amp; Drop Reordering:</strong> Swap scene sequences instantly; duration and audio timing adjust automatically.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Word-Level Acoustic Sync:</strong> Scene start and end boundaries match speech cadence with sub-frame accuracy.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box">
              <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                  <span className="text-xs font-bold uppercase text-[var(--text)]">Scene 03 • Storyboard Card</span>
                  <span className="text-[11px] font-mono text-[#FF6B00] bg-[rgba(255,107,0,0.1)] px-2 py-0.5 rounded">00:12 - 00:18 (6.2s)</span>
                </div>
                <div className="rounded-lg overflow-hidden border border-[var(--border)] aspect-video relative bg-slate-900 mb-3">
                  <img
                    src="/assets/hero_astronaut_main.jpg"
                    alt="Scene Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm px-2.5 py-1.5 rounded text-[11px] text-white">
                    "Deep within the Martian trench, the expedition made their first discovery."
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">✓ Image Assigned</span>
                  <span className="text-[11px] text-[var(--text-secondary)]">Flux Schnell • 1080p</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          PILLAR 2: BRING YOUR OWN API KEY (BYOK)
          ==================================================================== */}
      <section className="feat-pillar-section" id="byok" aria-label="Bring Your Own API Key">
        <div className="feat-container">
          <div className="feat-pillar-row reverse">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <Key size={14} />
                <span>Pillar 02 • Zero Markup Economics</span>
              </div>
              <h2 className="feat-pillar-title">Bring Your Own API Key (BYOK)</h2>
              <p className="feat-pillar-desc">
                Generate unlimited AI images directly within the Studio using your own provider credentials. You pay only raw provider cost with zero middleman markup.
              </p>

              {/* Problem / Solution */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 mb-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <AlertCircle size={14} />
                  <span>The Creator Problem</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Traditional AI platforms force expensive monthly subscriptions ($40–$120/mo) and meter generations with arbitrary "credits" that expire if unused.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 mb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 size={14} />
                  <span>The ScenoraEdits Solution</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Enter your own API key for OpenAI (DALL-E 3), Google Gemini (Imagen 3), Cloudflare Workers AI, or Fal.ai. Plus, free built-in models (Pollinations &amp; Flux Schnell) work out of the box with zero key required.
                </p>
              </div>

              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Client-Isolated Encryption:</strong> Your API keys are encrypted with AES-256 and never logged or accessible to anyone else.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Direct Provider Billing:</strong> DALL-E 3 costs ~$0.04/image and Flux costs ~$0.003/image directly on your provider invoices.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>100% Free Option:</strong> No API key? Use Pollinations or upload your own downloaded art for free indefinitely.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box">
              <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                  <div className="flex items-center gap-2">
                    <Key size={15} className="text-[#FF6B00]" />
                    <span className="text-xs font-bold uppercase text-[var(--text)]">BYOK Vault Active</span>
                  </div>
                  <span className="text-[11px] text-emerald-500 font-semibold">AES-256 Encrypted</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--text)]">OpenAI (DALL-E 3)</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">sk-live-••••••••49a2</div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-500">Connected</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--text)]">Flux Schnell (Fal.ai)</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">fal-key-••••••••99c1</div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-500">Connected</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--text)]">Built-in Free Engine</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">Pollinations.ai</div>
                    </div>
                    <span className="text-[11px] font-bold text-[#FF6B00]">Always Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          PILLAR 3: VIDEO BIBLE™ VISUAL CONSISTENCY
          ==================================================================== */}
      <section className="feat-pillar-section alt-bg" id="videobible" aria-label="Video Bible Consistency Engine">
        <div className="feat-container">
          <div className="feat-pillar-row">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <ShieldCheck size={14} />
                <span>Pillar 03 • Visual Persistence</span>
              </div>
              <h2 className="feat-pillar-title">Video Bible™ Visual Consistency Engine</h2>
              <p className="feat-pillar-desc">
                Eliminate character face-warping and art style degradation. Video Bible establishes permanent character, setting, and lighting anchors that every generated scene strictly obeys.
              </p>

              {/* Problem / Solution */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 mb-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <AlertCircle size={14} />
                  <span>The Creator Problem</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  In generic AI image prompts, your protagonist's face, clothes, age, and art style change every single shot, ruining viewer immersion in long-form stories.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 mb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 size={14} />
                  <span>The ScenoraEdits Solution</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Stage 2 Video Bible locks your character seeds, wardrobe anchors, physical traits, and cinematic lens rules. All subsequent scene generations automatically inherit this visual DNA.
                </p>
              </div>

              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>6 Hand-Crafted Art Presets:</strong> Cinematic 35mm Film, Dark Fantasy, Cyberpunk Anime, 3D Animation, Vintage Graphic Novel, Oil Masterpiece.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Character Identity Pinning:</strong> Persistent face seeds, wardrobe tokens, and hair color tags applied across wide angles and close-ups.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Location &amp; Lighting Memory:</strong> Atmosphere descriptors (e.g., volumetric rain, neon rim light, amber dusk) keep environments uniform.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box">
              <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">Character Anchor: Elena Croft</h4>
                    <span className="text-[11px] text-emerald-500 font-semibold">✓ 100% Visual Consistency Locked</span>
                  </div>
                  <span className="text-[11px] bg-[#FF6B00]/10 text-[#FF6B00] px-2.5 py-1 rounded font-bold">Cinematic Film</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg overflow-hidden border border-[var(--border)] aspect-square bg-slate-900 relative">
                    <img src="/assets/hero_astronaut_main.jpg" alt="Scene A" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono bg-black/80 text-white px-1.5 py-0.5 rounded">Scene 02 (Close-up)</span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-[var(--border)] aspect-square bg-slate-900 relative">
                    <img src="/assets/hero_astronaut_main.jpg" alt="Scene B" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono bg-black/80 text-white px-1.5 py-0.5 rounded">Scene 07 (Wide Action)</span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] m-0 italic">
                  Identical bone structure, EVA helmet design, and color grading preserved across scenes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          PILLAR 4: TIMELINE STUDIO WITH MOTION & CAPTIONS
          ==================================================================== */}
      <section className="feat-pillar-section" id="timeline" aria-label="Timeline Studio Motion and Captions">
        <div className="feat-container">
          <div className="feat-pillar-row reverse">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <Film size={14} />
                <span>Pillar 04 • Cinematic Motion &amp; Typography</span>
              </div>
              <h2 className="feat-pillar-title">Motion, Captions &amp; Audio Ducking</h2>
              <p className="feat-pillar-desc">
                Static slide shows lose viewers. ScenoraEdits injects camera vitality into still images with dynamic Ken Burns motion, fluid transitions, and synchronized kinetic captions.
              </p>

              {/* Problem / Solution */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 mb-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <AlertCircle size={14} />
                  <span>The Creator Problem</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Adding smooth camera pans, animating subtitles word-by-word, and manually keyframing background music ducking in Premiere Pro takes 30–60 minutes per video.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 mb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 size={14} />
                  <span>The ScenoraEdits Solution</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Apply Ken Burns slow zoom and direction pans in 1 click. Choose between TikTok Bold, Netflix Subtitles, or Minimal Lower Thirds. Audio ducking lowers music by -14dB automatically when speech begins.
                </p>
              </div>

              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Ken Burns Motion Suite:</strong> Smooth Zoom In (1.0x &rarr; 1.15x), Zoom Out, Pan Left/Right, and Dynamic Push per scene.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Kinetic Subtitle Styles:</strong> Viral yellow-highlighted TikTok Bold, elegant documentary serif, or classic broadcast subtitles.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Automated Sidechain Ducking:</strong> 50ms smooth attack and 250ms release ensures background tracks never drown narration.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box">
              <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                  <span className="text-xs font-bold uppercase text-[var(--text)]">Stage 4 Motion &amp; Captions</span>
                  <span className="text-[11px] text-[#FF6B00] font-mono">Interactive Preview</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)]">
                    <div className="font-bold text-[var(--text)] mb-1">Ken Burns Camera Motion</div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded bg-[#FF6B00] text-white font-semibold">Slow Zoom In (1.15x)</span>
                      <span className="px-2 py-1 rounded bg-[var(--white)] border border-[var(--border)] text-[var(--text-secondary)]">Pan Left</span>
                      <span className="px-2 py-1 rounded bg-[var(--white)] border border-[var(--border)] text-[var(--text-secondary)]">Subtle Float</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)]">
                    <div className="font-bold text-[var(--text)] mb-1">Caption Preset</div>
                    <div className="p-2 rounded bg-black text-center font-extrabold text-white text-sm">
                      <span className="text-amber-400">EVERY SCENE</span> IS SYNCHRONIZED
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[var(--text)]">Audio Sidechain Ducking</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">-14dB attenuation during speech</div>
                    </div>
                    <span className="text-emerald-500 font-bold">Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          PILLAR 5: MULTI-FORMAT EXPORT
          ==================================================================== */}
      <section className="feat-pillar-section alt-bg" id="multiformat" aria-label="Multi-Format Export">
        <div className="feat-container">
          <div className="feat-pillar-row">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <Download size={14} />
                <span>Pillar 05 • Universal Delivery</span>
              </div>
              <h2 className="feat-pillar-title">Multi-Format Single-Pass Export</h2>
              <p className="feat-pillar-desc">
                Never re-render a video 4 times for different channels. ScenoraEdits renders your master video alongside lightweight drafts, vertical shorts, standalone podcast audio, and animated GIF teasers.
              </p>

              {/* Problem / Solution */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 mb-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <AlertCircle size={14} />
                  <span>The Creator Problem</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Exporting separate files for YouTube, TikTok, Spotify podcast audio, and social teasers forces multiple manual renders and format conversions.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 mb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 size={14} />
                  <span>The ScenoraEdits Solution</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Stage 5 generates 5 formats in one job: Full HD 1080p MP4, fast 720p draft, WebM for web embedding, high-bitrate MP3 podcast cut, and 6-second looping GIF teaser.
                </p>
              </div>

              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>1080p 60fps Broadcast MP4:</strong> Encoded with H.264 High Profile and AAC 48kHz stereo, ready for instant YouTube monetization.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>16:9 Landscape &amp; 9:16 Shorts:</strong> 1-click aspect ratio toggling with smart focal re-centering.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Zero Watermarks &amp; 100% Commercial Rights:</strong> You own the master copyright, visuals, and audio stems outright.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  onClick={() => setAspectRatio("16:9")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    aspectRatio === "16:9"
                      ? "bg-[#FF6B00] text-white"
                      : "bg-[var(--white)] text-[var(--text-secondary)] border border-[var(--border)]"
                  }`}
                >
                  16:9 YouTube Widescreen
                </button>
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    aspectRatio === "9:16"
                      ? "bg-[#FF6B00] text-white"
                      : "bg-[var(--white)] text-[var(--text-secondary)] border border-[var(--border)]"
                  }`}
                >
                  9:16 Shorts Vertical
                </button>
              </div>

              <div
                className="mx-auto rounded-xl overflow-hidden border border-[var(--border)] shadow-lg bg-black transition-all"
                style={{
                  maxWidth: aspectRatio === "9:16" ? "220px" : "100%",
                  aspectRatio: aspectRatio === "9:16" ? "9 / 16" : "16 / 9",
                }}
              >
                <img
                  src="/assets/hero_astronaut_main.jpg"
                  alt="Multi-Aspect Demonstration"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] font-semibold text-[var(--text-secondary)]">
                <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">MP4 1080p</div>
                <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">WebM HD</div>
                <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">MP3 Audio</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          PILLAR 6: ZERO-DRIFT FFmpeg PIPELINE
          ==================================================================== */}
      <section className="feat-pillar-section" id="zerodrift" aria-label="Zero-Drift Pipeline">
        <div className="feat-container">
          <div className="feat-pillar-row reverse">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <Cpu size={14} />
                <span>Pillar 06 • Deterministic Engineering</span>
              </div>
              <h2 className="feat-pillar-title">Zero-Drift FFmpeg Render Pipeline</h2>
              <p className="feat-pillar-desc">
                Web video renderers are notorious for audio desynchronization on long projects. ScenoraEdits uses a deterministic concat demuxer with sample-level timestamp alignment.
              </p>

              {/* Problem / Solution */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 mb-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <AlertCircle size={14} />
                  <span>The Creator Problem</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  In browser-based canvas renderers, video frame timing drifts away from speech audio over 10+ minute videos, resulting in jarring 1–2 second desyncs.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 mb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 size={14} />
                  <span>The ScenoraEdits Solution</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Our backend FFmpeg pipeline renders each scene clip independently and stitches them with presentation timestamp (PTS) continuity. Verified &lt;0.05s variance on 60-minute renders.
                </p>
              </div>

              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Concat Demuxer Stream Stitching:</strong> Zero generation loss; clip boundaries match exact acoustic speech timestamps.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Hardware NVENC &amp; CPU Fallback:</strong> Renders up to 6x faster than realtime with automated hardware acceleration.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Background Queue Resiliency:</strong> Renders proceed asynchronously. You can safely close your browser tab and return when complete.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box">
              <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3 text-[var(--text)]">
                  <span className="font-bold">FFmpeg PTS Telemetry</span>
                  <span className="text-emerald-500 font-bold">DRIFT: 0.000s</span>
                </div>

                <div className="space-y-2 text-[11px] text-[var(--text-secondary)]">
                  <div className="flex justify-between">
                    <span>Scene 01 Duration:</span>
                    <span className="text-[var(--text)] font-semibold">05.400s (162 frames @ 30fps)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scene 02 Duration:</span>
                    <span className="text-[var(--text)] font-semibold">06.800s (204 frames @ 30fps)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audio Master Length:</span>
                    <span className="text-[var(--text)] font-semibold">12.200s (585,600 samples)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PTS/DTS Variance:</span>
                    <span className="text-emerald-500 font-semibold">&plusmn;0.0000s (Sample Locked)</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--border)] text-emerald-500 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={13} />
                    <span>Bitstream Concat Verified Valid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. TECHNICAL SPECIFICATIONS MATRIX
          ==================================================================== */}
      <section className="feat-specs-section" id="specs" aria-label="Technical Specifications">
        <div className="feat-container">
          <div className="feat-specs-header">
            <div className="feat-pillar-badge">
              <Sliders size={14} />
              <span>Full Capability Matrix</span>
            </div>
            <h2 className="feat-pillar-title">Technical Specifications</h2>
            <p className="feat-pillar-desc">
              Comprehensive technical metrics and supported codecs for engineering and production teams.
            </p>
          </div>

          <div className="feat-specs-table-box">
            <table className="feat-specs-table">
              <tbody>
                <tr>
                  <td className="feat-spec-key">Supported Audio Inputs</td>
                  <td className="feat-spec-val">
                    MP3 (up to 320kbps), WAV (16/24-bit PCM), M4A, FLAC, OGG. Built-in Edge-TTS neural voice synthesis in 40+ languages.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Acoustic Transcription Engine</td>
                  <td className="feat-spec-val">
                    Whisper transcription with word-level phonetic alignment and automated silence/breath segmentation into scenes.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Image Engines &amp; BYOK</td>
                  <td className="feat-spec-val">
                    Pollinations (Free), Flux Schnell, OpenAI DALL-E 3, Google Gemini Imagen 3, Cloudflare Workers AI. AES-256 encrypted vault.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Video Bible™ Persistence</td>
                  <td className="feat-spec-val">
                    Seed pinning, facial proportion vectors, wardrobe anchors, lighting temperature, and persistent negative prompt locks.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Timeline Resolution &amp; Frame Rates</td>
                  <td className="feat-spec-val">
                    Full HD 1080p (1920x1080) Landscape, 1080x1920 Vertical Shorts, 1:1 Square. 24fps, 30fps, 60fps.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Audio Ducking Envelope</td>
                  <td className="feat-spec-val">
                    Configurable -10dB to -18dB background attenuation, 50ms attack curve, 250ms release curve during speech.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Export Formats &amp; Delivery</td>
                  <td className="feat-spec-val">
                    MP4 (H.264 High Profile / AAC 48kHz Stereo), 720p Draft, WebM, 320kbps MP3 podcast cut, 6s GIF teaser, standalone SRT/VTT.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Licensing &amp; Ownership</td>
                  <td className="feat-spec-val">
                    100% Commercial Copyright ownership granted to creator. Zero watermarks on exported masters.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. WORKFLOW SIMULATOR
          ==================================================================== */}
      <section className="feat-sim-section" id="workflows" aria-label="Workflow Simulator">
        <div className="feat-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="feat-pillar-badge">
              <Play size={14} />
              <span>Production In Action</span>
            </div>
            <h2 className="feat-pillar-title">Select a Channel Format to See the Toolchain</h2>
            <p className="feat-pillar-desc">
              Inspect how the ScenoraEdits feature set adapts to different content genres and publishing cadences.
            </p>
          </div>

          <div className="feat-sim-tabs">
            <button
              onClick={() => setActiveWorkflow("documentary")}
              className={`feat-sim-tab-btn ${activeWorkflow === "documentary" ? "active" : ""}`}
            >
              YouTube Documentaries &amp; Lore
            </button>
            <button
              onClick={() => setActiveWorkflow("shorts")}
              className={`feat-sim-tab-btn ${activeWorkflow === "shorts" ? "active" : ""}`}
            >
              Viral Faceless Shorts &amp; TikTok
            </button>
            <button
              onClick={() => setActiveWorkflow("explainer")}
              className={`feat-sim-tab-btn ${activeWorkflow === "explainer" ? "active" : ""}`}
            >
              Educational &amp; Explainer Videos
            </button>
          </div>

          <div className="feat-sim-card">
            {activeWorkflow === "documentary" && (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text)]">
                      The 20-Minute Historical Documentary Workflow
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Target: 40 scenes • 2 locked historical characters • Atmospheric ambient score
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#FF6B00] px-3 py-1 rounded bg-[rgba(255,107,0,0.1)]">
                    16:9 Cinema 1080p
                  </span>
                </div>

                <div className="feat-sim-steps-grid">
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 01</span>
                    <h5>Acoustic Slicing</h5>
                    <p>Whisper segments 20 minutes of narration into 40 distinct cinematic visual beats.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 02</span>
                    <h5>Video Bible™ Pin</h5>
                    <p>Centurion Marcus and Emperor Augustus locked with permanent costume armor seeds.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 03</span>
                    <h5>Multi-Track Master</h5>
                    <p>Ambient score auto-ducked -14dB beneath narrator voiceover with Ken Burns motion.</p>
                  </div>
                </div>
              </div>
            )}

            {activeWorkflow === "shorts" && (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text)]">
                      The 60-Second Viral Shorts Production Workflow
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Target: High retention hook • Word-by-word kinetic text • Fast cut transitions
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#FF6B00] px-3 py-1 rounded bg-[rgba(255,107,0,0.1)]">
                    9:16 Shorts 60fps
                  </span>
                </div>

                <div className="feat-sim-steps-grid">
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 01</span>
                    <h5>Fast Cut Detection</h5>
                    <p>60s audio divided into 12 fast-paced 5-second scenes for maximum dopamine retention.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 02</span>
                    <h5>Bold Typography</h5>
                    <p>TikTok-style yellow kinetic subtitles centered vertically for mobile thumb-stoppers.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 03</span>
                    <h5>1-Click Export</h5>
                    <p>Rendered in 1080x1920 with high-contrast color boost ready for TikTok &amp; Shorts.</p>
                  </div>
                </div>
              </div>
            )}

            {activeWorkflow === "explainer" && (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text)]">
                      The Educational &amp; Technical Explainer Workflow
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Target: Precise diagram matching • Subtitle clarity • Zero sync drift
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#FF6B00] px-3 py-1 rounded bg-[rgba(255,107,0,0.1)]">
                    1080p Lecture Master
                  </span>
                </div>

                <div className="feat-sim-steps-grid">
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 01</span>
                    <h5>Slide-to-Voice Sync</h5>
                    <p>Assign architectural diagrams and key concept slides to exact audio talking points.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 02</span>
                    <h5>Lower-Third Callouts</h5>
                    <p>Highlight technical terms, definitions, and code snippets with clean typography.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 03</span>
                    <h5>Multi-Deliverable Cut</h5>
                    <p>Export both complete 1080p lecture and standalone MP3 podcast for student review.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          9. FAQ ACCORDION
          ==================================================================== */}
      <section className="feat-faq-section" id="faq" aria-label="Features Frequently Asked Questions">
        <div className="feat-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="feat-pillar-badge">
              <HelpCircle size={14} />
              <span>Features FAQ</span>
            </div>
            <h2 className="feat-pillar-title">Frequently Asked Questions</h2>
            <p className="feat-pillar-desc">
              Everything you need to know about scene editing, BYOK keys, and video export.
            </p>
          </div>

          <div className="feat-faq-box">
            {[
              {
                q: "Can I upload my own images instead of generating with AI?",
                a: "Yes, 100%! ScenoraEdits is an audio-to-video composer. You can upload your own custom PNG, JPG, or WebP images to any scene, drag-and-drop your own artwork, or use AI generation only for scenes where you need it.",
              },
              {
                q: "Do I have to pay for an API key to use ScenoraEdits?",
                a: "No. ScenoraEdits includes built-in free image generation (Pollinations and Flux Schnell) with zero API keys required. If you want to use premium engines like OpenAI DALL-E 3 or Google Gemini Imagen 3, you can add your own key to pay raw developer prices directly.",
              },
              {
                q: "How does Video Bible™ ensure characters don't change faces?",
                a: "In Stage 2, you specify your character's name, physical description, locked seed, and wardrobe anchors. When scenes are generated, ScenoraEdits injects these exact identity prompts into every scene prompt so the facial geometry and style remain persistent.",
              },
              {
                q: "Will my exported video have any watermarks?",
                a: "Never. All exports from ScenoraEdits have zero watermarks and grant 100% commercial ownership rights. You can monetize immediately on YouTube, sell to clients, or use in paid advertisements.",
              },
              {
                q: "How does the zero-drift guarantee work for long videos?",
                a: "Our backend uses FFmpeg's deterministic concat demuxer. Instead of relying on client-side frame dropping, each scene clip is rendered with presentation timestamps (PTS) matching sample-level speech audio. Renders tested up to 60 minutes exhibit <0.05s variance.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="feat-faq-item">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="feat-faq-btn"
                  aria-expanded={openFaqIndex === idx}
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openFaqIndex === idx && (
                  <div className="feat-faq-content">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="feat-bottom-cta">
        <div className="feat-container">
          <div className="feat-bottom-card">
            <h2>Ready to Build Your Video Scene-by-Scene?</h2>
            <p>
              Upload your audio, drop your images, and export finished 1080p videos in minutes. Free forever to test.
            </p>
            <div className="feat-hero-actions" style={{ marginBottom: 0 }}>
              <button
                onClick={() => navigate("/app")}
                className="feat-btn-primary"
                id="features-footer-cta"
              >
                <span>Open Studio Free →</span>
              </button>
              <button
                onClick={() => navigate("/how-it-works")}
                className="feat-btn-secondary"
              >
                <span>Walk Through the 5 Stages</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
