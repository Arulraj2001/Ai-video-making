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
    title: "How It Works — Turn Audio Into a Scene-by-Scene Video in 5 Steps",
    description:
      "From raw voiceover to finished 1080p video in 5 controlled steps. Upload audio, lock characters in Video Bible, assign images per scene, add motion and subtitles, and export.",
    canonical: "https://scenoraedits.web.app/how-it-works",
    ogTitle: "How ScenoraEdits Works — 5-Step Scene-Based Video Builder",
    ogDescription:
      "Upload voiceover audio, lock character consistency, assign images scene-by-scene, add kinetic captions, and export full 1080p video for YouTube.",
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
            <span>The 5-Stage Audio-to-Video Pipeline</span>
          </div>

          <h1 className="hiw-hero-h1">
            Turn Audio Into a Finished Video in{" "}
            <span className="hiw-gradient-text">5 Controlled Steps</span>
          </h1>

          <p className="hiw-hero-lead">
            No camera. No confusing multi-layer video software. ScenoraEdits automatically segments your voiceover into scenes, lets you assign one image to each beat, adds smooth camera motion and subtitles, and exports an MP4 ready for YouTube.
          </p>

          <div className="hiw-velocity-strip">
            <span className="hiw-velocity-pill">
              <Clock size={16} className="text-[#FF6B00]" />
              <span>Total Time: ~25–45 Mins</span>
            </span>
            <span className="hiw-velocity-pill">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Video Bible™ Consistency Locked</span>
            </span>
            <span className="hiw-velocity-pill">
              <Zap size={16} className="text-purple-500" />
              <span>BYOK Zero Token Markup</span>
            </span>
          </div>

          <div className="hiw-hero-actions">
            <button
              onClick={() => navigate("/app")}
              className="hiw-btn-primary"
              id="hiw-hero-primary-cta"
            >
              <span>Build My Video Free →</span>
              <ArrowRight size={17} />
            </button>

            <a href="#stage-1" className="hiw-btn-secondary" id="hiw-hero-secondary-cta">
              <Play size={15} />
              <span>Walk Through Stage 1</span>
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
              { num: 1, id: "stage-1", label: "01. Script & Audio (~2m)" },
              { num: 2, id: "stage-2", label: "02. Video Bible™ (~5m)" },
              { num: 3, id: "stage-3", label: "03. Assign Images (~15m)" },
              { num: 4, id: "stage-4", label: "04. Motion & Captions (~10m)" },
              { num: 5, id: "stage-5", label: "05. Export Masters (~3m)" },
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
          3. STAGE 01: SCRIPT & VOICEOVER INGESTION (~2 MIN)
          ==================================================================== */}
      <section className="hiw-stage-section alt-bg" id="stage-1" aria-label="Stage 1 Audio Ingestion">
        <div className="hiw-container">
          <div className="hiw-stage-grid">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <FileText size={15} />
                <span>Stage 01 • Script &amp; Audio Ingestion • Est. Time: ~2 Mins</span>
              </div>
              <h2 className="hiw-stage-title">Upload Your Voiceover Audio or Generate Narration</h2>
              <p className="hiw-stage-desc">
                Every video begins with speech. Upload an MP3/WAV file from ElevenLabs or your microphone — or type your script and let our built-in neural TTS voice generator create crystal-clear narration. Whisper automatically detects natural breath pauses to slice your story into timed scene slots.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Automatic Scene Segmentation:</strong> Natural cadence pauses split your narration into discrete 4–8 second visual beats.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Word-Level Phonetic Alignment:</strong> Scene boundary timestamps match exact spoken syllables with zero guesswork.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Multi-Language Neural Voiceover:</strong> Generate lifelike voices across 40+ accents and tones directly from text.
                  </span>
                </li>
              </ul>

              <div className="pt-3">
                <button
                  onClick={() => navigate("/app")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:underline"
                >
                  <span>Try Stage 1 Now in Studio →</span>
                </button>
              </div>
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
                      <span>narration_master.mp3 (12.4 MB)</span>
                    </span>
                    <span className="text-emerald-500 font-bold">Sliced in 8s</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-alt)] p-3 rounded-lg border border-[var(--border)] font-mono">
                    [00:00.00] &quot;Deep beneath the Antarctic ice sheet...&quot; <br />
                    [00:05.20] &lt;pause 0.6s&gt; <span className="text-[#FF6B00]">--&gt; Scene 01 (5.2s)</span><br />
                    [00:05.80] &quot;A research outpost detected an unmapped seismic pulse...&quot;<br />
                    [00:12.40] &lt;pause 0.7s&gt; <span className="text-[#FF6B00]">--&gt; Scene 02 (6.6s)</span>
                  </p>
                </div>
              ) : (
                <div className="hiw-sim-panel">
                  <div className="flex items-center justify-between text-xs font-mono text-purple-500 mb-3">
                    <span>Neural Narration: Deep Documentary Male</span>
                    <span className="text-emerald-500 font-bold">285 Words</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-alt)] p-3 rounded-lg border border-[var(--border)]">
                    &quot;The year was 1911. Roald Amundsen stood at the edge of the Ross Ice Shelf, preparing for a journey that would forever redefine human endurance...&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. STAGE 02: VIDEO BIBLE™ VISUAL IDENTITY (~5 MIN)
          ==================================================================== */}
      <section className="hiw-stage-section" id="stage-2" aria-label="Stage 2 Video Bible">
        <div className="hiw-container">
          <div className="hiw-stage-grid reverse">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <ShieldCheck size={15} />
                <span>Stage 02 • Visual Identity &amp; Characters • Est. Time: ~5 Mins</span>
              </div>
              <h2 className="hiw-stage-title">Set Your Visual Style &amp; Lock Character Consistency</h2>
              <p className="hiw-stage-desc">
                Before assigning images, Stage 2 establishes your project's Video Bible™. You pick an art style preset (Cinematic Film, Dark Fantasy, Cyberpunk Anime, 3D Render) and define recurring characters. By locking facial seeds and wardrobe anchors, your visuals stay consistent across 50+ scenes.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Character Identity Pinning:</strong> Lock facial bone structure, hair, and age so your protagonist looks identical across all shots.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Wardrobe &amp; Prop Permanence:</strong> Uniforms, spacesuits, or medieval armor remain fixed throughout the narrative.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Lighting &amp; Lens Presets:</strong> Enforce 35mm anamorphic glass, volumetric fog, or golden hour warmth across every scene.
                  </span>
                </li>
              </ul>

              <div className="pt-3">
                <button
                  onClick={() => navigate("/app")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:underline"
                >
                  <span>Configure Video Bible in Studio →</span>
                </button>
              </div>
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
                  <span className="hiw-style-tag">Amber Glow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. STAGE 03: ASSIGN ONE IMAGE TO EACH SCENE (~10–30 MIN)
          ==================================================================== */}
      <section className="hiw-stage-section alt-bg" id="stage-3" aria-label="Stage 3 Assign Images">
        <div className="hiw-container">
          <div className="hiw-stage-grid">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <Film size={15} />
                <span>Stage 03 • Storyboard &amp; Images • Est. Time: ~10–30 Mins</span>
              </div>
              <h2 className="hiw-stage-title">Assign One Image to Each Scene (Upload or AI)</h2>
              <p className="hiw-stage-desc">
                In Stage 3, each scene has its own dedicated card. You choose what shows up: upload your own custom artwork, generate a tailored image with AI using your own API key (or free built-in models), or pick from your project library. You can re-generate or replace any single scene in 1 click.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Drop Custom Images:</strong> Upload Midjourney renders, photography, infographics, or slide decks directly onto each scene slot.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>In-Studio AI Generation:</strong> Synthesize visuals tailored to that exact line of dialogue with Video Bible consistency.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>1-Click Single Scene Replace:</strong> Change any image anytime without re-rendering neighboring scenes.
                  </span>
                </li>
              </ul>

              <div className="pt-3">
                <button
                  onClick={() => navigate("/app")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:underline"
                >
                  <span>Open Storyboard in Studio →</span>
                </button>
              </div>
            </div>

            <div className="hiw-interactive-card">
              <div className="hiw-storyboard-grid">
                <div className="hiw-storyboard-shot">
                  <img src="/assets/hero_astronaut_main.jpg" alt="Scene 1" />
                  <div className="hiw-storyboard-meta">
                    <span>Scene 01 • Close Up</span>
                    <span className="text-[#FF6B00]">00:00 - 05.2s</span>
                  </div>
                </div>
                <div className="hiw-storyboard-shot">
                  <img src="/assets/scene_2_profile.jpg" alt="Scene 2" />
                  <div className="hiw-storyboard-meta">
                    <span>Scene 02 • Profile View</span>
                    <span className="text-[#FF6B00]">05.2s - 12.4s</span>
                  </div>
                </div>
                <div className="hiw-storyboard-shot">
                  <img src="/assets/scene_3_landscape.jpg" alt="Scene 3" />
                  <div className="hiw-storyboard-meta">
                    <span>Scene 03 • Vista Landscape</span>
                    <span className="text-[#FF6B00]">12.4s - 19.8s</span>
                  </div>
                </div>
                <div className="hiw-storyboard-shot">
                  <img src="/assets/scene_1_wide.jpg" alt="Scene 4" />
                  <div className="hiw-storyboard-meta">
                    <span>Scene 04 • Discovery</span>
                    <span className="text-[#FF6B00]">19.8s - 26.5s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. STAGE 04: MOTION, CAPTIONS, OVERLAYS & DUCKING (~10–20 MIN)
          ==================================================================== */}
      <section className="hiw-stage-section" id="stage-4" aria-label="Stage 4 Motion and Captions">
        <div className="hiw-container">
          <div className="hiw-stage-grid reverse">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <Volume2 size={15} />
                <span>Stage 04 • Motion, Captions &amp; Audio • Est. Time: ~10–20 Mins</span>
              </div>
              <h2 className="hiw-stage-title">Add Ken Burns Motion, Subtitles &amp; Audio Ducking</h2>
              <p className="hiw-stage-desc">
                Transform static visuals into a dynamic film. Apply Ken Burns camera zooms and pan directions per scene, enable kinetic subtitles (TikTok Bold with yellow word highlighting or Netflix clean style), and balance background music with automated speech-aware ducking.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Ken Burns Camera Motion:</strong> Gentle zoom in, zoom out, or slow horizontal pans give still images life.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Kinetic Subtitle Presets:</strong> Animated word-by-word highlights boost viewer watch time by up to 40%.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Automatic Music Ducking:</strong> Soundtrack lowers -14dB automatically when speech begins, with zero manual keyframes.
                  </span>
                </li>
              </ul>

              <div className="pt-3">
                <button
                  onClick={() => navigate("/app")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:underline"
                >
                  <span>Launch Timeline Studio →</span>
                </button>
              </div>
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
                  <span>Voiceover: Active (0dB)</span>
                  <span className="text-emerald-400">Music: Ducked (-14.2dB)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. STAGE 05: MULTI-FORMAT MASTER EXPORT (~1–5 MIN RENDER)
          ==================================================================== */}
      <section className="hiw-stage-section alt-bg" id="stage-5" aria-label="Stage 5 Master Export">
        <div className="hiw-container">
          <div className="hiw-stage-grid">
            <div className="hiw-stage-content">
              <div className="hiw-stage-tag">
                <Layers size={15} />
                <span>Stage 05 • Master Export • Est. Time: ~1–5 Mins</span>
              </div>
              <h2 className="hiw-stage-title">Export Multi-Format Video Ready for YouTube</h2>
              <p className="hiw-stage-desc">
                Preview your full composition, then click Export. Our deterministic FFmpeg pipeline renders Full HD 1080p MP4, fast 720p draft, WebM, and standalone MP3 audio with verified zero audio-video drift. Downloads include 100% commercial ownership rights and zero watermarks.
              </p>
              <ul className="hiw-stage-points">
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>1-Click Multi-Aspect Switch:</strong> Render in 16:9 Landscape for YouTube or 9:16 Vertical for Shorts and TikTok.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>Multi-Deliverable Package:</strong> Get MP4 1080p, WebM, 320kbps MP3 audio cut, and 6s teaser GIF in one pass.
                  </span>
                </li>
                <li className="hiw-point-item">
                  <CheckCircle2 size={16} className="hiw-point-icon" />
                  <span>
                    <strong>100% Commercial Monetization:</strong> Zero watermarks. Full copyright ownership granted to creator.
                  </span>
                </li>
              </ul>

              <div className="pt-3">
                <button
                  onClick={() => navigate("/app")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:underline"
                >
                  <span>Export Your First Video Free →</span>
                </button>
              </div>
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
                <span>Zero Audio Drift: &lt;0.05s</span>
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
              Compare the hours required by traditional fragmented workflows against ScenoraEdits.
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
                <div className="hiw-audit-time scenora">~30 Minutes Total</div>
                <ul className="hiw-audit-list">
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Stage 1: Automatic speech parsing &amp; scene slicing (~2 mins)</span>
                  </li>
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Stage 2: Video Bible™ character &amp; style locking (~5 mins)</span>
                  </li>
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Stage 3: Assign images per scene via upload or BYOK AI (~15 mins)</span>
                  </li>
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Stage 4: Ken Burns motion, subtitles &amp; audio ducking (~5 mins)</span>
                  </li>
                  <li>
                    <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Stage 5: 1-click multi-format 1080p export (~3 mins render)</span>
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
          9. FREQUENTLY ASKED QUESTIONS
          ==================================================================== */}
      <section className="hiw-faq-section" id="faq" aria-label="Pipeline FAQ">
        <div className="hiw-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="hiw-badge">
              <Zap size={14} />
              <span>Production FAQ</span>
            </div>
            <h2 className="hiw-stage-title">Frequently Asked Questions</h2>
            <p className="hiw-stage-desc">
              Common questions about the 5-stage production pipeline and video rendering.
            </p>
          </div>

          <div className="hiw-faq-box">
            {[
              {
                q: "What audio formats can I upload in Stage 1?",
                a: "You can upload MP3, WAV, M4A, FLAC, and OGG files up to 200MB. If you don't have recorded audio, you can type or paste a script in Stage 1 and generate neural narration with built-in TTS.",
              },
              {
                q: "How many scenes will my voiceover be split into?",
                a: "Whisper detects natural speech pauses. Typically, a 10-minute voiceover generates 25 to 45 scenes (averaging 5–8 seconds per scene). You can split, merge, or adjust scene boundaries anytime in the storyboard.",
              },
              {
                q: "Can I use images I've already created outside ScenoraEdits?",
                a: "Absolutely. You can drag and drop your own PNG, JPG, or WebP files onto any scene slot in Stage 3. ScenoraEdits will automatically scale and fit them to 16:9 or 9:16.",
              },
              {
                q: "Can I edit captions or change the subtitle font?",
                a: "Yes. In Stage 4, you can edit transcription text directly, pick from subtitle style presets (TikTok Bold, Netflix Subtitles, Minimal Lower Thirds), and customize colors and sizing.",
              },
              {
                q: "How long does the final 1080p export take in Stage 5?",
                a: "Thanks to our deterministic FFmpeg engine, a 5-minute video typically renders in 1 to 2 minutes. Renders proceed in the cloud or via hardware acceleration without blocking your browser.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="hiw-faq-item">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="hiw-faq-btn"
                  aria-expanded={openFaqIndex === idx}
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openFaqIndex === idx && (
                  <div className="hiw-faq-content">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL HIGH-CONVERTING CTA */}
      <section className="hiw-bottom-cta">
        <div className="hiw-container">
          <div className="hiw-bottom-card">
            <h2>Ready to Build Your Video in 5 Steps?</h2>
            <p>
              Upload your voiceover or paste a script to experience scene-by-scene composition today. Free to start, zero watermarks.
            </p>
            <div className="hiw-hero-actions" style={{ marginBottom: 0 }}>
              <button
                onClick={() => navigate("/app")}
                className="hiw-btn-primary"
                id="hiw-bottom-primary-cta"
              >
                <span>Build My Video Free →</span>
              </button>
              <button
                onClick={() => navigate("/features")}
                className="hiw-btn-secondary"
              >
                <span>View Full Feature Set</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
