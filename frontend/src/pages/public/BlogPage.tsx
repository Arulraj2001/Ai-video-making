import React, { useState, useMemo } from "react";
import { useRouter } from "../../router/Router";
import { useSEO } from "../../utils/seo";
import "./BlogPage.css";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Search,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GuideArticle {
  id: string;
  category: "automation" | "videobible" | "prompting" | "audio" | "hardware";
  categoryLabel: string;
  readTime: string;
  title: string;
  excerpt: string;
  author: string;
  image: string;
  content: {
    summary: string;
    takeaways: string[];
    steps: { title: string; desc: string }[];
    promptRecipe?: string;
  };
}

const allArticles: GuideArticle[] = [
  {
    id: "featured-automation",
    category: "automation",
    categoryLabel: "YouTube Automation",
    readTime: "8 min read",
    title: "The Complete YouTube Automation Playbook: Scaling Faceless Channels with 100% Character Consistency",
    excerpt: "How full-time YouTube creators use ScenoraEdits to structure high-retention scripts, lock recurring protagonists with Video Bible™, and reduce video production from 14 hours to 30 minutes.",
    author: "Alex Vance • Lead Pipeline Engineer",
    image: "/assets/hero_astronaut_main.jpg",
    content: {
      summary: "Faceless channels often struggle with two bottlenecks: mismatched characters that break viewer immersion, and exhausting hours spent hunting stock video clips. This guide breaks down the full automation stack that allows modern creators to publish 3 to 5 cinematic videos every week.",
      takeaways: [
        "Consistent characters generate 34% higher average viewer retention across serial video content.",
        "Acoustic Whisper pause detection cuts script transcription time from hours to under 15 seconds.",
        "Automated audio ducking eliminates manual volume curve drawing in traditional NLEs.",
      ],
      steps: [
        {
          title: "Step 1: The Acoustic Hook Structure",
          desc: "Write your first 3 sentences with aggressive visual verbs. When uploaded to ScenoraEdits, natural breath pauses trigger high-motion scene splits immediately.",
        },
        {
          title: "Step 2: Video Bible Character Lock",
          desc: "Define your protagonist once using exact seed anchors and costume tags. Every subsequent generated frame strictly inherits this visual identity.",
        },
        {
          title: "Step 3: Timeline Polish & 60fps Export",
          desc: "Review your multi-track timeline, adjust pan-and-zoom pacing, and export directly in 1080p 60fps ready for YouTube.",
        },
      ],
      promptRecipe: "cinematic medium shot, Commander Vance in weathered lunar armor, amber cockpit telemetry glow, 35mm anamorphic lens, ARRI Alexa LF --seed 8492041 --style cinematic",
    },
  },
  {
    id: "videobible-masterclass",
    category: "videobible",
    categoryLabel: "Video Bible & Characters",
    readTime: "6 min read",
    title: "Video Bible™ Masterclass: Eliminating Facial Drift Across Multi-Scene YouTube Stories",
    excerpt: "Learn how seed pinning, camera lighting consistency, and wardrobe retention rules prevent your characters from morphing between shots.",
    author: "Elena Rostova • AI Art Director",
    image: "/assets/scene_2_profile.jpg",
    content: {
      summary: "Traditional AI generation produces isolated images with zero awareness of previous cuts. Video Bible™ injects persistent character descriptors and mathematical seeds into diffusion models to ensure true narrative continuity.",
      takeaways: [
        "Face geometry, eye color, and bone structure remain identical across 50+ scenes.",
        "Wardrobe anchors prevent armor and clothing from randomly changing between cuts.",
        "Unified lighting temperature creates the optical illusion of a single physical camera shoot.",
      ],
      steps: [
        {
          title: "1. Lock the Anchor Seed",
          desc: "Generate your primary close-up anchor and lock the generated seed into the Video Bible registry.",
        },
        {
          title: "2. Define Fixed Wardrobe Tags",
          desc: "Specify exact materials and colors (e.g. 'Lorica Segmentata Roman iron armor, crimson tunic') that remain constant in every scene prompt.",
        },
        {
          title: "3. Enforce World Lighting Rules",
          desc: "Set project-level lighting (e.g. 'golden hour volumetric sunlight, 35mm Kodak 500T grain') so scene colors blend seamlessly.",
        },
      ],
      promptRecipe: "profile shot, Marcus Aurelius in imperial Roman armor, battlefield mist, golden hour backlight, 85mm portrait lens --seed 119280",
    },
  },
  {
    id: "local-rtx-setup",
    category: "hardware",
    categoryLabel: "Hardware & Local GPU",
    readTime: "7 min read",
    title: "Local NVIDIA RTX Acceleration: Unlimited Free Diffusion Generations on Your Own Hardware",
    excerpt: "Step-by-step tutorial on connecting your RTX 3060, 4070, 4080, or 4090 GPU to ScenoraEdits for zero-cost, private, unlimited scene generation.",
    author: "David Chen • Systems Architect",
    image: "/assets/scene_3_landscape.jpg",
    content: {
      summary: "Why burn cloud credits when your desktop has a powerful NVIDIA GPU? Learn how our lightweight local daemon connects to the web studio to provide unlimited free rendering.",
      takeaways: [
        "Generate 100% free with zero cloud credit consumption or subscription limitations.",
        "Your raw scripts, voice recordings, and image masters remain 100% private on local storage.",
        "Sub-2-second generation latency on NVIDIA RTX 40-series cards.",
      ],
      steps: [
        {
          title: "1. Install NVIDIA CUDA Toolkit",
          desc: "Ensure your Windows or Linux workstation has CUDA 12+ and latest NVIDIA Game Ready / Studio drivers installed.",
        },
        {
          title: "2. Launch Scenora Local Daemon",
          desc: "Run our lightweight background daemon which connects securely over localhost WebSocket (port 8000).",
        },
        {
          title: "3. Toggle Local Engine in Studio",
          desc: "In Scenora Studio, select 'Compute: Local RTX GPU'. All scene generation requests will execute directly on your hardware.",
        },
      ],
    },
  },
  {
    id: "audio-ducking-science",
    category: "audio",
    categoryLabel: "Audio & Ducking",
    readTime: "5 min read",
    title: "The Science of Audio Ducking: Why Background Music Destroys Viewer Retention",
    excerpt: "How automatic speech-aware digital signal processing attenuates musical tracks -14dB beneath spoken lines for broadcast clarity.",
    author: "Sarah Jenkins • Sound Engineer",
    image: "/assets/scene_1_wide.jpg",
    content: {
      summary: "Poor audio balance is the #1 reason viewers abandon YouTube videos within the first 30 seconds. Learn how automated speech-aware ducking creates professional broadcast clarity without tedious manual keyframing.",
      takeaways: [
        "Background music should automatically duck between -12dB and -16dB whenever dialogue is active.",
        "A 50ms attack curve prevents abrupt volume jarring when speech begins.",
        "A 250ms release curve smoothly restores music energy during dramatic pauses.",
      ],
      steps: [
        {
          title: "1. The -14dB Golden Rule",
          desc: "Set your voiceover track to 0dB reference, and configure background music ducking to -14dB attenuation.",
        },
        {
          title: "2. Attack & Release Curves",
          desc: "Use a gentle 50ms fade-in when speech starts so the volume dip feels musical rather than mechanical.",
        },
        {
          title: "3. Dynamic Subtitle Sync",
          desc: "Pair ducked audio with word-level highlighted subtitles to maximize viewer comprehension on mobile devices.",
        },
      ],
    },
  },
  {
    id: "whisper-storyboarding",
    category: "automation",
    categoryLabel: "YouTube Automation",
    readTime: "5 min read",
    title: "Acoustic Storyboarding: How Whisper AI Replaces Hours of Manual Timeline Slicing",
    excerpt: "Discover how word-level phonetic alignment and breath pause detection automatically segment scripts into timed visual beats.",
    author: "Alex Vance • Lead Pipeline Engineer",
    image: "/assets/hero_astronaut_main.jpg",
    content: {
      summary: "Traditional video editing requires listening to a voiceover file and manually cutting razor slices at every pause. ScenoraEdits uses OpenAI Whisper phonetic alignment to slice narrative beats automatically.",
      takeaways: [
        "Acoustic timing guarantees scene transitions land on natural breath pauses.",
        "Eliminates hours of manual razor tool editing in Premiere Pro or DaVinci.",
        "Automatically adjusts scene durations based on speaking speed and dramatic cadence.",
      ],
      steps: [
        {
          title: "1. Upload Spoken Audio",
          desc: "Drop in your WAV or MP3 narration file recorded on any standard USB microphone.",
        },
        {
          title: "2. Whisper Phonetic Segmentation",
          desc: "The acoustic engine generates a word-level timestamp grid and identifies narrative pauses longer than 0.6 seconds.",
        },
        {
          title: "3. Automated Visual Storyboarding",
          desc: "Each audio segment is immediately converted into an AI storyboard keyframe matching the spoken narrative.",
        },
      ],
    },
  },
  {
    id: "viral-shorts-blueprint",
    category: "automation",
    categoryLabel: "YouTube Automation",
    readTime: "6 min read",
    title: "Viral Shorts & Reels Blueprint: Kinetic Subtitles, High-Energy Hooks, and 9:16 Centering",
    excerpt: "How to maximize algorithmic watch time with word-by-word highlighted text, 3-second visual hooks, and vertical focal centering.",
    author: "Marcus Brody • YouTube Growth Strategist",
    image: "/assets/scene_2_profile.jpg",
    content: {
      summary: "YouTube Shorts and TikTok algorithms prioritize 100%+ average percentage viewed (APV). Learn the visual techniques that keep viewers watching past the 60-second mark.",
      takeaways: [
        "Kinetic word-by-word highlighted subtitles increase completion rate by up to 42%.",
        "The first 3 seconds must feature an aggressive visual hook and punchy spoken question.",
        "Smart focal-point centering prevents characters from getting awkwardly cut off on vertical mobile screens.",
      ],
      steps: [
        {
          title: "1. High-Motion Opening Cut",
          desc: "Start with an extreme close-up or action shot to stop the scroll in under 1 second.",
        },
        {
          title: "2. Kinetic Yellow Text Overlay",
          desc: "Enable animated word-by-word subtitles with high-contrast text shadows.",
        },
        {
          title: "3. 60fps Vertical Export",
          desc: "Export at 1080x1920 60fps for silky smooth algorithmic playback.",
        },
      ],
    },
  },
  {
    id: "cinematic-prompt-engineering",
    category: "prompting",
    categoryLabel: "Prompt Engineering",
    readTime: "8 min read",
    title: "Cinematic Prompt Engineering: Translating Script Lines into ARRI Alexa 35mm Keyframes",
    excerpt: "Master lens selection (anamorphic vs telephoto), volumetric lighting tags, and negative prompt formulas for photorealistic YouTube storytelling.",
    author: "Elena Rostova • AI Art Director",
    image: "/assets/scene_3_landscape.jpg",
    content: {
      summary: "Vague prompts yield cartoonish AI results. By adopting the vocabulary of real Hollywood cinematographers, you can guide diffusion models to produce cinematic, filmic masterpieces.",
      takeaways: [
        "Specify real focal lengths: 35mm for environmental context, 85mm for emotional intimacy.",
        "Use volumetric lighting tags: 'dramatic blue rim light, amber tungsten cockpit glow, heavy atmospheric mist'.",
        "Negative prompts eliminate cartoon textures, plastic skin, and disfigured anatomy.",
      ],
      steps: [
        {
          title: "1. Camera & Lens Framing",
          desc: "Always begin your prompt with camera angle: 'cinematic medium shot, 35mm anamorphic lens, ARRI Alexa LF'.",
        },
        {
          title: "2. Lighting Direction & Temperature",
          desc: "Specify primary key and rim light colors (e.g. 'dual sunset horizon, deep shadows, cinematic contrast').",
        },
        {
          title: "3. Film Texture Tags",
          desc: "Add 'Kodak Vision3 500T 35mm, subtle film grain, photorealistic texture' to eliminate plastic AI looks.",
        },
      ],
      promptRecipe: "cinematic extreme wide shot, Commander Vance standing before an ancient obsidian monolith on red desert planet, dual sunset horizon, volumetric dust storm, 35mm anamorphic lens, 8k photorealistic --seed 8492041",
    },
  },
];

