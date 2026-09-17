import React, { useState } from "react";
import { useRouter } from "../../router/Router";
import { useSEO } from "../../utils/seo";
import "./HomePage.css";
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Volume2,
  Video,
  ChevronDown,
  ChevronUp,
  Zap,
  Film,
  Check,
  Type,
  Sliders,
  Key,
  Download,
  Headphones,
  Palette,
} from "lucide-react";

interface SceneMockup {
  id: number;
  label: string;
  timecode: string;
  script: string;
  visualPrompt: string;
  seed: number;
  image: string;
  captionWord: string;
}

const mockScenes: SceneMockup[] = [
  {
    id: 1,
    label: "Scene 01: The Cosmic Anomaly",
    timecode: "00:00 - 00:06",
    script: "Deep within the Orion Nebula, Captain Vance detected a frequency that defied known physics...",
    visualPrompt: "Cinematic medium shot of Commander Vance in a gold-visor EVA helmet, dramatic blue nebula backlight, 35mm anamorphic lens, 8k photorealistic.",
    seed: 8492041,
    image: "/assets/hero_astronaut_main.jpg",
    captionWord: "FREQUENCY THAT DEFIED",
  },
  {
    id: 2,
    label: "Scene 02: The Signal Decoded",
    timecode: "00:06 - 00:14",
    script: "As the telemetry locked onto coordinates 49-X, the cockpit instruments flickered in synchronized cadence.",
    visualPrompt: "Side profile shot of Commander Vance examining illuminated holographic star charts inside cockpit, exact facial likeness, amber cockpit glow.",
    seed: 8492041,
    image: "/assets/scene_2_profile.jpg",
    captionWord: "SYNCHRONIZED CADENCE",
  },
  {
    id: 3,
    label: "Scene 03: The Forgotten Monolith",
    timecode: "00:14 - 00:22",
    script: "Descending toward the obsidian surface, towering crystalline structures emerged from the dust storms.",
    visualPrompt: "Extreme wide cinematic shot, Commander Vance standing before an ancient alien obsidian monolith on alien desert planet, dual sunset horizon.",
    seed: 8492041,
    image: "/assets/scene_3_landscape.jpg",
    captionWord: "CRYSTALLINE STRUCTURES",
  },
];

