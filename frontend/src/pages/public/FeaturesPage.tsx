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
  Volume2,
  Cpu,
  ChevronDown,
  ChevronUp,
  Zap,
  Film,
  FileText,
  Maximize2,
  Type,
  Sliders,
  Play,
  HardDrive,
  Cloud,
} from "lucide-react";

export const FeaturesPage: React.FC = () => {
  const { navigate } = useRouter();

  useSEO({
    title: "Features — ScenoraEdits Complete AI Video Pipeline & Timeline Studio",
    description:
      "Explore the full ScenoraEdits production suite: acoustic voice parsing, Video Bible character consistency, multi-track timeline editor, local RTX acceleration, and Full HD 1080p export.",
    canonical: "https://scenoraedits.web.app/features",
    ogTitle: "Features — ScenoraEdits Complete AI Video Pipeline",
    ogDescription:
      "Acoustic script parsing, Video Bible character continuity, multi-track studio timeline, and intelligent audio ducking built for YouTube creators.",
  });

  // Interactive Sub-nav Active State
  const [activeNav, setActiveNav] = useState<string>("storyboard");

  // Aspect Ratio Switcher State
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  // Interactive Workflow Simulator State
  const [activeWorkflow, setActiveWorkflow] = useState<"documentary" | "shorts" | "explainer">("documentary");

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="feat-page">
      {/* ====================================================================
          1. HERO SECTION & PRODUCTION SUITE OVERVIEW
          ==================================================================== */}
      <section className="feat-hero-section" aria-label="Features Overview">
        <div className="feat-container">
          <div className="feat-hero-badge">
            <Sparkles size={14} className="text-[#FF6B00]" />
            <span>The Complete AI Video Production Suite</span>
          </div>

          <h1 className="feat-hero-h1">
            Every Tool You Need to Turn Scripts into{" "}
            <span className="feat-gradient-text">High-Retention YouTube Videos</span>
          </h1>

          <p className="feat-hero-lead">
            ScenoraEdits replaces disjointed editing tools with a unified creative pipeline. Coordinate
            acoustic script parsing, lock character faces with Video Bible™, balance multi-track audio,
            and edit on a full non-destructive timeline.
          </p>

          <div className="feat-hero-actions">
            <button
              onClick={() => navigate("/app")}
              className="feat-btn-primary"
              id="features-primary-cta"
            >
              <span>Open Studio &amp; Create Free</span>
              <ArrowRight size={17} />
            </button>

            <a href="#specs" className="feat-btn-secondary" id="features-specs-cta">
              <Sliders size={16} />
              <span>View Technical Specifications</span>
            </a>
          </div>
        </div>
      </section>

      {/* STICKY IN-PAGE JUMP NAVIGATOR */}
      <nav className="feat-subnav-sticky" aria-label="Feature Quick Navigation">
        <div className="feat-container">
          <div className="feat-subnav-list">
            {[
              { id: "storyboard", label: "01. Storyboard Intelligence" },
              { id: "videobible", label: "02. Video Bible™ Engine" },
              { id: "timeline", label: "03. Multi-Track Timeline" },
              { id: "audiodsp", label: "04. Audio DSP & Ducking" },
              { id: "compute", label: "05. Dual Compute (RTX & Cloud)" },
              { id: "aspect", label: "06. Multi-Aspect Framing" },
              { id: "specs", label: "07. Technical Specs" },
              { id: "workflows", label: "08. Workflow Simulator" },
              { id: "faq", label: "09. Features FAQ" },
            ].map((item) => (
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
          2. DEEP DIVE 1: ACOUSTIC SCRIPT-TO-STORYBOARD INTELLIGENCE
          ==================================================================== */}
      <section className="feat-pillar-section alt-bg" id="storyboard" aria-label="Storyboard Intelligence">
        <div className="feat-container">
          <div className="feat-pillar-row">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <FileText size={14} />
                <span>Pillar 01 • Acoustic Intelligence</span>
              </div>
              <h2 className="feat-pillar-title">Spoken Audio Transcription &amp; Automatic Beat Segmentation</h2>
              <p className="feat-pillar-desc">
                Stop estimating shot durations manually. Upload a voiceover recording or paste your script, and
                our Whisper acoustic engine detects natural cadence pauses to automatically cut your story into
                timed visual beats.
              </p>
              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Word-Level Acoustic Alignment:</strong> Every scene boundary matches exact speech
                    timestamps for seamless audio-to-visual continuity.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Cinematic Prompt Synthesis:</strong> AI automatically enriches narrative sentences
                    with camera lenses (35mm, 85mm), volumetric lighting, and depth-of-field rules.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Instant Seed Locking:</strong> Lock specific visual interpretations while adjusting
                    the pacing or words in your script.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box">
              <div className="feat-acoustic-flow">
                <div className="feat-flow-step">
                  <div className="feat-flow-header">
                    <span>Step 1: Spoken Audio Input</span>
                    <span className="font-mono text-[10px] text-emerald-500">Whisper 99.8% Sync</span>
                  </div>
                  <div className="feat-flow-text">
                    "Deep beneath the Martian permafrost, the drills uncovered something unexpected..."
                  </div>
                </div>

                <div className="feat-flow-step">
                  <div className="feat-flow-header">
                    <span>Step 2: Acoustic Beat Detection</span>
                    <span className="font-mono text-[10px] text-[#FF6B00]">00:00 - 00:05.40</span>
                  </div>
                  <div className="feat-flow-text">
                    Detected natural breath pause at 05.40s. Segmented into Scene 01.
                  </div>
                </div>

                <div className="feat-flow-step">
                  <div className="feat-flow-header">
                    <span>Step 3: Synthesized Visual Blueprint</span>
                    <span className="font-mono text-[10px] text-purple-500">ARRI Alexa 35mm</span>
                  </div>
                  <div className="feat-flow-prompt">
                    cinematic underground ice cavern, industrial thermal drills piercing blue glacier walls, volumetric steam, amber worklights --seed 948120 --aspect 16:9
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. DEEP DIVE 2: VIDEO BIBLE™ CHARACTER & STYLE CONTINUITY
          ==================================================================== */}
      <section className="feat-pillar-section" id="videobible" aria-label="Video Bible Engine">
        <div className="feat-container">
          <div className="feat-pillar-row reverse">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <ShieldCheck size={14} />
                <span>Pillar 02 • Visual Persistence</span>
              </div>
              <h2 className="feat-pillar-title">100% Character Consistency Across 50+ Scenes</h2>
              <p className="feat-pillar-desc">
                The primary flaw of generic AI tools is characters that change faces and clothes every shot.
                Video Bible™ establishes a permanent character anchor database that every scene generation
                strictly obeys.
              </p>
              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Facial Seed &amp; Bone Structure Pinning:</strong> Keeps facial proportions, hair color,
                    and age identical across wide shots, close-ups, and action cuts.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Wardrobe &amp; Prop Permanence:</strong> Uniforms, suits, and recurring props stay
                    intact from opening exposition to the final frame.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Unified Film Stock Texture:</strong> Consistent color grading, film grain, and lighting
                    rules create the illusion of a single physical camera shoot.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box">
              <div className="feat-char-inspector">
                <div className="feat-char-header">
                  <div className="feat-char-meta">
                    <h4>Captain Vance (EVA Spec)</h4>
                    <span>✓ Video Bible™ Lock Active</span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--surface-alt)] border border-[var(--border)]">
                    Seed: #8492041
                  </span>
                </div>

                <div className="text-xs text-[var(--text-secondary)] mb-2">
                  Cross-Scene Continuity Verification:
                </div>

                <div className="feat-char-grid">
                  <div className="feat-char-shot">
                    <img src="/assets/hero_astronaut_main.jpg" alt="Scene 01 Close Up" />
                    <div className="feat-char-shot-label">Scene 1 • Close-Up</div>
                  </div>
                  <div className="feat-char-shot">
                    <img src="/assets/scene_2_profile.jpg" alt="Scene 02 Cockpit Profile" />
                    <div className="feat-char-shot-label">Scene 2 • Profile</div>
                  </div>
                  <div className="feat-char-shot">
                    <img src="/assets/scene_3_landscape.jpg" alt="Scene 03 Planet Wide" />
                    <div className="feat-char-shot-label">Scene 3 • Extreme Wide</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. DEEP DIVE 3: MULTI-TRACK NON-DESTRUCTIVE STUDIO TIMELINE
          ==================================================================== */}
      <section className="feat-pillar-section alt-bg" id="timeline" aria-label="Studio Timeline">
        <div className="feat-container">
          <div className="feat-pillar-row">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <Layers size={14} />
                <span>Pillar 03 • Editorial Control</span>
              </div>
              <h2 className="feat-pillar-title">Multi-Track Non-Destructive Studio Timeline</h2>
              <p className="feat-pillar-desc">
                Don't settle for "one-click" generators that lock you out of editing. ScenoraEdits gives you
                a full multi-track NLE timeline where every visual shot, audio stem, and subtitle layer remains
                completely editable.
              </p>
              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Non-Destructive Trimming:</strong> Adjust durations, slip new keyframes into place,
                    or reorder scenes with drag-and-drop simplicity.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Cinematic Pan &amp; Zoom (Ken Burns):</strong> Bring static visuals to life with
                    directional camera push-ins, slow pulls, and tracking movements.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>In-Place Frame Re-Roll:</strong> Regenerate single shots with customized prompts
                    without touching or re-rendering the rest of the timeline.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box">
              <div className="feat-timeline-layers">
                <div className="feat-timeline-track">
                  <div className="feat-track-name text-[#FF6B00]">
                    <Film size={14} />
                    <span>Video V1</span>
                  </div>
                  <div className="feat-track-blocks">
                    <div className="feat-block-seg video" title="Scene 01" />
                    <div className="feat-block-seg video" title="Scene 02" />
                    <div className="feat-block-seg video" title="Scene 03" />
                  </div>
                  <span className="feat-track-status">Ken Burns Push</span>
                </div>

                <div className="feat-timeline-track">
                  <div className="feat-track-name text-blue-500">
                    <Volume2 size={14} />
                    <span>Voiceover A1</span>
                  </div>
                  <div className="feat-track-blocks">
                    <div className="feat-block-seg speech" />
                    <div className="feat-block-seg speech" />
                    <div className="feat-block-seg speech" />
                  </div>
                  <span className="feat-track-status">Whisper Synced</span>
                </div>

                <div className="feat-timeline-track">
                  <div className="feat-track-name text-purple-500">
                    <Zap size={14} />
                    <span>Score A2</span>
                  </div>
                  <div className="feat-track-blocks">
                    <div className="feat-block-seg music" style={{ flex: 3 }} />
                  </div>
                  <span className="feat-track-status">-14dB Auto-Duck</span>
                </div>

                <div className="feat-timeline-track">
                  <div className="feat-track-name text-emerald-500">
                    <Type size={14} />
                    <span>Captions T1</span>
                  </div>
                  <div className="feat-track-blocks">
                    <div className="feat-block-seg captions" />
                    <div className="feat-block-seg captions" />
                    <div className="feat-block-seg captions" />
                  </div>
                  <span className="feat-track-status">Kinetic Subtitles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. DEEP DIVE 4: AUDIO DSP, DUCKING & KINETIC CAPTIONS
          ==================================================================== */}
      <section className="feat-pillar-section" id="audiodsp" aria-label="Audio DSP and Ducking">
        <div className="feat-container">
          <div className="feat-pillar-row reverse">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <Volume2 size={14} />
                <span>Pillar 04 • Audio &amp; Typography</span>
              </div>
              <h2 className="feat-pillar-title">Speech-Aware Audio Ducking &amp; Animated Kinetic Captions</h2>
              <p className="feat-pillar-desc">
                High YouTube viewer retention requires pristine sound mixing and punchy visual subtitles.
                ScenoraEdits calculates digital volume envelopes to dynamically attenuate background music
                and renders word-by-word highlighted captions.
              </p>
              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Autonomous Volume Attenuation:</strong> Drops music -14dB during speech with 50ms
                    attack and 250ms release for broadcast clarity without manual keyframing.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Shorts &amp; TikTok Kinetic Presets:</strong> Animated word-by-word highlights,
                    custom color grading, and text shadows that boost viewer watch time.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Multi-Stem Mixing:</strong> Separate audio channels for voiceover, sound effects,
                    and music tracks for full post-production balance.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box text-center">
              <div className="p-6 rounded-xl bg-black text-white flex flex-col items-center justify-center gap-4">
                <div className="text-xs font-mono text-[#FF6B00] uppercase tracking-wider">
                  Live Caption Simulation
                </div>
                <div className="text-xl font-bold tracking-wide">
                  <span>THE TELEMETRY </span>
                  <span className="text-[#FFC107] underline bg-white/10 px-2 py-1 rounded">LOCKED ONTO</span>
                  <span> COORDINATES</span>
                </div>
                <div className="w-full pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span>Speech Detected: Active</span>
                  <span className="text-emerald-400">Music Ducking: -14.2dB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. DEEP DIVE 5: DUAL-ENGINE HYBRID COMPUTE
          ==================================================================== */}
      <section className="feat-pillar-section alt-bg" id="compute" aria-label="Dual Compute Architecture">
        <div className="feat-container">
          <div className="feat-pillar-row">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <Cpu size={14} />
                <span>Pillar 05 • Hybrid Compute</span>
              </div>
              <h2 className="feat-pillar-title">Zero-Cost Local RTX Rendering or High-Speed Cloud Bursts</h2>
              <p className="feat-pillar-desc">
                Choose the exact compute model that fits your hardware. Connect your local NVIDIA RTX GPU to
                generate unlimited scenes for free with zero credit burn, or burst to our serverless cloud
                clusters when working from laptops.
              </p>
              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>NVIDIA CUDA Acceleration:</strong> Optimized for RTX 3060, 4070, 4080, 4090 GPUs
                    with sub-second local diffusion iteration.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Total Media Privacy:</strong> When running locally, your voiceovers, scripts, and
                    image masters never leave your physical storage drive.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Serverless Cloud Bursting:</strong> Instant priority rendering for macOS users,
                    ultrabooks, and remote field work.
                  </span>
                </li>
              </ul>
            </div>

            <div className="feat-visual-box">
              <div className="feat-compute-grid">
                <div className="feat-compute-card">
                  <div className="feat-compute-icon local">
                    <HardDrive size={22} />
                  </div>
                  <h5>Local RTX GPU Engine</h5>
                  <p>
                    Unlimited generations • 100% Free • Direct CUDA execution • Local disk storage.
                  </p>
                </div>

                <div className="feat-compute-card">
                  <div className="feat-compute-icon cloud">
                    <Cloud size={22} />
                  </div>
                  <h5>Cloud GPU Fleet</h5>
                  <p>
                    High-speed cloud clusters • Works on any browser &amp; Mac • Zero GPU hardware required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. DEEP DIVE 6: MULTI-ASPECT FRAMING & 1080P EXPORT
          ==================================================================== */}
      <section className="feat-pillar-section" id="aspect" aria-label="Aspect Framing and Export">
        <div className="feat-container">
          <div className="feat-pillar-row reverse">
            <div className="feat-pillar-text">
              <div className="feat-pillar-badge">
                <Maximize2 size={14} />
                <span>Pillar 06 • Multi-Platform Master</span>
              </div>
              <h2 className="feat-pillar-title">1-Click 16:9 Landscape &amp; 9:16 Shorts Framing</h2>
              <p className="feat-pillar-desc">
                Repurpose long-form YouTube documentaries into viral vertical Shorts and Reels without manual
                cropping. Smart subject centering locks the visual focal point directly onto your main character.
              </p>
              <ul className="feat-perks-list">
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>Focal Point Re-Centering:</strong> Keeps the protagonist centered in the 9:16 vertical
                    viewport without awkward cutoff.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>1080p 60fps Broadcast Export:</strong> Industry-standard MP4 (H.264 / AAC) files
                    ready for immediate YouTube channel upload.
                  </span>
                </li>
                <li className="feat-perk-item">
                  <CheckCircle2 size={16} className="feat-perk-icon" />
                  <span>
                    <strong>100% Commercial Monetization Rights:</strong> Zero watermarks, full commercial
                    ownership across YouTube Ads and brand deals.
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
                  maxWidth: aspectRatio === "9:16" ? "240px" : "100%",
                  aspectRatio: aspectRatio === "9:16" ? "9 / 16" : "16 / 9",
                }}
              >
                <img
                  src="/assets/hero_astronaut_main.jpg"
                  alt="Multi-Aspect Demonstration"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. TECHNICAL SPECIFICATIONS MATRIX
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
                    WAV (16/24-bit PCM), MP3 (up to 320kbps), M4A, FLAC, OGG. Direct in-browser microphone recording.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Acoustic Transcription Engine</td>
                  <td className="feat-spec-val">
                    OpenAI Whisper with word-level phonetic alignment and automated breath/pause segmentation.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Video Bible™ Character Memory</td>
                  <td className="feat-spec-val">
                    Seed pinning, facial feature vectors, wardrobe tags, lighting temperature, and persistent LoRA anchors.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Timeline Resolution &amp; Frame Rates</td>
                  <td className="feat-spec-val">
                    Full HD 1080p (1920x1080) Landscape, 1080x1920 Vertical Shorts, 1:1 Square. 24fps, 30fps, 60fps.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Audio DSP &amp; Ducking Envelope</td>
                  <td className="feat-spec-val">
                    Configurable -10dB to -18dB attenuation, 50ms smooth attack curve, 250ms release curve.
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Compute &amp; Hardware Support</td>
                  <td className="feat-spec-val">
                    Local NVIDIA RTX 30/40 Series (CUDA 12+) or Serverless Cloud GPU Clusters (RTX 4090 / A100).
                  </td>
                </tr>
                <tr>
                  <td className="feat-spec-key">Export Codecs &amp; Containers</td>
                  <td className="feat-spec-val">
                    MP4 (H.264 High Profile / AAC 48kHz Stereo), Standalone SRT &amp; VTT Subtitle file downloads.
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
          9. INTERACTIVE CREATOR WORKFLOW SIMULATOR
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
                    <p>Ambient war horns and rain Foley auto-ducked -16dB beneath narrator voiceover.</p>
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
                    9:16 Vertical Master
                  </span>
                </div>

                <div className="feat-sim-steps-grid">
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 01</span>
                    <h5>Hook Optimization</h5>
                    <p>AI emphasizes first 3 seconds with aggressive visual framing and high-energy motion.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 02</span>
                    <h5>Kinetic Typography</h5>
                    <p>Animated word-by-word highlighted text rendered directly into 9:16 vertical crop.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 03</span>
                    <h5>1-Click 60fps Export</h5>
                    <p>Rendered at 1080x1920 60fps for maximum algorithmic recommendation priority.</p>
                  </div>
                </div>
              </div>
            )}

            {activeWorkflow === "explainer" && (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text)]">
                      The Pedagogical Explainer &amp; Tutorial Workflow
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Target: Chaptered lessons • Concept illustrations • Precision speech alignment
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#FF6B00] px-3 py-1 rounded bg-[rgba(255,107,0,0.1)]">
                    Chaptered 1080p
                  </span>
                </div>

                <div className="feat-sim-steps-grid">
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 01</span>
                    <h5>Concept Diagrams</h5>
                    <p>Complex technical concepts visualized into clear, memorable visual metaphors.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 02</span>
                    <h5>Non-Destructive Adjust</h5>
                    <p>Tweak duration handles to match pacing adjustments without re-rendering scenes.</p>
                  </div>
                  <div className="feat-sim-step-item">
                    <span className="feat-sim-step-num">STAGE 03</span>
                    <h5>SRT Subtitle Export</h5>
                    <p>Download clean SRT files for YouTube search indexation and multi-language translation.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. TECHNICAL FEATURES FAQ
          ==================================================================== */}
      <section className="feat-faq-section" id="faq" aria-label="Technical FAQ">
        <div className="feat-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="feat-pillar-badge">
              <Sparkles size={14} />
              <span>Answers for Creators</span>
            </div>
            <h2 className="feat-pillar-title">Technical Features FAQ</h2>
            <p className="feat-pillar-desc">
              Detailed answers on how Video Bible, local GPU acceleration, and timeline controls work.
            </p>
          </div>

          <div className="feat-faq-list">
            {[
              {
                q: "How does the Video Bible prevent character faces from changing?",
                a: "The Video Bible engine locks mathematical seed anchors, facial feature vectors, wardrobe tags, and lighting temperature into a project-level registry. When synthesizing each new scene, ScenoraEdits injects these exact anchor parameters into the diffusion model to ensure facial bone structure and wardrobe details remain uniform.",
              },
              {
                q: "How does the local RTX runner connect to the web studio?",
                a: "ScenoraEdits provides a lightweight local daemon that communicates securely with your browser via local WebSocket (localhost:8000). The web interface serves as your control surface, while generation compute happens directly on your NVIDIA GPU without uploading media to external servers.",
              },
              {
                q: "Can I import my own background music and sound effects?",
                a: "Yes. You can upload custom MP3 or WAV audio tracks directly into the multi-track timeline. The intelligent auto-ducking engine automatically calculates volume envelopes across your uploaded music stems.",
              },
              {
                q: "Can I adjust scene durations and camera movements manually?",
                a: "Absolutely. The multi-track studio timeline allows you to drag scene duration handles, change camera pan-and-zoom speed, or re-order scenes with standard non-destructive video editing controls.",
              },
              {
                q: "What happens if I need to re-render just one shot in a 30-scene project?",
                a: "With our non-destructive timeline, you can re-roll any individual frame with a new prompt or seed in isolation. Your audio tracks, captions, and other 29 scenes remain completely untouched.",
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="feat-faq-item">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="feat-faq-question"
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
                    <div className="feat-faq-answer">
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
          11. HIGH-CONVERTING BOTTOM CTA BANNER
          ==================================================================== */}
      <section className="feat-cta-section" aria-label="Get Started">
        <div className="feat-container">
          <div className="feat-cta-banner">
            <h2>Ready to Build Your Video Production Pipeline?</h2>
            <p>
              Join thousands of creators, faceless channel owners, and media studios automating their
              video production workflow with ScenoraEdits.
            </p>

            <div className="feat-cta-actions">
              <button
                onClick={() => navigate("/app")}
                className="feat-btn-primary"
                id="features-bottom-primary-cta"
              >
                <span>Launch Studio &amp; Create Free</span>
                <ArrowRight size={17} />
              </button>

              <button
                onClick={() => navigate("/pricing")}
                className="feat-btn-secondary"
                id="features-bottom-pricing-cta"
              >
                <span>View Transparent Pricing</span>
              </button>
            </div>

            <div className="feat-cta-subtext">
              <span>✓ Instant browser studio access</span>
              <span>✓ Unlimited local RTX GPU generations</span>
              <span>✓ 100% Commercial YouTube rights</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
