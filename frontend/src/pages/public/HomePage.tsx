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
  Cpu,
  Video,
  ChevronDown,
  ChevronUp,
  Zap,
  Film,
  FileText,
  Check,
  X,
  Type,
  Maximize2,
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
    title: "ScenoraEdits — AI Video Maker for YouTube Creators | Script to Video",
    description:
      "Transform scripts and voiceovers into cinematic YouTube videos in minutes. Built-in Video Bible for 100% character continuity, smart audio ducking, kinetic captions, and Full HD 1080p exports.",
    canonical: "https://scenoraedits.web.app/",
    ogTitle: "ScenoraEdits — AI Video Maker for YouTube Creators",
    ogDescription:
      "Transform raw scripts & voiceovers into cinematic YouTube videos. Guaranteed character consistency with Video Bible, automated audio ducking, and 1080p exports.",
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
              <span>Next-Gen AI Video Generator for YouTube &amp; Shorts Creators</span>
            </div>

            <h1 className="mkt-hero-h1">
              Turn Raw Scripts &amp; Voiceovers into{" "}
              <span className="mkt-text-gradient">Cinematic YouTube Videos</span> in Minutes
            </h1>

            <p className="mkt-hero-lead">
              Stop hunting stock footage and fighting mismatched AI shots. ScenoraEdits coordinates
              scene-by-scene visuals, locks 100% character continuity with Video Bible™, auto-ducks
              background audio, and delivers ready-to-publish Full HD 1080p videos.
            </p>

            <div className="mkt-hero-cta-group">
              <button
                onClick={() => navigate("/app")}
                className="mkt-btn-primary"
                id="hero-primary-cta"
              >
                <span>Start Creating Free</span>
                <ArrowRight size={18} />
              </button>

              <a href="#showcase" className="mkt-btn-secondary" id="hero-secondary-cta">
                <Play size={16} />
                <span>Explore Interactive Demo</span>
              </a>
            </div>

            <div className="mkt-hero-guarantees">
              <span className="mkt-guarantee-item">
                <CheckCircle2 size={16} className="mkt-guarantee-icon" />
                <span>No credit card required</span>
              </span>
              <span className="mkt-guarantee-item">
                <CheckCircle2 size={16} className="mkt-guarantee-icon" />
                <span>Local RTX GPU &amp; Cloud burst</span>
              </span>
              <span className="mkt-guarantee-item">
                <CheckCircle2 size={16} className="mkt-guarantee-icon" />
                <span>100% Commercial YouTube rights</span>
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
                <span>Project: Echoes_Of_Orion_Episode_01 • 1080p Master Timeline</span>
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
                    <span>Story Beats &amp; Prompts</span>
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
                    <span>Video Bible™ Anchor</span>
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
                      <span>-14dB Auto-Duck Under Speech</span>
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
          2. CREATOR PROOF & TRUST METRICS BAR
          ==================================================================== */}
      <section className="mkt-metrics-section" aria-label="Creator Metrics">
        <div className="mkt-container">
          <div className="mkt-metrics-grid">
            <div>
              <div className="mkt-metric-stat">
                <span>250K</span>+
              </div>
              <div className="mkt-metric-label">YouTube &amp; Shorts Videos Rendered</div>
            </div>
            <div>
              <div className="mkt-metric-stat">
                <span>99.4</span>%
              </div>
              <div className="mkt-metric-label">Character Visual Consistency Match</div>
            </div>
            <div>
              <div className="mkt-metric-stat">
                <span>10</span>x
              </div>
              <div className="mkt-metric-label">Faster Turnaround vs. Manual Video Editing</div>
            </div>
            <div>
              <div className="mkt-metric-stat">
                <span>4.9</span> / 5
              </div>
              <div className="mkt-metric-label">Rated by Full-Time YouTube Creators</div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. THE PARADIGM SHIFT (OLD EDITING VS. SCENORA WAY)
          ==================================================================== */}
      <section className="mkt-contrast-section" aria-label="Comparison">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div className="mkt-badge mkt-badge-purple">The AI Video Evolution</div>
            <h2 className="mkt-section-title">Why Traditional Video Editing Holds Creators Back</h2>
            <p className="mkt-section-subtitle">
              Sourcing random B-roll or fighting black-box AI tools wastes hours. ScenoraEdits delivers
              a complete, controlled production pipeline engineered specifically for high-retention content.
            </p>
          </div>

          <div className="mkt-contrast-grid">
            {/* The Old Way */}
            <div className="mkt-contrast-card old-way">
              <div>
                <div className="mkt-contrast-badge bad">
                  <X size={14} />
                  <span>The Fragmented Old Way</span>
                </div>
                <h3 className="mkt-contrast-title">8+ Hours of Tedious Manual Video Assembly</h3>
                <ul className="mkt-contrast-list">
                  <li className="mkt-contrast-item">
                    <X size={16} className="mkt-item-icon-bad" />
                    <span>
                      <strong>Inconsistent Characters:</strong> Protagonists change hair, age, and faces
                      between every single AI generated cut.
                    </span>
                  </li>
                  <li className="mkt-contrast-item">
                    <X size={16} className="mkt-item-icon-bad" />
                    <span>
                      <strong>Generic Stock Clutter:</strong> Spending hundreds of dollars on stock footage
                      libraries that viewers have already seen a thousand times.
                    </span>
                  </li>
                  <li className="mkt-contrast-item">
                    <X size={16} className="mkt-item-icon-bad" />
                    <span>
                      <strong>Manual Audio Keyframing:</strong> Drawing endless volume curves by hand to keep
                      music from drowning out your voiceover.
                    </span>
                  </li>
                  <li className="mkt-contrast-item">
                    <X size={16} className="mkt-item-icon-bad" />
                    <span>
                      <strong>Black-Box Frustration:</strong> Traditional AI video tools output one single video
                      file with zero timeline control or frame editing.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mkt-contrast-footer text-red-500">
                Result: Creator burnout, slow uploads, and inconsistent channel branding.
              </div>
            </div>

            {/* The Scenora Way */}
            <div className="mkt-contrast-card scenora-way">
              <div>
                <div className="mkt-contrast-badge good">
                  <Check size={14} />
                  <span>The ScenoraEdits Production System</span>
                </div>
                <h3 className="mkt-contrast-title">Under 30 Minutes from Script to 1080p Export</h3>
                <ul className="mkt-contrast-list">
                  <li className="mkt-contrast-item">
                    <Check size={16} className="mkt-item-icon-good" />
                    <span>
                      <strong>Video Bible™ Character Lock:</strong> Define your character once. Keep exact faces,
                      costumes, and artistic styling consistent across all scenes.
                    </span>
                  </li>
                  <li className="mkt-contrast-item">
                    <Check size={16} className="mkt-item-icon-good" />
                    <span>
                      <strong>AI Storyboard Intelligence:</strong> Automatically parses spoken narration into
                      timed scenes and generates cinematic, bespoke visual shots.
                    </span>
                  </li>
                  <li className="mkt-contrast-item">
                    <Check size={16} className="mkt-item-icon-good" />
                    <span>
                      <strong>Autonomous Audio Ducking:</strong> Intelligent audio DSP automatically lowers
                      background soundtracks whenever narration is active.
                    </span>
                  </li>
                  <li className="mkt-contrast-item">
                    <Check size={16} className="mkt-item-icon-good" />
                    <span>
                      <strong>Non-Destructive Studio Timeline:</strong> Swap single shots, adjust durations,
                      customize zoom speed, and regenerate without starting over.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mkt-contrast-footer text-emerald-500">
                Result: Predictable 10x production speed, cinematic aesthetics, and rapid channel growth.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. 4-STAGE PRODUCTION PIPELINE (HOW IT WORKS)
          ==================================================================== */}
      <section className="mkt-pipeline-section" id="how-it-works" aria-label="Pipeline">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div className="mkt-badge mkt-badge-blue">The 4-Stage Engine</div>
            <h2 className="mkt-section-title">How You Create YouTube Videos with ScenoraEdits</h2>
            <p className="mkt-section-subtitle">
              A frictionless workflow designed to take you from a raw voice memo or text script to a
              polished Full HD video ready for immediate upload.
            </p>
          </div>

          <div className="mkt-pipeline-grid">
            <div className="mkt-stage-card">
              <span className="mkt-stage-number">STAGE 01</span>
              <div className="mkt-stage-icon-wrap">
                <FileText size={24} />
              </div>
              <h4>Script &amp; Voiceover Ingestion</h4>
              <p>
                Paste your video script or upload existing narration audio. Our Whisper-driven acoustic
                pipeline segments your audio into natural narrative beats with word-level timestamps.
              </p>
            </div>

            <div className="mkt-stage-card">
              <span className="mkt-stage-number">STAGE 02</span>
              <div className="mkt-stage-icon-wrap">
                <Layers size={24} />
              </div>
              <h4>Video Bible™ Consistency</h4>
              <p>
                Lock your protagonist faces, costumes, lighting palettes, and camera lenses. Every subsequent
                scene references this unified source of truth to eliminate visual hallucinations.
              </p>
            </div>

            <div className="mkt-stage-card">
              <span className="mkt-stage-number">STAGE 03</span>
              <div className="mkt-stage-icon-wrap">
                <Volume2 size={24} />
              </div>
              <h4>Multi-Track Audio Ducking</h4>
              <p>
                Layer background music and ambient Foley. The audio engine automatically calculates volume
                envelopes, dropping music -14dB beneath spoken lines for broadcast clarity.
              </p>
            </div>

            <div className="mkt-stage-card">
              <span className="mkt-stage-number">STAGE 04</span>
              <div className="mkt-stage-icon-wrap">
                <Video size={24} />
              </div>
              <h4>Timeline Polish &amp; 1080p Export</h4>
              <p>
                Review shots in the multi-track studio timeline. Fine-tune camera motion, tweak captions,
                and export crisp 1080p 60fps MP4 masters ready for YouTube or Shorts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. FLAGSHIP BENTO GRID FEATURES
          ==================================================================== */}
      <section className="mkt-features-section" id="features" aria-label="Key Features">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div className="mkt-badge">Production Capabilities</div>
            <h2 className="mkt-section-title">Engineered Specifically for Modern Video Creators</h2>
            <p className="mkt-section-subtitle">
              Every feature inside ScenoraEdits exists to remove friction from long-form YouTube and viral
              short-form content creation.
            </p>
          </div>

          <div className="mkt-bento-grid">
            {/* Bento Card 1: Video Bible (Span 8) */}
            <div className="mkt-bento-card mkt-col-8">
              <div>
                <div className="mkt-bento-icon orange">
                  <ShieldCheck size={26} />
                </div>
                <h3>Video Bible™ Character Consistency Engine</h3>
                <p>
                  No more morphing faces or changing outfits between scenes. Lock your main characters,
                  art direction, lighting setups, and camera angles into a project-level registry. Every AI
                  generation strictly inherits your character anchors.
                </p>
              </div>
              <div className="mkt-bento-visual">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono mb-2">
                  <span>Character_ID: #VANCE_01</span>
                  <span className="text-emerald-500 font-bold">Face Match: 99.4%</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <img
                    src="/assets/hero_astronaut_main.jpg"
                    alt="Character Reference 1"
                    className="rounded-lg h-24 w-full object-cover border border-[var(--border)]"
                  />
                  <img
                    src="/assets/scene_2_profile.jpg"
                    alt="Character Reference 2"
                    className="rounded-lg h-24 w-full object-cover border border-[var(--border)]"
                  />
                  <img
                    src="/assets/scene_3_landscape.jpg"
                    alt="Character Reference 3"
                    className="rounded-lg h-24 w-full object-cover border border-[var(--border)]"
                  />
                </div>
              </div>
            </div>

            {/* Bento Card 2: Dual Rendering (Span 4) */}
            <div className="mkt-bento-card mkt-col-4">
              <div>
                <div className="mkt-bento-icon purple">
                  <Cpu size={26} />
                </div>
                <h3>Dual-Engine Compute</h3>
                <p>
                  Generate locally on your NVIDIA RTX GPU for 100% free, unlimited private renders, or burst
                  instantly to high-speed cloud clusters when working from laptops.
                </p>
              </div>
              <div className="mkt-bento-visual">
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <span className="font-semibold">Local NVIDIA RTX</span>
                    <span className="text-emerald-500 font-bold">Free / 0ms Ping</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <span className="font-semibold">Cloud GPU Cluster</span>
                    <span className="text-purple-500 font-bold">Ultra Fast 1080p</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Kinetic Captions (Span 4) */}
            <div className="mkt-bento-card mkt-col-4">
              <div>
                <div className="mkt-bento-icon blue">
                  <Type size={26} />
                </div>
                <h3>Kinetic Word-by-Word Captions</h3>
                <p>
                  Generate viral YouTube Shorts &amp; TikTok style dynamic subtitles with word-by-word
                  highlight animations, custom color grading, and emoji insertion.
                </p>
              </div>
              <div className="mkt-bento-visual text-center py-4">
                <span className="text-base font-bold tracking-wide uppercase bg-black text-white px-3 py-1.5 rounded">
                  THIS WILL <span className="text-[#FFC107] underline">CHANGE</span> EVERYTHING
                </span>
              </div>
            </div>

            {/* Bento Card 4: Audio Ducking (Span 4) */}
            <div className="mkt-bento-card mkt-col-4">
              <div>
                <div className="mkt-bento-icon green">
                  <Volume2 size={26} />
                </div>
                <h3>Intelligent Auto-Ducking</h3>
                <p>
                  Speech-aware digital signal processing attenuates musical tracks when narration speaks and
                  smoothly restores background volume during dramatic pauses.
                </p>
              </div>
              <div className="mkt-bento-visual text-xs flex items-center justify-between font-mono">
                <span>Music Attenuation:</span>
                <span className="text-emerald-500 font-bold">-14.2 dB Smooth</span>
              </div>
            </div>

            {/* Bento Card 5: 1-Click Multi-Aspect (Span 4) */}
            <div className="mkt-bento-card mkt-col-4">
              <div>
                <div className="mkt-bento-icon orange">
                  <Maximize2 size={26} />
                </div>
                <h3>1-Click 16:9 &amp; 9:16 Switching</h3>
                <p>
                  Convert wide landscape YouTube documentaries into vertical Shorts with smart focal-point
                  re-centering that keeps characters centered in every frame.
                </p>
              </div>
              <div className="mkt-bento-visual text-xs flex justify-around">
                <span className="px-3 py-1 rounded bg-[var(--surface)] border border-[var(--border)] font-semibold">
                  16:9 Landscape
                </span>
                <span className="px-3 py-1 rounded bg-[#FF6B00] text-white font-semibold">
                  9:16 Vertical
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. TARGET CREATOR NICHES
          ==================================================================== */}
      <section className="mkt-niches-section" id="niches" aria-label="Use Cases">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div className="mkt-badge mkt-badge-purple">Tailored Creator Workflows</div>
            <h2 className="mkt-section-title">Built for Your Specific Channel Format</h2>
            <p className="mkt-section-subtitle">
              Whether you run a deep-dive documentary channel or a high-velocity faceless shorts studio,
              ScenoraEdits optimizes for your exact publishing cadence.
            </p>
          </div>

          <div className="mkt-niches-grid">
            <div className="mkt-niche-card" id="niche-documentary">
              <span className="mkt-niche-pill">Long-Form Videos</span>
              <h4>YouTube Documentaries &amp; Lore</h4>
              <p>
                Atmospheric historical narratives, sci-fi worldbuilding, and investigative mysteries with
                continuous characters and mood lighting.
              </p>
              <ul className="mkt-niche-perks">
                <li><Check size={14} className="text-emerald-500" /> Continuous character faces</li>
                <li><Check size={14} className="text-emerald-500" /> Cinematic 35mm lighting</li>
                <li><Check size={14} className="text-emerald-500" /> 20+ minute chapter workflows</li>
              </ul>
            </div>

            <div className="mkt-niche-card" id="niche-faceless">
              <span className="mkt-niche-pill">Automation</span>
              <h4>Faceless YouTube Channels</h4>
              <p>
                Produce consistent weekly videos across finance, mythology, technology, and philosophy
                without ever needing to step in front of a camera.
              </p>
              <ul className="mkt-niche-perks">
                <li><Check size={14} className="text-emerald-500" /> Script-to-timeline automation</li>
                <li><Check size={14} className="text-emerald-500" /> Bespoke imagery (no stock)</li>
                <li><Check size={14} className="text-emerald-500" /> High creator retention rates</li>
              </ul>
            </div>

            <div className="mkt-niche-card" id="niche-shorts">
              <span className="mkt-niche-pill">High Retention</span>
              <h4>Viral Shorts &amp; TikTok Creators</h4>
              <p>
                Snappy 60-second vertical reels with kinetic subtitles, aggressive narrative hooks, and
                perfect pacing for the YouTube Shorts algorithm.
              </p>
              <ul className="mkt-niche-perks">
                <li><Check size={14} className="text-emerald-500" /> Word-by-word dynamic text</li>
                <li><Check size={14} className="text-emerald-500" /> Vertical 9:16 native render</li>
                <li><Check size={14} className="text-emerald-500" /> Punchy sound design ducking</li>
              </ul>
            </div>

            <div className="mkt-niche-card" id="niche-educational">
              <span className="mkt-niche-pill">Pedagogical</span>
              <h4>Explainer &amp; Education Channels</h4>
              <p>
                Transform complex technical tutorials, science phenomena, and case studies into clear,
                visually captivating step-by-step visual lessons.
              </p>
              <ul className="mkt-niche-perks">
                <li><Check size={14} className="text-emerald-500" /> Clear concept illustrations</li>
                <li><Check size={14} className="text-emerald-500" /> Synchronized voice timestamps</li>
                <li><Check size={14} className="text-emerald-500" /> Non-destructive scene edits</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. INTERACTIVE STORYBOARD SHOWCASE WIDGET
          ==================================================================== */}
      <section className="mkt-showcase-section" id="showcase" aria-label="Interactive Showcase">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div className="mkt-badge mkt-badge-blue">Live Studio Showcase</div>
            <h2 className="mkt-section-title">See ScenoraEdits in Action Across Genres</h2>
            <p className="mkt-section-subtitle">
              Select a genre below to inspect the actual script lines, prompt parameters, and visual outputs
              generated by the ScenoraEdits engine.
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
          8. COMPETITIVE MATRIX TABLE
          ==================================================================== */}
      <section className="mkt-compare-section" aria-label="Comparison Table">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div className="mkt-badge">The Clear Advantage</div>
            <h2 className="mkt-section-title">How ScenoraEdits Compares</h2>
            <p className="mkt-section-subtitle">
              See why high-volume YouTube creators choose ScenoraEdits over generic AI generators and
              traditional editing software.
            </p>
          </div>

          <div className="mkt-table-wrap">
            <table className="mkt-compare-table">
              <thead>
                <tr>
                  <th>Capability / Feature</th>
                  <th className="highlight">ScenoraEdits AI Studio</th>
                  <th>Generic AI Video Tools</th>
                  <th>Traditional Editors (Premiere/DaVinci)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Character Continuity across 20+ Scenes</strong>
                  </td>
                  <td className="highlight text-emerald-500 font-bold">
                    ✓ Video Bible™ 100% Consistency
                  </td>
                  <td className="text-red-500">✗ Random face changes</td>
                  <td>Manual actor filming only</td>
                </tr>
                <tr>
                  <td>
                    <strong>Voiceover &amp; Caption Beat Alignment</strong>
                  </td>
                  <td className="highlight text-emerald-500 font-bold">
                    ✓ Automatic Whisper Sync
                  </td>
                  <td>Limited / Inflexible</td>
                  <td>Manual manual slicing (hours)</td>
                </tr>
                <tr>
                  <td>
                    <strong>Automated Music Ducking</strong>
                  </td>
                  <td className="highlight text-emerald-500 font-bold">
                    ✓ Built-in DSP Auto-Duck
                  </td>
                  <td className="text-red-500">✗ None / Overbearing music</td>
                  <td>Manual keyframing curves</td>
                </tr>
                <tr>
                  <td>
                    <strong>Local RTX GPU Generation (Zero Cost)</strong>
                  </td>
                  <td className="highlight text-emerald-500 font-bold">
                    ✓ Unlimited Free Local GPU
                  </td>
                  <td className="text-red-500">✗ Expensive credit burn</td>
                  <td>N/A (No AI generation)</td>
                </tr>
                <tr>
                  <td>
                    <strong>Non-Destructive Scene Timeline Control</strong>
                  </td>
                  <td className="highlight text-emerald-500 font-bold">
                    ✓ Replace any frame or duration
                  </td>
                  <td className="text-red-500">✗ Black-box (regenerate all)</td>
                  <td>Full timeline (no AI workflow)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ====================================================================
          9. CREATOR TESTIMONIALS
          ==================================================================== */}
      <section className="mkt-testimonials-section" aria-label="Testimonials">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div className="mkt-badge mkt-badge-purple">Creator Validation</div>
            <h2 className="mkt-section-title">Loved by High-Velocity YouTube Creators</h2>
            <p className="mkt-section-subtitle">
              Hear from producers and channel owners who turned their script ideas into profitable, automated
              video channels.
            </p>
          </div>

          <div className="mkt-testimonials-grid">
            <div className="mkt-testimonial-card">
              <p className="mkt-quote-text">
                "The Video Bible feature changed everything for my history channel. In other AI tools, my
                protagonist looked like a completely different person in every scene. In ScenoraEdits,
                the armor, face, and aesthetic stayed 100% consistent across 40 scenes."
              </p>
              <div className="mkt-author-row">
                <div className="mkt-author-avatar">AT</div>
                <div>
                  <div className="mkt-author-name">Alex Thorne</div>
                  <div className="mkt-author-role">Chronicles of Rome (185K Subs)</div>
                </div>
              </div>
            </div>

            <div className="mkt-testimonial-card">
              <p className="mkt-quote-text">
                "I cut my production time from 14 hours down to 45 minutes per documentary. The automatic
                audio ducking and subtitle synchronization saves me endless hours in Premiere Pro. This is the
                single most practical tool for faceless creators."
              </p>
              <div className="mkt-author-row">
                <div className="mkt-author-avatar">DK</div>
                <div>
                  <div className="mkt-author-name">Devin K.</div>
                  <div className="mkt-author-role">Mythos Explained (310K Subs)</div>
                </div>
              </div>
            </div>

            <div className="mkt-testimonial-card">
              <p className="mkt-quote-text">
                "Being able to run scene generations locally on my RTX 4080 means I have zero monthly credit
                anxiety. When I need to render away from my desk, I burst to the cloud. Best of both worlds."
              </p>
              <div className="mkt-author-row">
                <div className="mkt-author-avatar">SM</div>
                <div>
                  <div className="mkt-author-name">Sarah Miller</div>
                  <div className="mkt-author-role">Tech Horizons Studio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. PRICING TEASER
          ==================================================================== */}
      <section className="mkt-pricing-teaser-section" id="pricing" aria-label="Pricing Overview">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div className="mkt-badge mkt-badge-blue">Transparent Plans</div>
            <h2 className="mkt-section-title">Start Free, Scale as Your Channel Grows</h2>
            <p className="mkt-section-subtitle">
              Zero surprises. Unlimited local GPU generation forever, or unlock priority cloud horsepower
              and advanced Video Bible capabilities.
            </p>
          </div>

          <div className="mkt-pricing-teaser-grid">
            {/* Free Starter Tier */}
            <div className="mkt-price-card">
              <div className="mkt-plan-name">Creator Starter</div>
              <div className="mkt-plan-desc">
                Ideal for trying out the timeline and running unlimited generations on your local GPU.
              </div>
              <div className="mkt-price-amount">
                $0 <span className="mkt-price-sub">/ free forever</span>
              </div>
              <ul className="mkt-plan-features">
                <li>
                  <Check size={16} />
                  <span>Unlimited local RTX GPU generations</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>5 monthly cloud fast generations</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Full HD 1080p video exports</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Basic Video Bible character lock</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/app")}
                className="mkt-btn-secondary w-full justify-center"
              >
                Start Free
              </button>
            </div>

            {/* Creator Pro Tier */}
            <div className="mkt-price-card featured">
              <span className="mkt-price-badge">Most Popular</span>
              <div className="mkt-plan-name">Creator Pro (Yearly)</div>
              <div className="mkt-plan-desc">
                For serious creators and channels needing cloud rendering speed and continuous production.
              </div>
              <div className="mkt-price-amount">
                $49 <span className="mkt-price-sub">/ full year ($4.08/mo)</span>
              </div>
              <ul className="mkt-plan-features">
                <li>
                  <Check size={16} />
                  <span>Unlimited priority cloud GPU generation</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Full Video Bible character persistence suite</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Advanced speech auto-ducking &amp; sound effects</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Multi-aspect ratio 16:9 and 9:16 export</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Full commercial rights for YouTube monetization</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/pricing")}
                className="mkt-btn-primary w-full justify-center"
              >
                <span>Upgrade to Creator Pro</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          11. SEO FAQ ACCORDION SECTION
          ==================================================================== */}
      <section className="mkt-faq-section" id="faq" aria-label="Frequently Asked Questions">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div className="mkt-badge">Got Questions?</div>
            <h2 className="mkt-section-title">Frequently Asked Questions</h2>
            <p className="mkt-section-subtitle">
              Everything you need to know about ScenoraEdits, character consistency, monetization, and
              hardware requirements.
            </p>
          </div>

          <div className="mkt-faq-list">
            {[
              {
                q: "Can I monetize YouTube videos made with ScenoraEdits?",
                a: "Yes, 100%. All videos exported from ScenoraEdits carry full commercial rights. You own the complete copyright to your produced videos and can monetize them across YouTube Ads, brand sponsorships, TikTok Creator Rewards, and Facebook Reels.",
              },
              {
                q: "How does the Video Bible ensure characters look identical across scenes?",
                a: "The Video Bible engine locks reference image seeds, physical descriptions, costume anchors, and lighting styles into a persistent project database. When generating each new scene, ScenoraEdits injects these exact anchor parameters into the diffusion model to ensure facial likeness and character details remain uniform.",
              },
              {
                q: "Can I use my own voiceover recordings or generate AI voiceovers?",
                a: "You can do both. You can upload pre-recorded MP3/WAV narration files from professional voice actors or record directly into the studio. Alternatively, you can use built-in AI voice models to generate voiceovers directly from your text script.",
              },
              {
                q: "Do I need an expensive graphics card to run ScenoraEdits?",
                a: "Not at all. ScenoraEdits features a hybrid compute architecture. If you have an NVIDIA RTX GPU, you can connect your local machine to render for free. If you are on a Mac, Chromebook, or ultrabook without a dedicated GPU, our cloud GPU clusters will render all scenes and timeline videos in the cloud seamlessly.",
              },
              {
                q: "What video resolutions and aspect ratios can I export?",
                a: "ScenoraEdits exports Full HD 1080p (1920x1080) at 30fps and 60fps in standard MP4 (H.264 / AAC) format. You can also export vertical 9:16 (1080x1920) for YouTube Shorts, Instagram Reels, and TikTok with a single click.",
              },
              {
                q: "Can I edit individual scenes without regenerating the whole video?",
                a: "Yes! Unlike primitive text-to-video black-box tools, ScenoraEdits provides a full multi-track studio timeline. You can adjust scene start/end times, swap visual prompts, re-roll single frames with custom seeds, change audio tracks, and preview edits in real time before exporting.",
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="mkt-faq-item">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="mkt-faq-question"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-[#FF6B00] shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-[var(--text-muted)] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="mkt-faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          12. HIGH-CONVERTING BOTTOM CTA BANNER
          ==================================================================== */}
      <section className="mkt-cta-banner-section" aria-label="Get Started">
        <div className="mkt-container">
          <div className="mkt-cta-banner">
            <h2>Turn Your Video Ideas into Polished YouTube Content Today</h2>
            <p>
              Join thousands of creators, faceless channel owners, and media studios automating their
              video production workflow with ScenoraEdits.
            </p>

            <div className="mkt-cta-actions">
              <button
                onClick={() => navigate("/app")}
                className="mkt-btn-primary"
                id="bottom-primary-cta"
              >
                <span>Create Your First Video Free</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => navigate("/pricing")}
                className="mkt-btn-secondary"
                id="bottom-pricing-cta"
              >
                <span>View All Plans</span>
              </button>
            </div>

            <div className="mkt-cta-subtext">
              <span>✓ Instant browser studio access</span>
              <span>✓ No credit card required</span>
              <span>✓ 100% Commercial YouTube rights</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