const genreShowcases = [
  {
    id: "scifi",
    name: "Sci-Fi Lore & Mystery",
    badge: "16:9 Landscape • Cinema Grade",
    title: "The Chronicles of Captain Vance",
    description: "Multi-scene character continuity across zero-g cockpits, deep space anomalies, and alien terrain with consistent facial likeness and uniform details.",
    prompt: "Prompt: Commander Vance, gold EVA visor, weathered lunar tactical suit, dramatic nebula lighting, ARRI Alexa LF --seed 8492041 --style cinematic",
    character: "Captain Vance (Video Bible Locked)",
    image: "/assets/hero_astronaut_main.jpg",
    stats: "32 Scenes • 4K Master • 100% Continuity",
  },
  {
    id: "history",
    name: "Historical Documentary",
    badge: "Documentary Voiceover • Archival Look",
    title: "Fall of the Roman Legions (9 AD)",
    description: "Rich atmospheric battle landscapes, authentic Roman armor and legionary uniforms persisted flawlessly from opening march to misty forest ambush.",
    prompt: "Prompt: Centurion Marcus Aurelius in imperial Lorica Segmentata, muddy battlefield mist, cinematic oil-painting texture, 85mm lens --seed 119280",
    character: "Centurion Marcus (Video Bible Locked)",
    image: "/assets/scene_1_wide.jpg",
    stats: "24 Scenes • Full HD • Auto-Ducked Score",
  },
  {
    id: "shorts",
    name: "Faceless Viral Shorts",
    badge: "9:16 Vertical • Fast Retention",
    title: "3 Paradoxes That Break Reality",
    description: "High-retention 60-second vertical reels engineered for YouTube Shorts and TikTok with dynamic word-by-word highlighted captions.",
    prompt: "Prompt: Quantum physics visual metaphor, glowing hypercube rotating in dark void, energetic neon particles, high contrast --seed 554109",
    character: "Narrator Style: Fast Hook & High Energy",
    image: "/assets/scene_2_profile.jpg",
    stats: "60 Seconds • Kinetic Subtitles • Viral Audio",
  },
];

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();

  useSEO({
    title: "ScenoraEdits — Turn Your Audio Into a Scene-by-Scene Video, Free",
    description:
      "Upload your voiceover and assign one image to each scene. Add captions, motion, and overlays — then export a finished MP4. Free scene-based video builder for YouTube creators.",
    canonical: "https://scenoraedits.web.app/",
    ogTitle: "ScenoraEdits — Scene-by-Scene Video Builder",
    ogDescription:
      "Bring your own audio and images. One image per scene. Captions, motion, and export in MP4, 720p, WebM. Built for faceless YouTube creators.",
  });

  // Interactive Mockup State
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  // Interactive Genre Showcase State
  const [activeGenreId, setActiveGenreId] = useState<string>("scifi");

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const activeScene = mockScenes[activeSceneIndex];
  const activeGenre = genreShowcases.find((g) => g.id === activeGenreId) || genreShowcases[0];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="mkt-page">
      {/* ====================================================================
          1. HIGH-IMPACT HERO SECTION (ABOVE THE FOLD)
          ==================================================================== */}
      <section className="mkt-hero-section" aria-label="Hero Introduction">
        <div className="mkt-container">
          <div className="mkt-hero-content">
            <div className="mkt-badge" role="status">
              <Sparkles size={14} className="animate-pulse" />
              <span>SCENE-BASED VIDEO COMPOSER</span>
            </div>

            <h1 className="mkt-hero-h1">
              Bring your audio. <br />
              <span className="mkt-text-gradient">Assign your images.</span> <br />
              Export your video.
            </h1>

            <p className="mkt-hero-lead">
              ScenoraEdits splits your voiceover into scenes. Drop one image onto each scene — or
              generate one with AI using your own API key. Add captions, motion, and overlays.
              Export as MP4, ready for YouTube. The definitive <strong>scene by scene video maker</strong> for creators who already have the story.
            </p>

            <div className="mkt-hero-cta-group">
              <button
                onClick={() => navigate("/app")}
                className="mkt-btn-primary"
                id="hero-primary-cta"
              >
                <span>Build my video free</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => navigate("/how-it-works")}
                className="mkt-btn-secondary"
                id="hero-secondary-cta"
              >
                <Play size={16} />
                <span>See how it works</span>
              </button>
            </div>

            <div className="mkt-hero-guarantees">
              <span className="mkt-guarantee-item">
                <CheckCircle2 size={16} className="mkt-guarantee-icon" />
                <span>No credit card required</span>
              </span>
              <span className="mkt-guarantee-item">
                <CheckCircle2 size={16} className="mkt-guarantee-icon" />
                <span>Your images or BYOK AI keys</span>
              </span>
              <span className="mkt-guarantee-item">
                <CheckCircle2 size={16} className="mkt-guarantee-icon" />
                <span>Zero watermark on 1080p export</span>
              </span>
            </div>
          </div>

          {/* INTERACTIVE STUDIO MOCKUP CANVAS */}
          <div className="mkt-studio-mockup" aria-label="Interactive Studio Preview">
            <div className="mkt-mockup-header">
              <div className="mkt-mockup-dots" aria-hidden="true">
                <div className="mkt-dot mkt-dot-red" />
                <div className="mkt-dot mkt-dot-yellow" />
                <div className="mkt-dot mkt-dot-green" />
              </div>

              <div className="mkt-mockup-title">
                <Film size={14} className="text-[#FF6B00]" />
                <span>Project: Echoes_Of_Orion • Master Timeline Studio</span>
              </div>

              <div className="mkt-mockup-controls">
                <button
                  onClick={() => setAspectRatio("16:9")}
                  className={`mkt-aspect-pill ${aspectRatio === "16:9" ? "active" : ""}`}
                  title="Widescreen 16:9 (YouTube)"
                >
                  16:9 YouTube
                </button>
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className={`mkt-aspect-pill ${aspectRatio === "9:16" ? "active" : ""}`}
                  title="Vertical 9:16 (Shorts/Reels)"
                >
                  9:16 Shorts
                </button>
              </div>
            </div>

            <div className="mkt-studio-grid">
              {/* SIDEBAR: Script Beats & Video Bible */}
              <div className="mkt-studio-sidebar">
                <div>
                  <div className="mkt-sidebar-block-title">
                    <span>Scene Image Slots</span>
                    <span className="text-xs text-[#FF6B00]">3 Scenes</span>
                  </div>

                  {mockScenes.map((scene, idx) => (
                    <div
                      key={scene.id}
                      onClick={() => setActiveSceneIndex(idx)}
                      className={`mkt-script-card ${activeSceneIndex === idx ? "active" : ""}`}
                    >
                      <div className="mkt-script-card-header">
                        <span>{scene.label}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {scene.timecode}
                        </span>
                      </div>
                      <p className="mkt-script-text">{scene.script}</p>
                    </div>
                  ))}
                </div>

                {/* Video Bible Character Anchor Card */}
                <div>
                  <div className="mkt-sidebar-block-title">
                    <span>Video Bible™ Consistency</span>
                    <span className="text-[10px] text-emerald-500 font-bold">LOCKED</span>
                  </div>
                  <div className="mkt-bible-anchor">
                    <img
                      src="/assets/hero_astronaut_main.jpg"
                      alt="Commander Vance Character Anchor"
                      className="mkt-character-avatar"
                    />
                    <div className="mkt-character-info">
                      <h5>Captain Vance</h5>
                      <p>
                        <ShieldCheck size={12} />
                        <span>Consistent Seed #8492041</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MAIN CANVAS: Preview, Dynamic Captions & Audio Ducking Timeline */}
              <div className="mkt-studio-canvas">
                <div
                  className={`mkt-canvas-preview ${
                    aspectRatio === "9:16" ? "aspect-9-16" : ""
                  }`}
                >
                  <img
                    src={activeScene.image}
                    alt={activeScene.label}
                    className="mkt-canvas-img"
                  />
                  <div className="mkt-canvas-caption-overlay">
                    <span>... {activeScene.script.split(" ")[0]}{" "}</span>
                    <span className="mkt-caption-highlight">{activeScene.captionWord}</span>
                    <span> ...</span>
                  </div>
                </div>

                {/* Speech & Background Audio Ducking Timeline Track */}
                <div className="mkt-timeline-bar">
                  <div className="mkt-track-label">
                    <span className="flex items-center gap-1.5">
                      <Volume2 size={13} className="text-[#FF6B00]" />
                      <span>Speech Narration &amp; Dynamic Music Ducking</span>
                    </span>
                    <span className="mkt-track-ducking-badge">
                      <Zap size={10} />
                      <span>Auto-Duck Under Voice</span>
                    </span>
                  </div>

                  <div className="mkt-audio-waveform" aria-hidden="true">
                    {[12, 18, 28, 36, 24, 16, 32, 28, 14, 8, 10, 24, 34, 30, 18, 10, 8, 22, 36, 28, 14, 10, 26, 32, 22, 12, 8, 16, 28, 36, 24, 12, 8, 20, 32, 28, 16, 10, 24, 34, 28, 14].map(
                      (h, i) => {
                        const isSpeechActive = i % 5 !== 0;
                        return (
                          <div
                            key={i}
                            className={`mkt-wave-bar ${
                              isSpeechActive ? "speaking" : "ducked"
                            }`}
                            style={{ height: `${h}px` }}
                          />
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. HOW IT WORKS (5 STEPS ALIGNED TO THE 5 STAGES)
          ==================================================================== */}
      <section className="mkt-how-it-works-section py-20 bg-[var(--bg-surface-subtle)]" id="how-it-works" aria-label="How It Works">
        <div className="mkt-container">
          <div className="mkt-section-header text-center max-w-3xl mx-auto mb-16">
            <div className="mkt-badge mkt-badge-purple mb-4">Production Workflow</div>
            <h2 className="mkt-section-title text-3xl sm:text-4xl font-extrabold tracking-tight">
              From audio file to finished video in 5 steps
            </h2>
            <p className="mkt-section-subtitle text-base sm:text-lg text-[var(--text-muted)] mt-4">
              A structured creative workflow designed specifically for creators who already have narration.
              You keep full creative control at every single scene.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#6366f1] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4 border border-indigo-500/20">
                  1
                </div>
                <h3 className="font-bold text-base text-[var(--text-primary)] mb-2">
                  Upload Audio or Generate Voiceover
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Upload your master .mp3, .wav, or .m4a voiceover — or generate clean neural voiceover using Edge-TTS. Sentence timecodes are calculated automatically.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-indigo-400">
                Stage 1 • Master Timeline
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#a855f7] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg mb-4 border border-purple-500/20">
                  2
                </div>
                <h3 className="font-bold text-base text-[var(--text-primary)] mb-2">
                  Set Visual Style &amp; Characters
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  The Video Bible™ locks character faces, costumes, and color palettes so your visuals stay 100% consistent across every single cut.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-purple-400">
                Stage 2 • Video Bible
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#ec4899] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold text-lg mb-4 border border-pink-500/20">
                  3
                </div>
                <h3 className="font-bold text-base text-[var(--text-primary)] mb-2">
                  Assign One Image Per Scene
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Every scene gets its own image slot. Drag images from your computer, or generate bespoke frames with AI using free cloud models or your own API key.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-pink-400">
                Stage 3 • Storyboard
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#f59e0b] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg mb-4 border border-amber-500/20">
                  4
                </div>
                <h3 className="font-bold text-base text-[var(--text-primary)] mb-2">
                  Add Motion, Captions &amp; Overlays
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Inject cinematic energy with Ken Burns pan/zoom, scene transitions, animated captions (TikTok Bold, Classic), and auto-ducked background music.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-amber-400">
                Stage 4 • Timeline Studio
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#10b981] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 border border-emerald-500/20">
                  5
                </div>
                <h3 className="font-bold text-base text-[var(--text-primary)] mb-2">
                  Export Your Finished Video
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Render broadcast-grade Full HD MP4 with zero timing drift. Download on demand in 1080p, 720p, WebM, audio-only MP3, and animated 6s GIF loop.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-emerald-400">
                Stage 5 • Export &amp; Deliver
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. FEATURE HIGHLIGHTS (6 CORE PILLARS IN A 2-COLUMN GRID)
          ==================================================================== */}
      <section className="mkt-features-section py-20" id="features" aria-label="Feature Highlights">
        <div className="mkt-container">
          <div className="mkt-section-header text-center max-w-3xl mx-auto mb-16">
            <div className="mkt-badge mkt-badge-blue mb-4">Core Capabilities</div>
            <h2 className="mkt-section-title text-3xl sm:text-4xl font-extrabold tracking-tight">
              Engineered for Complete Scene-by-Scene Control
            </h2>
            <p className="mkt-section-subtitle text-base sm:text-lg text-[var(--text-muted)] mt-4">
              Unlike black-box AI tools that output random stock footage, ScenoraEdits gives you granular control over every visual cut and sound layer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-indigo-500/40 transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Scene-Level Image Control</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Every scene has its own dedicated image slot. Upload from your computer, drag an image directly from your desktop, or generate one with AI. Replace any scene anytime without touching the rest of your timeline.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-purple-500/40 transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Bring Your Own API Key (BYOK)</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Use your own OpenAI (DALL-E 3), Cloudflare, or Flux API keys to generate images per scene at direct developer cost. Free cloud providers (Flux &amp; Pollinations) are also available with zero configuration.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-pink-500/40 transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Video Bible™ Consistency</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Define your visual style, recurring characters, and key locations once. Every scene generation prompt is automatically prefixed with your visual anchor rules — maintaining consistent faces, costumes, and lighting.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-amber-500/40 transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Type size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Caption Styles &amp; Animation</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Render broadcast-grade burned-in ASS subtitles with customizable font family, colors, shadows, and positioning. Choose between high-retention TikTok Bold, Classic Subtitles, or Minimal Lower Third layouts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-emerald-500/40 transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Sliders size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Motion &amp; Transitions</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Breathe life into still imagery with Ken Burns dynamic zoom-in, pan-left, and pan-right motions. Connect scenes with crossfades, slides, and fade-to-black transitions previewable in real time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-cyan-500/40 transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Download size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Multi-Format &amp; Zero-Drift</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                A single render produces MP4 1080p, 720p HD, WebM, MP3 audio, and a 6-second animated loop GIF. Our multi-pass FFmpeg pipeline guarantees audio-visual synchronization to within &lt;0.05 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. WHO IT'S FOR (3 CREATOR ARCHETYPES)
          ==================================================================== */}
      <section className="mkt-who-section py-20 bg-[var(--bg-surface-subtle)]" id="who-its-for" aria-label="Target Audience">
        <div className="mkt-container">
          <div className="mkt-section-header text-center max-w-3xl mx-auto mb-16">
            <div className="mkt-badge mkt-badge-purple mb-4">Creator Focus</div>
            <h2 className="mkt-section-title text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built for creators who already have the story
            </h2>
            <p className="mkt-section-subtitle text-base sm:text-lg text-[var(--text-muted)] mt-4">
              You record narration, not video. ScenoraEdits turns that audio into a complete visual YouTube video without a camera or complex editing software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Audience 1 */}
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6">
                  <Video size={24} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Faceless YouTube Creators</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                  You produce documentary, history, mystery, or finance videos without showing your face. ScenoraEdits automatically aligns your voiceover with matching scene visuals, kinetic captions, and cinematic motion.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] pt-4 border-t border-[var(--border-subtle)]">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Continuous character faces</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Automatic sentence timecodes</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> 16:9 Full HD broadcast export</li>
              </ul>
            </div>

            {/* Audience 2 */}
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                  <Headphones size={24} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Podcast-to-Video Creators</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                  Your audio episodes already tell great stories. Tap into YouTube's massive discovery algorithm by adding topic-specific visual imagery per segment without manually re-cutting raw audio in an NLE.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] pt-4 border-t border-[var(--border-subtle)]">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Drag-and-drop slide graphics</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Accessible burned-in subtitles</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Audio-only MP3 export included</li>
              </ul>
            </div>

            {/* Audience 3 */}
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                  <Palette size={24} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">AI Image Artists</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                  You already generate stunning imagery with Midjourney, Flux, or Stable Diffusion. ScenoraEdits is where those individual stills become an assembled, narrated, motion-rich video project.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] pt-4 border-t border-[var(--border-subtle)]">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Direct image slot dropzone</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Ken Burns cinematic motion</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Multi-format 9:16 and 16:9</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. INTERACTIVE GENRE SHOWCASE WIDGET
          ==================================================================== */}
      <section className="mkt-showcase-section py-20" id="showcase" aria-label="Interactive Showcase">
        <div className="mkt-container">
          <div className="mkt-section-header text-center max-w-3xl mx-auto mb-16">
            <div className="mkt-badge mkt-badge-blue mb-4">Live Studio Showcase</div>
            <h2 className="mkt-section-title text-3xl sm:text-4xl font-extrabold tracking-tight">
              See ScenoraEdits in Action Across Formats
            </h2>
            <p className="mkt-section-subtitle text-base sm:text-lg text-[var(--text-muted)] mt-4">
              Select a genre below to inspect the actual script lines, prompt parameters, and visual outputs
              assembled by the ScenoraEdits engine.
            </p>
          </div>

          <div className="mkt-showcase-box">
            <div className="mkt-showcase-tabs">
              {genreShowcases.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setActiveGenreId(genre.id)}
                  className={`mkt-tab-btn ${activeGenreId === genre.id ? "active" : ""}`}
                >
                  <Film size={15} />
                  <span>{genre.name}</span>
                </button>
              ))}
            </div>

            <div className="mkt-showcase-content">
              <div className="mkt-showcase-details">
                <span className="mkt-showcase-pill">{activeGenre.badge}</span>
                <h3>{activeGenre.title}</h3>
                <p>{activeGenre.description}</p>

                <div className="mkt-prompt-box">
                  <span className="mkt-prompt-tag">AI Visual Prompt Blueprint</span>
                  <div>{activeGenre.prompt}</div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#FF6B00]" />
                    {activeGenre.character}
                  </span>
                  <span>•</span>
                  <span>{activeGenre.stats}</span>
                </div>
              </div>

              <div>
                <div className="rounded-xl overflow-hidden border border-[var(--border)] shadow-xl bg-black">
                  <img
                    src={activeGenre.image}
                    alt={activeGenre.title}
                    className="w-full h-80 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. FAQ ACCORDION
          ==================================================================== */}
      <section className="mkt-faq-section py-20 bg-[var(--bg-surface-subtle)]" id="faq" aria-label="Frequently Asked Questions">
        <div className="mkt-container">
          <div className="mkt-section-header text-center max-w-3xl mx-auto mb-16">
            <div className="mkt-badge mkt-badge-purple mb-4">FAQ</div>
            <h2 className="mkt-section-title text-3xl sm:text-4xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mkt-section-subtitle text-base sm:text-lg text-[var(--text-muted)] mt-4">
              Everything you need to know about scene-by-scene video composition with ScenoraEdits.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "What makes ScenoraEdits different from tools like Fliki or Pictory?",
                a: "Tools like Fliki and Pictory take control away by auto-selecting stock footage or generic clips. ScenoraEdits is a scene-based video composer that gives you 100% control: every scene has its own dedicated image slot where you can upload your own image, drag from desktop, or generate using AI with your own API key.",
              },
              {
                q: "Do I need an API key to generate images?",
                a: "No! ScenoraEdits includes free cloud image providers (Flux and Pollinations) that work right out of the box with zero setup. If you want premium models like OpenAI DALL-E 3 or Gemini Imagen 3, you can add your own API key (BYOK) and generate at direct provider cost.",
              },
              {
                q: "Can I upload my own voiceover audio?",
                a: "Yes. You can upload any voiceover file (.mp3, .wav, .m4a, .aac up to 50MB) recorded on your own microphone or generated via ElevenLabs. Alternatively, you can generate speech directly in the app using Microsoft Edge-TTS neural voices.",
              },
              {
                q: "Is there any watermark on the exported video?",
                a: "No. All exported videos (Full HD 1080p, 720p, WebM, MP3, GIF) are 100% clean and free of watermarks, ready for YouTube monetization and commercial publishing.",
              },
              {
                q: "What video formats can I export?",
                a: "A single render job creates five production formats simultaneously: MP4 1080p (Full HD master), 720p HD (mobile/social), WebM VP9 (web video), MP3 (extracted audio-only mix), and a 6-second animated loop GIF.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-[var(--text-primary)] hover:text-[#6366f1] transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openFaqIndex === idx && (
                  <div className="px-6 pb-5 text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-subtle)] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. FINAL HIGH-CONVERTING CTA
          ==================================================================== */}
      <section className="mkt-cta-section py-24 text-center relative overflow-hidden" aria-label="Get Started">
        <div className="mkt-container max-w-4xl mx-auto px-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <Sparkles size={28} />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
            Start building your video — free
          </h2>
          <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            No credit card. No camera. No video editing skills required. Upload your audio and assign your scene images today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/app")}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
            >
              <span>Try ScenoraEdits free</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate("/how-it-works")}
              className="px-8 py-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-base border border-zinc-700 transition-all"
            >
              See interactive guide
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