export const BlogPage: React.FC = () => {
  const { navigate } = useRouter();

  useSEO({
    title: "Creator Guides & Engineering Blog — ScenoraEdits",
    description:
      "Actionable tutorials and playbooks for high-velocity YouTube creators. Master Video Bible character consistency, local RTX GPU diffusion, and automated timeline editing.",
    canonical: "https://scenoraedits.web.app/blog",
    ogTitle: "Creator Guides & Engineering Blog — ScenoraEdits",
    ogDescription:
      "In-depth guides on AI video automation, character continuity, sound design ducking, and local GPU setups for full-time YouTube creators.",
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Reader Modal State
  const [activeArticle, setActiveArticle] = useState<GuideArticle | null>(null);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail("");
    }
  };

  // Filtered Articles Calculation
  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      const matchesCategory =
        selectedCategory === "all" || article.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const featuredArticle = allArticles[0];

  return (
    <div className="blog-page">
      {/* ====================================================================
          1. HERO SECTION & SEARCH/FILTER BAR
          ==================================================================== */}
      <section className="blog-hero-section" aria-label="Creator Academy">
        <div className="blog-container">
          <div className="blog-badge">
            <Sparkles size={14} className="text-[#FF6B00]" />
            <span>Creator Playbook &amp; Production Guides</span>
          </div>

          <h1 className="blog-hero-h1">
            Actionable Playbooks for{" "}
            <span className="blog-gradient-text">High-Velocity YouTube Creators</span>
          </h1>

          <p className="blog-hero-lead">
            In-depth tutorials, prompt formulas, character consistency breakdowns, and local GPU setups
            written by video automation engineers and full-time creators.
          </p>

          <div className="blog-controls-box">
            {/* Live Search Input */}
            <div className="blog-search-wrap">
              <Search size={18} className="blog-search-icon" />
              <input
                type="text"
                placeholder="Search tutorials, prompt recipes, GPU guides, or audio mixing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="blog-search-input"
                aria-label="Search guides"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="blog-filter-group">
              {[
                { id: "all", label: "All Guides" },
                { id: "automation", label: "YouTube Automation" },
                { id: "videobible", label: "Video Bible™" },
                { id: "prompting", label: "Prompt Engineering" },
                { id: "audio", label: "Audio & Ducking" },
                { id: "hardware", label: "Hardware & Local GPU" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`blog-filter-btn ${
                    selectedCategory === cat.id ? "active" : ""
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. FEATURED COVER STORY (HERO EDITORIAL CARD)
          ==================================================================== */}
      {selectedCategory === "all" && searchQuery === "" && (
        <section className="blog-featured-section" aria-label="Featured Guide">
          <div className="blog-container">
            <div
              className="blog-featured-card"
              onClick={() => setActiveArticle(featuredArticle)}
            >
              <div className="blog-featured-img-wrap">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="blog-featured-img"
                />
              </div>

              <div className="blog-featured-content">
                <div>
                  <div className="blog-featured-meta">
                    <span>{featuredArticle.categoryLabel}</span>
                    <span>•</span>
                    <span>{featuredArticle.readTime}</span>
                  </div>

                  <h2 className="blog-featured-title">{featuredArticle.title}</h2>
                  <p className="blog-featured-excerpt">{featuredArticle.excerpt}</p>
                </div>

                <div className="blog-featured-footer">
                  <span>{featuredArticle.author}</span>
                  <span className="blog-read-cta">
                    <span>Read Complete Guide</span>
                    <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          3. CURATED ARTICLES GRID
          ==================================================================== */}
      <section className="blog-articles-section" aria-label="Guides Directory">
        <div className="blog-container">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={36} className="mx-auto text-[var(--text-muted)] mb-3" />
              <h3 className="text-lg font-bold text-[var(--text)]">No guides found</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Try searching with different keywords or reset your category filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF6B00] text-white"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="blog-articles-grid">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="blog-article-card"
                  onClick={() => setActiveArticle(article)}
                >
                  <div className="blog-card-img-wrap">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="blog-card-img"
                    />
                  </div>

                  <div className="blog-card-body">
                    <div>
                      <div className="blog-card-top-meta">
                        <span>{article.categoryLabel}</span>
                        <span className="blog-card-read-time">{article.readTime}</span>
                      </div>
                      <h3 className="blog-card-title">{article.title}</h3>
                      <p className="blog-card-excerpt">{article.excerpt}</p>
                    </div>

                    <div className="blog-card-footer">
                      <span>{article.author.split("•")[0].trim()}</span>
                      <span className="blog-read-cta">
                        <span>Read</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          4. INTERACTIVE ARTICLE READER MODAL
          ==================================================================== */}
      {activeArticle && (
        <div
          className="blog-modal-backdrop"
          onClick={() => setActiveArticle(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="blog-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="blog-modal-header">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase mb-1">
                  <span>{activeArticle.categoryLabel}</span>
                  <span>•</span>
                  <span>{activeArticle.readTime}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] font-medium">
                  {activeArticle.author}
                </div>
              </div>

              <button
                onClick={() => setActiveArticle(null)}
                className="blog-modal-close-btn"
                aria-label="Close guide modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="blog-modal-body">
              <h2 className="blog-modal-h2">{activeArticle.title}</h2>

              <div className="blog-modal-section">
                <h4>Executive Summary</h4>
                <p>{activeArticle.content.summary}</p>
              </div>

              <div className="blog-modal-section">
                <h4>Core Production Takeaways</h4>
                <ul className="space-y-2 mt-2">
                  {activeArticle.content.takeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="blog-modal-section">
                <h4>Implementation Walkthrough</h4>
                <div className="space-y-4 mt-3">
                  {activeArticle.content.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]"
                    >
                      <h5 className="text-sm font-bold text-[var(--text)] mb-1">
                        {step.title}
                      </h5>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {activeArticle.content.promptRecipe && (
                <div className="blog-modal-section">
                  <h4>Copy-Pasteable Prompt Blueprint</h4>
                  <div className="blog-prompt-snippet">
                    {activeArticle.content.promptRecipe}
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-4">
                <button
                  onClick={() => {
                    setActiveArticle(null);
                    navigate("/app");
                  }}
                  className="hiw-btn-primary"
                >
                  <span>Open Studio &amp; Try This Guide</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => setActiveArticle(null)}
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  Close Reader
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          5. PROMPT RECIPE NEWSLETTER CARD
          ==================================================================== */}
      <section className="blog-nl-section" aria-label="Prompt Newsletter">
        <div className="blog-container">
          <div className="blog-nl-card">
            <h3>Get the Top 25 Video Bible™ Prompt Formulas</h3>
            <p>
              Download our battle-tested prompt blueprints for historical documentaries, sci-fi lore, and
              viral faceless YouTube automation channels. Delivered directly to your inbox.
            </p>

            {subscribed ? (
              <div className="inline-flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-semibold border border-emerald-500/20">
                <CheckCircle2 size={18} />
                <span>Success! The 25 Prompt Formulas pack is on its way to your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="blog-nl-form-row">
                <input
                  type="email"
                  placeholder="Enter your creator email address..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="blog-nl-input"
                  required
                />
                <button type="submit" className="hiw-btn-primary">
                  <span>Download Prompt Pack</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. FAQ ACCORDION SECTION
          ==================================================================== */}
      <section className="blog-faq-section" aria-label="Guides FAQ">
        <div className="blog-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="blog-badge">
              <Sparkles size={14} />
              <span>Learning FAQ</span>
            </div>
            <h2 className="hiw-stage-title">Frequently Asked Questions</h2>
            <p className="hiw-stage-desc">
              Common questions on applying these tutorials to your YouTube channel production.
            </p>
          </div>

          <div className="blog-faq-list">
            {[
              {
                q: "Are these guides suitable for creators with zero video editing experience?",
                a: "Yes, 100%. Every guide is written with step-by-step clarity. Because ScenoraEdits automates transcription, character consistency, and audio ducking, you don't need complex NLE experience with Premiere Pro or DaVinci Resolve.",
              },
              {
                q: "Can I use the prompt recipes with my own custom art styles?",
                a: "Absolutely. The prompt formulas are designed as modular templates. You can easily swap style tags (e.g. from 'ARRI Alexa 35mm' to 'Anime Cel Shaded' or 'Oil Painting') while preserving character seed locks.",
              },
              {
                q: "Do I need to pay for any external plugins to follow these tutorials?",
                a: "No external plugins are required. Everything documented in our guides runs natively inside the ScenoraEdits web studio and local daemon.",
              },
              {
                q: "How frequently are new tutorials and engineering deep-dives published?",
                a: "We publish new engineering deep-dives and creator playbooks bi-weekly, covering model updates, retention experiments, and YouTube algorithm shifts.",
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="blog-faq-item">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="blog-faq-question"
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
                    <div className="blog-faq-answer">
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
          7. HIGH-CONVERTING BOTTOM CALL TO ACTION
          ==================================================================== */}
      <section className="blog-cta-section" aria-label="Get Started">
        <div className="blog-container">
          <div className="blog-cta-banner">
            <h2>Ready to Put These Guides into Practice?</h2>
            <p>
              Launch ScenoraEdits Studio and experience character continuity, automated audio ducking,
              and 1080p rendering on your own videos today.
            </p>

            <div className="blog-cta-actions">
              <button
                onClick={() => navigate("/app")}
                className="hiw-btn-primary"
                id="blog-bottom-primary-cta"
              >
                <span>Launch Studio Free</span>
                <ArrowRight size={17} />
              </button>

              <button
                onClick={() => navigate("/features")}
                className="hiw-btn-secondary"
                id="blog-bottom-features-cta"
              >
                <span>Explore All Features</span>
              </button>
            </div>

            <div className="blog-cta-subtext">
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

export default BlogPage;
