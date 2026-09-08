import React, { useState } from "react";
import { useRouter } from "../../router/Router";
import { useSEO } from "../../utils/seo";
import "./HowItWorksPage.css";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Volume2,
  Film,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  Check,
  X,
  Mic,
  UploadCloud,
  Play,
} from "lucide-react";

export const HowItWorksPage: React.FC = () => {
  const { navigate } = useRouter();

  useSEO({
    title: "How It Works — ScenoraEdits 5-Stage AI Video Production Pipeline",
    description:
      "From raw script or voiceover audio to finished 1080p YouTube video in under 30 minutes. Learn how ScenoraEdits automates speech transcription, character continuity, storyboarding, audio ducking, and timeline mastering.",
    canonical: "https://scenoraedits.web.app/how-it-works",
    ogTitle: "How ScenoraEdits Works — 5-Stage AI Video Pipeline",
    ogDescription:
      "Step-by-step production tour: voiceover parsing, Video Bible character locking, AI storyboarding, multi-track audio ducking, and 1080p export.",
  });

  // Active Stage Navigation
  const [activeStageNav, setActiveStageNav] = useState<number>(1);

  // Stage 1 Ingestion Simulator Tab ("audio" vs "script")
  const [ingestionTab, setIngestionTab] = useState<"audio" | "script">("audio");

  // Stage 5 Aspect Ratio Switcher ("16:9" vs "9:16")
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="hiw-page">
      {/* ====================================================================
          1. HERO SECTION & PIPELINE OVERVIEW
          ==================================================================== */}
      <section className="hiw-hero-section" aria-label="Production Overview">
        <div className="hiw-container">
          <div className="hiw-badge">
            <Sparkles size={14} className="text-[#FF6B00]" />
            <span>The End-to-End Production Pipeline</span>
          </div>

          <h1 className="hiw-hero-h1">
            From Raw Script to Polished YouTube Video in{" "}
            <span className="hiw-gradient-text">5 Controlled Steps</span>
          </h1>

          <p className="hiw-hero-lead">
            Experience complete transparency into modern AI video creation. Learn how voiceover parsing,
            Video Bible™ character persistence, automated storyboarding, and timeline mastering combine
            to ship broadcast-ready YouTube videos in under 30 minutes.
          </p>

          <div className="hiw-velocity-strip">
            <span className="hiw-velocity-pill">
              <Clock size={16} className="text-[#FF6B00]" />
              <span>Avg Production Time: 25–35 Mins</span>
            </span>
            <span className="hiw-velocity-pill">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Character Continuity: 100% Locked</span>
            </span>
            <span className="hiw-velocity-pill">
              <Zap size={16} className="text-purple-500" />
              <span>Free Local RTX or Fast Cloud</span>
            </span>
          </div>

          <div className="hiw-hero-actions">
            <button
              onClick={() => navigate("/app")}
              className="hiw-btn-primary"
              id="hiw-hero-primary-cta"
            >
              <span>Start Your First Project Free</span>
              <ArrowRight size={17} />
            </button>

            <a href="#stage-1" className="hiw-btn-secondary" id="hiw-hero-secondary-cta">
              <Play size={15} />
              <span>Explore Stage 1 (Ingestion)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. INTERACTIVE 5-STAGE PROGRESS STEPPER BAR
          ==================================================================== */}
      <nav className="hiw-stepper-sticky" aria-label="Pipeline Stage Selector">
        <div className="hiw-container">
          <div className="hiw-stepper-list">
            {[
              { num: 1, id: "stage-1", label: "01. Ingestion" },
              { num: 2, id: "stage-2", label: "02. Video Bible™ Lock" },
              { num: 3, id: "stage-3", label: "03. Storyboard Synthesis" },
              { num: 4, id: "stage-4", label: "04. Audio DSP & Ducking" },
              { num: 5, id: "stage-5", label: "05. Studio Timeline Polish" },
              { num: 6, id: "audit", label: "Time Audit" },
              { num: 7, id: "faq", label: "Pipeline FAQ" },
            ].map((stage) => (
              <a
                key={stage.id}
                href={`#${stage.id}`}
                onClick={() => setActiveStageNav(stage.num)}
                className={`hiw-step-pill ${activeStageNav === stage.num ? "active" : ""}`}
              >
                <span>{stage.label}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ====================================================================
          3. STAGE 01: SCRIPT & VOICEOVER INGESTION
          ==================================================================== */}
      <section className="hiw-stage-section alt-bg" id="stage-1" aria-label="Stage 1 Ingestion">
        <div className="hiw-container">
          <div className="hiw-stage-grid">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <FileText size={15} />
                <span>Stage 01 • Acoustic Ingestion</span>
              </div>
              <h2 className="hiw-stage-title">Acoustic Speech Transcription &amp; Natural Pause Detection</h2>
              <p className="hiw-stage-desc">
                Every video begins with your story. Whether you upload a recorded voiceover file or paste a
                written script, our Whisper acoustic pipeline parses phonetics to identify natural narrative
                pauses and automatically cuts your video into timed visual scenes.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Word-Level Phonetic Alignment:</strong> Scene markers lock to exact word endings
                    so camera cuts feel organic rather than jarring.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Adjustable Pause Threshold:</strong> Fine-tune rhythm sensitivity from fast-paced
                    Shorts (0.4s pause) to cinematic documentary pacing (1.2s pause).
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Built-In Narration Engine:</strong> Don't have a voiceover yet? Generate natural,
                    nuanced AI narration in multiple languages and tones directly from text.
                  </span>
                </li>
              </ul>
            </div>

            <div className="hiw-interactive-card">
              <div className="hiw-tab-group">
                <button
                  onClick={() => setIngestionTab("audio")}
                  className={`hiw-tab-btn ${ingestionTab === "audio" ? "active" : ""}`}
                >
                  <Mic size={14} />
                  <span>Upload Voiceover Audio</span>
                </button>
                <button
                  onClick={() => setIngestionTab("script")}
                  className={`hiw-tab-btn ${ingestionTab === "script" ? "active" : ""}`}
                >
                  <FileText size={14} />
                  <span>Paste Text Script</span>
                </button>
              </div>

              {ingestionTab === "audio" ? (
                <div className="hiw-sim-panel">
                  <div className="flex items-center justify-between text-xs font-mono text-[#FF6B00] mb-3">
                    <span className="flex items-center gap-1.5">
                      <UploadCloud size={14} />
                      <span>narration_master_v2.wav (14.2 MB)</span>
                    </span>
                    <span className="text-emerald-500 font-bold">Processed in 12s</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-alt)] p-3 rounded-lg border border-[var(--border)] font-mono">
                    [00:00.00] &quot;Deep within the Orion Nebula...&quot; <br />
                    [00:05.40] &lt;pause 0.8s&gt; <span className="text-[#FF6B00]">--&gt; Split into Scene 01</span><br />
                    [00:06.20] &quot;Captain Vance locked coordinates onto the anomaly...&quot;<br />
                    [00:13.90] &lt;pause 0.6s&gt; <span className="text-[#FF6B00]">--&gt; Split into Scene 02</span>
                  </p>
                </div>
              ) : (
                <div className="hiw-sim-panel">
                  <div className="flex items-center justify-between text-xs font-mono text-purple-500 mb-3">
                    <span>AI Voiceover Synthesis: Narrator Male (Deep Doc)</span>
                    <span className="text-emerald-500 font-bold">248 Words</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-alt)] p-3 rounded-lg border border-[var(--border)]">
                    &quot;The year was 9 AD. Deep within the damp Germanic forests, three Roman legions marched
                    toward a destiny that would reshape imperial borders forever...&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. STAGE 02: VIDEO BIBLE™ SETUP
          ==================================================================== */}
      <section className="hiw-stage-section" id="stage-2" aria-label="Stage 2 Video Bible">
        <div className="hiw-container">
          <div className="hiw-stage-grid reverse">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <ShieldCheck size={15} />
                <span>Stage 02 • Visual Identity</span>
              </div>
              <h2 className="hiw-stage-title">Lock Characters, World Aesthetics &amp; Lighting Rules</h2>
              <p className="hiw-stage-desc">
                Before generating a single scene, ScenoraEdits establishes your project's Video Bible™.
                By locking character seeds, wardrobe rules, and camera lighting templates, every subsequent
                cut respects your established world without random hallucinations.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Protagonist Seed Pinning:</strong> Lock facial bone structure, hairstyle, and age
                    so Captain Vance looks like Captain Vance in Scene 1 and Scene 45.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Wardrobe &amp; Armor Permanence:</strong> Retain identical spacesuits, historical
                    armor, or modern attire across every cut.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Camera &amp; Color Temperature:</strong> Enforce 35mm anamorphic lenses, warm
                    golden hour glows, or moody film noir lighting across all frames.
                  </span>
                </li>
              </ul>
            </div>

            <div className="hiw-interactive-card">
              <div className="hiw-bible-card">
                <div className="hiw-bible-header">
                  <img
                    src="/assets/hero_astronaut_main.jpg"
                    alt="Captain Vance"
                    className="hiw-bible-avatar"
                  />
                  <div className="hiw-bible-meta">
                    <h4>Captain Vance • Video Bible Locked</h4>
                    <span>
                      <CheckCircle2 size={12} />
                      Seed #8492041 Active across 32 scenes
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[var(--text-secondary)] space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-[var(--border)]">
                    <span className="font-semibold text-[var(--text)]">Face Continuity:</span>
                    <span className="font-mono text-emerald-500">99.4% Match Score</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--border)]">
                    <span className="font-semibold text-[var(--text)]">Wardrobe Lock:</span>
                    <span className="font-mono">Lunar Gold Visor EVA Mk IV</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--border)]">
                    <span className="font-semibold text-[var(--text)]">Film Stock:</span>
                    <span className="font-mono">Kodak Vision3 500T 35mm</span>
                  </div>
                </div>

                <div className="hiw-styles-row">
                  <span className="hiw-style-tag">Cinema 35mm</span>
                  <span className="hiw-style-tag">Volumetric Mist</span>
                  <span className="hiw-style-tag">Amber Cockpit Glow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. STAGE 03: AUTOMATED AI STORYBOARD GENERATION
          ==================================================================== */}
      <section className="hiw-stage-section alt-bg" id="stage-3" aria-label="Stage 3 Storyboard">
        <div className="hiw-container">
          <div className="hiw-stage-grid">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <Film size={15} />
                <span>Stage 03 • Shot Synthesis</span>
              </div>
              <h2 className="hiw-stage-title">Automated AI Storyboard Generation Shot by Shot</h2>
              <p className="hiw-stage-desc">
                With your script parsed and characters anchored, the storyboard generator transforms each
                spoken segment into a high-resolution cinematic shot. The system automatically alternates
                camera angles to maintain high visual pacing.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Intelligent Camera Variation:</strong> Automatically sequences establishing
                    wide shots, medium profiles, and intense close-ups to prevent visual fatigue.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>1-Click Single-Shot Re-Roll:</strong> Don't like a specific shot? Re-generate
                    just that frame with customized camera parameters in seconds.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Negative Prompt Filtering:</strong> Built-in filters eliminate unwanted artifacts,
                    blurry textures, and disfigured anatomy.
                  </span>
                </li>
              </ul>
            </div>

            <div className="hiw-interactive-card">
              <div className="hiw-storyboard-grid">
                <div className="hiw-storyboard-shot">
                  <img src="/assets/hero_astronaut_main.jpg" alt="Scene 1" />
                  <div className="hiw-storyboard-meta">
                    <span>Scene 01 • Close Up</span>
                    <span className="text-[#FF6B00]">00:00 - 05.4s</span>
                  </div>
                </div>
                <div className="hiw-storyboard-shot">
                  <img src="/assets/scene_2_profile.jpg" alt="Scene 2" />
                  <div className="hiw-storyboard-meta">
                    <span>Scene 02 • Profile Cockpit</span>
                    <span className="text-[#FF6B00]">05.4s - 13.9s</span>
                  </div>
                </div>
                <div className="hiw-storyboard-shot">
                  <img src="/assets/scene_3_landscape.jpg" alt="Scene 3" />
                  <div className="hiw-storyboard-meta">
                    <span>Scene 03 • Planet Wide</span>
                    <span className="text-[#FF6B00]">13.9s - 21.2s</span>
                  </div>
                </div>
                <div className="hiw-storyboard-shot">
                  <img src="/assets/scene_1_wide.jpg" alt="Scene 4" />
                  <div className="hiw-storyboard-meta">
                    <span>Scene 04 • Monolith March</span>
                    <span className="text-[#FF6B00]">21.2s - 28.5s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. STAGE 04: MULTI-TRACK AUDIO DSP & DYNAMIC CAPTIONS
          ==================================================================== */}
      <section className="hiw-stage-section" id="stage-4" aria-label="Stage 4 Audio DSP">
        <div className="hiw-container">
          <div className="hiw-stage-grid reverse">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <Volume2 size={15} />
                <span>Stage 04 • Sound &amp; Subtitles</span>
              </div>
              <h2 className="hiw-stage-title">Speech-Aware Music Ducking &amp; Animated Kinetic Captions</h2>
              <p className="hiw-stage-desc">
                Amateur videos have background music that drowns out spoken dialogue. ScenoraEdits applies
                digital signal processing (DSP) to lower background soundtracks -14dB beneath voiceover
                narration, alongside word-by-word highlighted subtitle animations.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Autonomous Volume Ducking:</strong> 50ms smooth attack and 250ms release curves
                    ensure music fades down seamlessly when words begin, with zero manual keyframing.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Shorts &amp; TikTok Viral Presets:</strong> Animated word-by-word highlights,
                    custom fonts, and colors that significantly increase viewer completion rates.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Multi-Stem Mixing:</strong> Separate audio tracks for voiceover, music score,
                    and sound effects for full post-production balance.
                  </span>
                </li>
              </ul>
            </div>

            <div className="hiw-interactive-card">
              <div className="hiw-ducking-display">
                <div className="text-[11px] font-mono text-[#FF6B00] uppercase tracking-wider">
                  Live Subtitle Animation
                </div>
                <div className="hiw-ducking-caption">
                  THE DRILLS UNCOVERED <span>SOMETHING ANCIENT</span>
                </div>
                <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span>Voice Track: Speaking (0dB)</span>
                  <span className="text-emerald-400">Score Track: Ducked (-14.2dB)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. STAGE 05: MULTI-TRACK TIMELINE POLISH & 1080P EXPORT
          ==================================================================== */}
      <section className="hiw-stage-section alt-bg" id="stage-5" aria-label="Stage 5 Timeline and Export">
        <div className="hiw-container">
          <div className="hiw-stage-grid">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <Layers size={15} />
                <span>Stage 05 • Master Export</span>
              </div>
              <h2 className="hiw-stage-title">Full Timeline Editorial Control &amp; Master 1080p Export</h2>
              <p className="hiw-stage-desc">
                Review your complete video in the multi-track timeline editor. Adjust pan-and-zoom speed
                (Ken Burns effect), fine-tune audio balance, switch between 16:9 Landscape and 9:16 Shorts,
                and render crisp 1080p 60fps MP4 masters ready for YouTube.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>1-Click Multi-Aspect Toggle:</strong> Instant switch between widescreen YouTube
                    documentary framing and vertical Shorts reels with smart character centering.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>1080p 60fps Broadcast Masters:</strong> Industry-standard MP4 (H.264 / AAC)
                    renders optimized for YouTube and social feeds.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>100% Commercial Ownership:</strong> Zero watermarks. Full copyright granted for
                    YouTube monetization and sponsored brand partnerships.
                  </span>
                </li>
              </ul>
            </div>

            <div className="hiw-interactive-card text-center">
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
                  src="/assets/scene_3_landscape.jpg"
                  alt="Export Aspect Ratio Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] text-xs font-mono text-[var(--text-muted)] flex justify-around">
                <span>Resolution: 1920x1080</span>
                <span>Framerate: 60 FPS</span>
                <span className="text-emerald-500 font-bold">100% Commercial Rights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. PRODUCTION TIME AUDIT: TRADITIONAL VS SCENORA
          ==================================================================== */}
      <section className="hiw-audit-section" id="audit" aria-label="Production Time Audit">
        <div className="hiw-container">
          <div className="hiw-audit-header">
            <div className="hiw-badge">
              <Clock size={14} />
              <span>Production Velocity Audit</span>
            </div>
            <h2 className="hiw-stage-title">Where Does Your Production Time Go?</h2>
            <p className="hiw-stage-desc">
              Compare the hours required by traditional video editing workflows against ScenoraEdits.
            </p>
          </div>

          <div className="hiw-audit-grid">
            {/* The Fragmented Old Workflow */}
            <div className="hiw-audit-card">
              <div>
                <span className="hiw-audit-badge bad">
                  <X size={12} />
                  <span>The Fragmented Old Way</span>
                </span>
                <h3>8 to 14 Hours per Video</h3>
                <div className="hiw-audit-time text-red-500">~12.5 Hours Avg</div>
                <ul className="hiw-audit-list">
                  <li>
                    <X size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <span>Hunting stock clips across 3 subscription libraries (3.5 hours)</span>
                  </li>
                  <li>
                    <X size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <span>Prompting random AI tools with mismatched faces (4.0 hours)</span>
                  </li>
                  <li>
                    <X size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <span>Manual audio slicing and keyframing volume curves (2.5 hours)</span>
                  </li>
                  <li>
                    <X size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <span>Subtitle synchronization and re-rendering mistakes (2.5 hours)</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border)] text-xs text-red-500 font-semibold">
                Result: Creator burnout, missed upload schedules, slow channel growth.
              </div>
            </div>

            {/* The ScenoraEdits Pipeline */}
            <div className="hiw-audit-card highlight">
              <div>
                <span className="hiw-audit-badge good">
                  <Check size={12} />
                  <span>The ScenoraEdits Pipeline</span>
                </span>
                <h3>Under 35 Minutes per Video</h3>
                <div className="hiw-audit-time scenora">~28 Minutes Total</div>
                <ul className="hiw-audit-list">
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Automatic acoustic transcription and pause detection (2 mins)</span>
                  </li>
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Video Bible™ character lock and style registry (3 mins)</span>
                  </li>
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Automated AI storyboard scene generation (12 mins)</span>
                  </li>
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Automatic audio ducking and timeline fine-tuning (8 mins)</span>
                  </li>
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>1-click 1080p 60fps Full HD master export (3 mins)</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border)] text-xs text-emerald-500 font-semibold">
                Result: 10+ hours saved on every video. Predictable, high-frequency publishing.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          9. CREATOR PRO STRATEGIES FOR YOUTUBE RETENTION
          ==================================================================== */}
      <section className="hiw-tips-section" aria-label="Retention Strategies">
        <div className="hiw-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="hiw-badge">
              <Zap size={14} />
              <span>YouTube Growth Strategies</span>
            </div>
            <h2 className="hiw-stage-title">4 Pro Strategies for Maximum Viewer Retention</h2>
            <p className="hiw-stage-desc">
              How full-time YouTube creators use the ScenoraEdits toolchain to maximize watch time.
            </p>
          </div>

          <div className="hiw-tips-grid">
            <div className="hiw-tip-card">
              <span className="hiw-tip-number">TIP 01</span>
              <h4>The 3-Second Visual Hook</h4>
              <p>
                Use close-up or extreme macro camera angles in Scene 1 to stop the scroll and immediately
                engage viewers before they swipe away.
              </p>
            </div>

            <div className="hiw-tip-card">
              <span className="hiw-tip-number">TIP 02</span>
              <h4>Word-by-Word Kinetic Text</h4>
              <p>
                On vertical Shorts and mobile screens, dynamic highlighted subtitles keep viewer eyes
                locked onto the center of the frame throughout narration.
              </p>
            </div>

            <div className="hiw-tip-card">
              <span className="hiw-tip-number">TIP 03</span>
              <h4>Balanced Audio Ducking</h4>
              <p>
                Keep background music audible at -14dB beneath speech to maintain emotional energy without
                forcing viewers to strain to understand dialogue.
              </p>
            </div>

            <div className="hiw-tip-card">
              <span className="hiw-tip-number">TIP 04</span>
              <h4>Serial Character Consistency</h4>
              <p>
                Build recognizable brand equity by persisting the same protagonist across an entire
                multi-episode YouTube series using the Video Bible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. HOW IT WORKS FAQ SECTION
          ==================================================================== */}
      <section className="hiw-faq-section" id="faq" aria-label="Pipeline FAQ">
        <div className="hiw-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="hiw-badge">
              <Sparkles size={14} />
              <span>Common Questions</span>
            </div>
            <h2 className="hiw-stage-title">Frequently Asked Questions</h2>
            <p className="hiw-stage-desc">
              Everything you need to know about the 5-stage production pipeline and technical controls.
            </p>
          </div>

          <div className="hiw-faq-list">
            {[
              {
                q: "Can I edit individual scenes after the entire video is generated?",
                a: "Yes! ScenoraEdits is built around a non-destructive timeline. You can adjust the start/end duration of any scene, re-roll a specific frame with a new prompt or seed, or swap music tracks without re-rendering the rest of your video.",
              },
              {
                q: "How long does generation take on local NVIDIA RTX vs cloud?",
                a: "On a local NVIDIA RTX 4070 or 4080 GPU, each scene renders in approximately 1 to 2 seconds. In our priority cloud clusters, full 30-scene storyboards typically render in under 4 minutes.",
              },
              {
                q: "Can I use my own voice recordings from a USB microphone?",
                a: "Absolutely. You can drop in any WAV, MP3, or M4A audio file recorded on any microphone. The Whisper acoustic model will automatically transcribe your speech and align timestamps.",
              },
              {
                q: "Can I generate both 16:9 landscape and 9:16 vertical versions from one project?",
                a: "Yes. With our 1-click aspect ratio toggle, you can switch between 16:9 YouTube Widescreen and 9:16 Shorts with smart subject re-centering that keeps the main character framed properly.",
              },
              {
                q: "Do I need previous video editing experience with Premiere Pro or DaVinci?",
                a: "None at all. ScenoraEdits is engineered to provide professional-grade video editing controls with an intuitive, clutter-free web interface that anyone can master in 5 minutes.",
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="hiw-faq-item">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="hiw-faq-question"
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
                    <div className="hiw-faq-answer">
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
          11. HIGH-CONVERTING BOTTOM CALL TO ACTION
          ==================================================================== */}
      <section className="hiw-cta-section" aria-label="Get Started">
        <div className="hiw-container">
          <div className="hiw-cta-banner">
            <h2>Ready to Build Your First Video in 5 Steps?</h2>
            <p>
              Experience character continuity, acoustic ducking, and timeline precision free.
              Start creating YouTube videos with ScenoraEdits today.
            </p>

            <div className="hiw-cta-actions">
              <button
                onClick={() => navigate("/app")}
                className="hiw-btn-primary"
                id="hiw-bottom-primary-cta"
              >
                <span>Launch Studio Free</span>
                <ArrowRight size={17} />
              </button>

              <button
                onClick={() => navigate("/pricing")}
                className="hiw-btn-secondary"
                id="hiw-bottom-pricing-cta"
              >
                <span>View Pricing Plans</span>
              </button>
            </div>

            <div className="hiw-cta-subtext">
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

export default HowItWorksPage;
