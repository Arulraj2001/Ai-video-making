import React, { useState } from "react";
import { useRouter } from "../../router/Router";
import { useSEO } from "../../utils/seo";
import "./UseCasesPage.css";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Video,
  Mic,
  Palette,
  GraduationCap,
  Zap,
  Layers,
} from "lucide-react";

export const UseCasesPage: React.FC = () => {
  const { navigate } = useRouter();

  useSEO({
    title: "Use Cases — Who Uses ScenoraEdits Scene-Based Video Composer?",
    description:
      "Explore how Faceless YouTube channels, podcasters, AI artists, and educators turn audio narration and images into high-retention, monetizable videos with ScenoraEdits.",
    canonical: "https://scenoraedits.web.app/use-cases",
    ogTitle: "Use Cases — ScenoraEdits Audio-to-Video Composer",
    ogDescription:
      "From faceless documentaries to podcast video episodes and AI art showcases: assign one image per scene, add kinetic captions, and export in 1080p.",
  });

  const [activeTab, setActiveTab] = useState<"faceless" | "podcast" | "artists" | "explainers">("faceless");

  const useCasesData = {
    faceless: {
      badge: "01 • Faceless YouTube Channels",
      title: "Produce 10–20 Minute Documentaries Without Ever Touching a Camera",
      subtitle:
        "History, true crime, finance, and sci-fi lore channels rely on voiceover narrative. ScenoraEdits parses your audio into timed scenes, locks character consistency, and outputs full HD videos ready for YouTube AdSense.",
      highlights: [
        "Upload audio from ElevenLabs, Edge-TTS, or human voice actors",
        "Acoustic Whisper segmentation cuts scripts into precise 4-8 second visual scenes",
        "Video Bible™ locks historical figures, armor, and setting lighting across all scenes",
        "Kinetic subtitles (TikTok Bold or Netflix style) keep viewer retention above 65%",
        "Direct 1080p 60fps MP4 export with 100% commercial monetization rights",
      ],
      workflowSteps: [
        { step: "1", title: "Drop Voiceover MP3", desc: "Whisper slices a 15-minute voiceover into 45 natural scene beats." },
        { step: "2", title: "Lock Character Seeds", desc: "Set historical character faces and cinematic lighting in Video Bible." },
        { step: "3", title: "Assign Scene Images", desc: "Generate with your DALL-E / Flux key or drop custom historical artwork." },
        { step: "4", title: "Add Motion & Ducking", desc: "Smooth Ken Burns camera pans and -14dB background orchestral ducking." },
      ],
      stat: "65%+",
      statLabel: "Average viewer retention on 10+ min videos",
    },
    podcast: {
      badge: "02 • Podcast-to-Video Conversions",
      title: "Turn Audio Episodes Into Full Visual YouTube Shows & Viral Shorts",
      subtitle:
        "Don't leave your podcast trapped in audio feeds. Transform long-form conversations or bite-sized highlights into captivating visual videos with segment-by-segment graphics and animated waveforms.",
      highlights: [
        "Transform raw podcast WAV/MP3 files into 16:9 YouTube episodes and 9:16 Shorts",
        "Assign topic illustrations, guest photos, or data charts to each spoken segment",
        "Automatic audio ducking ensures background ambience never masks speech",
        "Animated captions with live word-by-word highlighting for zero-sound viewers",
        "Export both complete MP4 video masters and standalone MP3 remastered audio",
      ],
      workflowSteps: [
        { step: "1", title: "Upload Episode Audio", desc: "Import full discussion or clip excerpt with instant transcription." },
        { step: "2", title: "Set Episode Branding", desc: "Configure show colors, font styles, and guest identity tags." },
        { step: "3", title: "Map Segment Visuals", desc: "Assign slide graphics, quotes, or relevant imagery to each topic." },
        { step: "4", title: "Export YouTube + Shorts", desc: "1-click render produces 1080p landscape video and vertical clip." },
      ],
      stat: "3.8x",
      statLabel: "Higher discoverability on YouTube vs audio-only RSS",
    },
    artists: {
      badge: "03 • AI Image Artists & Storytellers",
      title: "Turn Midjourney, Stable Diffusion & Flux Stills Into Cinematic Narratives",
      subtitle:
        "You've spent hours crafting breathtaking stills. ScenoraEdits gives them a voice, cinematic motion, and a cohesive timeline structure to tell compelling sequential visual stories.",
      highlights: [
        "Drag and drop your own 4K Midjourney, Flux, or Stable Diffusion outputs",
        "Ken Burns camera motion brings still images to life with slow zoom and directional pans",
        "Fluid crossfade, dissolve, and filmic cut transitions between visual scenes",
        "Zero token markup: connect your own API keys for in-studio AI generation",
        "Export in uncompressed 1080p 60fps MP4 and WebM formats",
      ],
      workflowSteps: [
        { step: "1", title: "Import Visual Library", desc: "Drop your curated AI stills directly into the project timeline." },
        { step: "2", title: "Record or Add Narration", desc: "Align voiceover pacing with the visual mood of each frame." },
        { step: "3", title: "Direct Camera Motion", desc: "Apply subtle zooms, dolly pushes, and ambient sound effects." },
        { step: "4", title: "Render Cinematic Reel", desc: "Export pristine 60fps video with zero watermark or compression artifacts." },
      ],
      stat: "100%",
      statLabel: "Ownership and commercial licensing for all exports",
    },
    explainers: {
      badge: "04 • Explainer & Educational Creators",
      title: "Deliver Complex Concepts With Synchronized Visual Explanations",
      subtitle:
        "Technical tutorials, course lessons, and product walk-throughs require tight coordination between spoken explanations and visual slides. ScenoraEdits ensures zero timing drift.",
      highlights: [
        "Upload diagrams, architecture charts, and summary slides per concept beat",
        "Deterministic FFmpeg demuxer guarantees <0.05s sync on 60+ minute lectures",
        "Clean lower-third titles and key takeaway callout overlays",
        "Generate realistic neural voiceovers in 40+ languages via built-in TTS",
        "Export chaptered MP4 files ready for LMS platforms or YouTube chapters",
      ],
      workflowSteps: [
        { step: "1", title: "Paste Lesson Script", desc: "Convert lecture notes into speech with Edge-TTS or upload narration." },
        { step: "2", title: "Attach Diagram Slides", desc: "Drop PNG schematics or generate concept visuals per topic." },
        { step: "3", title: "Apply Educational Captions", desc: "Clean subtitle formatting ensures high accessibility." },
        { step: "4", title: "Export Course Module", desc: "Download lightweight 720p draft or pristine 1080p lecture master." },
      ],
      stat: "0.00s",
      statLabel: "Audio-visual sync drift over hour-long presentations",
    },
  };

  const current = useCasesData[activeTab];

  return (
    <div className="use-cases-page">
      {/* 1. HERO SECTION */}
      <section className="uc-hero-section">
        <div className="uc-container">
          <div className="uc-badge">
            <Sparkles size={14} className="text-[#FF6B00]" />
            <span>Built for High-Velocity Creators</span>
          </div>

          <h1 className="uc-hero-h1">
            Turn Audio &amp; Images Into High-Retention Videos,{" "}
            <span className="uc-gradient-text">No Camera Required</span>
          </h1>

          <p className="uc-hero-lead">
            Whether you run a faceless documentary channel, repurpose podcast discussions, showcase AI artwork, or teach technical concepts — ScenoraEdits gives you scene-by-scene control without the complexity of traditional video editors.
          </p>

          <div className="uc-hero-actions">
            <button
              onClick={() => navigate("/app")}
              className="uc-btn-primary"
              id="uc-hero-primary-cta"
            >
              <span>Build Your First Video Free</span>
              <ArrowRight size={17} />
            </button>
            <button
              onClick={() => navigate("/features")}
              className="uc-btn-secondary"
            >
              <span>Explore Features</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. CREATOR ARCHETYPE TABS */}
      <section className="uc-tabs-section">
        <div className="uc-container">
          <div className="uc-tabs-nav" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "faceless"}
              onClick={() => setActiveTab("faceless")}
              className={`uc-tab-btn ${activeTab === "faceless" ? "active" : ""}`}
            >
              <Video size={18} />
              <span>Faceless YouTube</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "podcast"}
              onClick={() => setActiveTab("podcast")}
              className={`uc-tab-btn ${activeTab === "podcast" ? "active" : ""}`}
            >
              <Mic size={18} />
              <span>Podcasts &amp; Audio</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "artists"}
              onClick={() => setActiveTab("artists")}
              className={`uc-tab-btn ${activeTab === "artists" ? "active" : ""}`}
            >
              <Palette size={18} />
              <span>AI Image Artists</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "explainers"}
              onClick={() => setActiveTab("explainers")}
              className={`uc-tab-btn ${activeTab === "explainers" ? "active" : ""}`}
            >
              <GraduationCap size={18} />
              <span>Educational &amp; Explainers</span>
            </button>
          </div>

          {/* ACTIVE TAB SPOTLIGHT CARD */}
          <div className="uc-spotlight-card">
            <div className="uc-spotlight-grid">
              <div className="uc-spotlight-info">
                <div className="uc-spotlight-badge">{current.badge}</div>
                <h2 className="uc-spotlight-title">{current.title}</h2>
                <p className="uc-spotlight-sub">{current.subtitle}</p>

                <div className="uc-highlights-list">
                  {current.highlights.map((h, i) => (
                    <div key={i} className="uc-highlight-item">
                      <CheckCircle2 size={17} className="text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="uc-stat-strip">
                  <div className="uc-stat-number">{current.stat}</div>
                  <div className="uc-stat-text">{current.statLabel}</div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => navigate("/app")}
                    className="uc-btn-primary inline-flex"
                  >
                    <span>Start This Workflow Free</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="uc-spotlight-workflow">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                  <Layers size={16} className="text-[#FF6B00]" />
                  <span>The 4-Step Production Sequence</span>
                </h3>

                <div className="uc-workflow-steps">
                  {current.workflowSteps.map((ws) => (
                    <div key={ws.step} className="uc-step-card">
                      <div className="uc-step-num">{ws.step}</div>
                      <div className="uc-step-content">
                        <h4>{ws.title}</h4>
                        <p>{ws.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPARISON: WHY CREATORS CHOOSE SCENORAEDITS */}
      <section className="uc-compare-section">
        <div className="uc-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="uc-badge">
              <Zap size={14} className="text-[#FF6B00]" />
              <span>Competitive Advantage</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text)]">
              Why Creators Choose ScenoraEdits Over Generic Tools
            </h2>
            <p className="text-base text-[var(--text-secondary)] mt-3">
              Traditional NLEs are too slow. Generic AI video generators don't give you scene-level control. Here's why ScenoraEdits is the ideal middle ground.
            </p>
          </div>

          <div className="uc-compare-grid">
            <div className="uc-compare-card alt">
              <h3>Generic AI Video Generators</h3>
              <p className="uc-compare-intro">InVideo, Fliki, HeyGen, Sora clones</p>
              <ul className="uc-compare-list">
                <li className="text-rose-500">❌ Random 5-second video loops with no scene control</li>
                <li className="text-rose-500">❌ Character faces warp completely between shots</li>
                <li className="text-rose-500">❌ Expensive monthly token packages ($40–$120/mo)</li>
                <li className="text-rose-500">❌ Watermarks on free exports, limited formats</li>
              </ul>
            </div>

            <div className="uc-compare-card featured">
              <div className="uc-card-badge">THE SCENORAEDITS WAY</div>
              <h3>Scene-Based Video Composer</h3>
              <p className="uc-compare-intro">Purpose-built for audio-first storytelling</p>
              <ul className="uc-compare-list">
                <li className="text-emerald-500">✓ Every scene has its own discrete image slot</li>
                <li className="text-emerald-500">✓ Video Bible™ pins character faces and art style</li>
                <li className="text-emerald-500">✓ BYOK: Connect your own API key at raw cost</li>
                <li className="text-emerald-500">✓ Zero watermarks, full 1080p YouTube commercial rights</li>
                <li className="text-emerald-500">✓ Deterministic FFmpeg rendering with zero audio drift</li>
              </ul>
            </div>

            <div className="uc-compare-card alt">
              <h3>Traditional Desktop NLEs</h3>
              <p className="uc-compare-intro">Premiere Pro, DaVinci Resolve, Final Cut</p>
              <ul className="uc-compare-list">
                <li className="text-amber-500">⚠️ Steep learning curve, takes hours per video</li>
                <li className="text-amber-500">⚠️ Manual alignment of every image to audio timestamps</li>
                <li className="text-amber-500">⚠️ No integrated AI image generation or character locking</li>
                <li className="text-amber-500">⚠️ Heavy desktop software requiring powerful workstation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FINAL CTA BANNER */}
      <section className="uc-cta-section">
        <div className="uc-container">
          <div className="uc-cta-box">
            <h2 className="uc-cta-h2">
              Ready to Turn Your Narration Into a Finished Video?
            </h2>
            <p className="uc-cta-p">
              Start building your first video today. No credit card required. Zero watermarks.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap mt-6">
              <button
                onClick={() => navigate("/app")}
                className="uc-btn-primary text-base px-8 py-3.5"
                id="use-cases-bottom-cta"
              >
                <span>Build My Video Free →</span>
              </button>
              <button
                onClick={() => navigate("/how-it-works")}
                className="uc-btn-secondary text-base px-6 py-3.5"
              >
                <span>See the 5-Stage Pipeline</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
