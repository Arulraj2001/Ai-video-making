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
  category: "automation" | "videobible" | "prompting" | "audio";
  categoryLabel: string;
  readTime: string;
  title: string;
  excerpt: string;
  author: string;
  image: string;
  content: {
    summary: string;
    takeaways: string[];
    sections?: { heading: string; text: string }[];
    steps: { title: string; desc: string }[];
    promptRecipe?: string;
  };
}

const allArticles: GuideArticle[] = [
  {
    id: "faceless-youtube-guide-2026",
    category: "automation",
    categoryLabel: "Faceless Channels",
    readTime: "10 min read",
    title: "How to Make a Faceless YouTube Video Using AI Images in 2026 (Free)",
    excerpt:
      "A complete step-by-step tutorial on scripting, voiceover generation, timeline splitting, prompt consistency, and exporting a 1080p video ready for YouTube monetization without a camera.",
    author: "Alex Vance • Lead Pipeline Engineer",
    image: "/assets/hero_astronaut_main.jpg",
    content: {
      summary:
        "Faceless YouTube channels represent one of the fastest-growing media formats today. Channels in history, science, true crime, and finance produce 10–20 minute narratives that pull millions of views without ever showing a creator's face. The bottleneck has always been production: finding stock footage or generating hundreds of disjointed AI images. This guide walks through the modern scene-based workflow that cuts production time to under 35 minutes.",
      takeaways: [
        "Acoustic breath-pause detection splits voiceovers into natural 4–8 second scene boundaries automatically.",
        "Video Bible seed-locking eliminates character face morphing and costume degradation across multi-scene scripts.",
        "Ken Burns camera zooms (1.15x push) and kinetic subtitles keep viewer retention above 65% on long-form uploads.",
        "Exporting in 1080p 60fps MP4 gives you 100% commercial ownership with zero watermarks for instant YouTube AdSense monetization.",
      ],
      sections: [
        {
          heading: "The Anatomy of a High-Retention Faceless Video",
          text: "Successful faceless videos rely on three pillars: the 3-second hook (an immediate punchy statement), continuous visual rhythm (changing the visual every 4–8 seconds), and auditory clarity (voiceover at 0dB with music ducked to -14dB). When viewers see a new relevant visual synchronized with every spoken idea, watch time surges.",
        },
        {
          heading: "Monetization Compliance: Avoiding YouTube's Repetitive Content Policy",
          text: "YouTube actively demonetizes automated channels that stitch together generic slideshows or low-effort AI loops. To stay fully monetized, your video must present an original narrative, synchronized scene-specific artwork, and custom editorial direction. ScenoraEdits produces unique timeline compositions where every frame corresponds to a specific spoken sentence.",
        },
      ],
      steps: [
        {
          title: "Step 1: Ingest Voiceover Audio or Script",
          desc: "Upload an MP3/WAV from ElevenLabs or your microphone — or paste text to generate natural neural speech via built-in Edge-TTS. Whisper slices the recording into scenes based on speech pauses.",
        },
        {
          title: "Step 2: Lock Visual Consistency in Video Bible™",
          desc: "Define your main character's physical appearance, wardrobe anchors, and lighting style. Choose a cinematic preset (e.g., 35mm Film or Dark Fantasy) to ensure artistic continuity.",
        },
        {
          title: "Step 3: Assign One Image to Each Scene Beat",
          desc: "For each scene card, drop your own artwork or generate a scene-specific image using AI. Re-roll or swap any individual shot in 1 click without affecting neighboring scenes.",
        },
        {
          title: "Step 4: Apply Motion, Captions & Ducking",
          desc: "Add Ken Burns slow zooms, select TikTok Bold or Netflix subtitle typography, and let automatic audio ducking balance your soundtrack.",
        },
        {
          title: "Step 5: Export 1080p 60fps Master",
          desc: "Render a broadcast-ready MP4 file with zero watermarks and full commercial copyright ownership.",
        },
      ],
      promptRecipe:
        "cinematic medium shot, Commander Vance in weathered lunar armor, amber cockpit telemetry glow, 35mm anamorphic lens, ARRI Alexa LF --seed 8492041 --style cinematic",
    },
  },
  {
    id: "podcast-to-youtube-video-guide",
    category: "audio",
    categoryLabel: "Podcasting",
    readTime: "8 min read",
    title: "How to Turn a Podcast Episode into a YouTube Video (Free)",
    excerpt:
      "Transform raw audio conversations and podcast episodes into chaptered visual YouTube videos and viral vertical clips without expensive editing software.",
    author: "Sarah Jenkins • Audio Engineer",
    image: "/assets/scene_1_wide.jpg",
    content: {
      summary:
        "Over 50% of podcast listeners now consume episodes primarily on YouTube. Releasing audio-only files with a static cover image results in disastrous click-away rates within 60 seconds. This guide details how to take full podcast recordings or highlight clips, segment them into topic chapters, assign relevant visual slides or imagery, and publish engaging 16:9 YouTube videos alongside vertical Shorts.",
      takeaways: [
        "Visual variety boosts podcast watch-time on YouTube by more than 300% compared to a static thumbnail.",
        "Segmenting by topic allows viewers to scrub directly to interesting discussion points.",
        "Automatic audio ducking ensures background ambiance never masks host or guest voices.",
        "Exporting vertical 9:16 Shorts from the same timeline drives viral discovery on TikTok and YouTube feeds.",
      ],
      sections: [
        {
          heading: "Why Static Thumbnail Podcasts Fail on YouTube",
          text: "YouTube's recommendation algorithm optimizes for Average Percentage Viewed (APV). When viewers see a frozen image for 45 minutes, their engagement drops, signal-boosting drops, and the video stops receiving browse impressions. By introducing scene-based visuals — quotes, speaker portraits, data charts — viewer retention remains elevated throughout the episode.",
        },
        {
          heading: "Captions for the Muted Majority",
          text: "Over 70% of mobile video feeds are initially viewed with the sound muted. Adding dynamic word-level subtitles ensures your podcast hook stops scrollers instantly, converting casual browsers into committed listeners.",
        },
      ],
      steps: [
        {
          title: "Step 1: Import Full Episode Audio",
          desc: "Upload your podcast MP3 or WAV. Whisper transcribes speech and detects conversational pauses to create natural topic scenes.",
        },
        {
          title: "Step 2: Brand the Episode Workspace",
          desc: "Set your show font, color accents, and host/guest lower-third nameplates in Stage 2.",
        },
        {
          title: "Step 3: Map Segment Visuals & Infographics",
          desc: "Assign speaker headshots, relevant news photos, quotes, or topic illustrations to each spoken chapter.",
        },
        {
          title: "Step 4: Enable Kinetic Subtitles & Motion",
          desc: "Add animated word-by-word captions so mobile scrollers can read along even with audio muted.",
        },
        {
          title: "Step 5: Export Full Episode + 9:16 Shorts",
          desc: "Download full 1080p landscape video for your channel, plus lightweight vertical clips for social teasers.",
        },
      ],
    },
  },
  {
    id: "best-tools-combine-images-audio-video",
    category: "automation",
    categoryLabel: "Tool Comparisons",
    readTime: "9 min read",
    title: "Best Free Tools to Combine Images and Audio Into a Video in 2026",
    excerpt:
      "A rigorous 5-way breakdown comparing ScenoraEdits, Canva, CapCut, Fliki, and traditional desktop NLEs for audio-first creators.",
    author: "Marcus Brody • YouTube Growth Strategist",
    image: "/assets/scene_2_profile.jpg",
    content: {
      summary:
        "Creators frequently need to combine spoken voiceovers with still images to make videos. But the existing tools fall into two extremes: complex desktop NLEs (Premiere, DaVinci) that take hours of manual timeline alignment, or generic AI tools that generate random 5-second video loops with no scene-by-scene control. Here is an honest, technical comparison of the 5 leading solutions in 2026.",
      takeaways: [
        "ScenoraEdits is purpose-built for audio-first workflows: audio slicing, discrete scene image assignment, and BYOK AI keys.",
        "Canva is excellent for static slides but lacks acoustic transcription and automatic pause-based scene alignment.",
        "CapCut offers great mobile filters, but managing character consistency across 40+ cuts requires tedious manual work.",
        "Fliki and InVideo mark up AI generations by 300–500% with restrictive token systems and watermarked free exports.",
      ],
      sections: [
        {
          heading: "The Core Difference: Scene-Level Control vs Generic Loops",
          text: "Generic AI video generators produce short, unpredictable video loops. If second 14 has a bizarre visual artifact, you have to regenerate the entire video. ScenoraEdits treats video as a discrete composition: every scene has its own image slot that you can swap, edit, or regenerate independently in 1 click.",
        },
        {
          heading: "Cost Comparison: Subscriptions vs BYOK (Bring Your Own Key)",
          text: "Traditional platforms charge $30–$80/month for image generation credits that expire at month's end. ScenoraEdits lets you connect your own OpenAI or Flux API key, paying raw developer pricing (~$0.003 to $0.04 per image), or generate completely free using built-in engines.",
        },
      ],
      steps: [
        {
          title: "1. Evaluate Your Publishing Cadence",
          desc: "If you publish 1–2 videos per month, traditional editors might suffice. If you publish 2–5 videos weekly, automated scene composition is essential.",
        },
        {
          title: "2. Check Licensing & Watermark Policies",
          desc: "Ensure your tool grants 100% commercial YouTube rights and leaves zero watermarks on exported files.",
        },
        {
          title: "3. Verify Sync Drift on Long Renders",
          desc: "Test whether 15+ minute renders stay in sync. ScenoraEdits guarantees <0.05s variance via backend FFmpeg demuxing.",
        },
      ],
    },
  },
  {
    id: "byok-ai-image-generation-guide",
    category: "prompting",
    categoryLabel: "Creator Economics",
    readTime: "7 min read",
    title: "How to Use Your Own API Key to Generate AI Images for Video (BYOK Guide)",
    excerpt:
      "Stop paying 400% SaaS markups on AI credits. Learn how to connect OpenAI DALL-E 3, Gemini Imagen 3, and Flux keys to generate visuals at raw cost.",
    author: "David Chen • Systems Architect",
    image: "/assets/scene_3_landscape.jpg",
    content: {
      summary:
        "The SaaS AI video industry is built on massive credit markups: charging $1.00 for an image generation that costs $0.03 via API. Bring Your Own Key (BYOK) flips the economics back to the creator. By connecting your own developer API keys, you generate unlimited visuals inside ScenoraEdits Studio at raw provider cost.",
      takeaways: [
        "OpenAI DALL-E 3 costs ~$0.04 per image directly on your OpenAI billing dashboard.",
        "Flux Schnell via Fal.ai costs ~$0.003 per image — 300 images cost less than $1.00.",
        "Built-in Pollinations engine allows 100% free AI generation with zero keys required.",
        "API keys are encrypted with AES-256 in client-isolated vaults and never shared or logged.",
      ],
      sections: [
        {
          heading: "Where to Get Your Provider Keys",
          text: "Obtaining keys takes under 2 minutes: visit platform.openai.com for DALL-E 3, fal.ai for Flux, or aistudio.google.com for Gemini Imagen 3. Add $5 of credit, generate a secret key, and paste it into ScenoraEdits Studio settings.",
        },
        {
          heading: "Zero Markup Architecture",
          text: "ScenoraEdits does not act as a credit middleman. Requests go directly from your studio session to the model provider using your credentials, with zero token tax or artificial rate limits.",
        },
      ],
      steps: [
        {
          title: "Step 1: Open Studio API Keys Vault",
          desc: "Navigate to /app/api-keys in ScenoraEdits Studio. The vault is encrypted client-side with AES-256.",
        },
        {
          title: "Step 2: Paste Your Provider Secret Key",
          desc: "Enter your OpenAI (sk-...), Fal.ai (fal-key-...), or Google Gemini key. Click Save.",
        },
        {
          title: "Step 3: Generate Visuals per Scene",
          desc: "In Stage 3 Storyboard, select your preferred provider from the dropdown. Images generate in 2–4 seconds.",
        },
      ],
    },
  },
  {
    id: "video-bible-ai-consistency-guide",
    category: "videobible",
    categoryLabel: "AI Consistency",
    readTime: "8 min read",
    title: "What is a Video Bible and Why It Matters for AI Video Consistency",
    excerpt:
      "Why generic AI video tools fail at long stories, and how a persistent Video Bible eliminates facial morphing and art style drift across 50+ scenes.",
    author: "Elena Rostova • AI Art Director",
    image: "/assets/hero_astronaut_main.jpg",
    content: {
      summary:
        "The number one complaint about AI-generated video is inconsistency. In Scene 1, your hero is a 30-year-old astronaut with short dark hair. By Scene 4, she has morphed into a blonde teenager wearing a different helmet. Video Bible™ solves this structural flaw by establishing permanent visual anchors before generating any scene.",
      takeaways: [
        "Mathematical seed pinning preserves underlying facial bone structure and proportions.",
        "Wardrobe descriptor tags ensure costumes, uniforms, and props remain persistent.",
        "Global lighting and lens rules create the optical illusion of a single physical camera shoot.",
        "Negative prompt rules filter out plastic skin, extra limbs, and stylistic degradation.",
      ],
      sections: [
        {
          heading: "How Diffusion Drift Happens",
          text: "Diffusion models generate images by denoising random latent noise. Without explicit anchor conditioning, each prompt execution starts from an arbitrary noise field, causing dramatic shifts in anatomy, clothing, and color palette between consecutive shots.",
        },
        {
          heading: "The 3 Layers of Video Bible Conditioning",
          text: "1. Character DNA (facial seed, eye color, age, bone structure). 2. Material anchors (wardrobe fabrics, insignia, helmet design). 3. Camera atmosphere (35mm lens, volumetric rim lighting, film grain texture).",
        },
      ],
      steps: [
        {
          title: "1. Establish Character Sheet in Stage 2",
          desc: "Name your protagonist and specify non-negotiable physical descriptors and costume tags.",
        },
        {
          title: "2. Lock the Primary Anchor Seed",
          desc: "Generate your initial close-up portrait and pin the seed number into the project's Video Bible registry.",
        },
        {
          title: "3. Inherit Visual DNA Across All Scenes",
          desc: "Every scene prompt automatically injects your Video Bible rules, ensuring seamless narrative continuity.",
        },
      ],
      promptRecipe:
        "profile shot, Elena Croft in Mk IV lunar EVA suit, amber cockpit telemetry glow, 35mm anamorphic lens, ARRI Alexa LF --seed 8492041 --style cinematic",
    },
  },
];

export const BlogPage: React.FC = () => {
  const { navigate } = useRouter();

  useSEO({
    title: "Creator Guides & Engineering Blog — ScenoraEdits",
    description:
      "Actionable tutorials and playbooks for high-velocity YouTube creators. Master faceless video creation, podcast video conversion, BYOK keys, and Video Bible consistency.",
    canonical: "https://scenoraedits.web.app/blog",
    ogTitle: "Creator Guides & Engineering Blog — ScenoraEdits",
    ogDescription:
      "Step-by-step playbooks for faceless YouTube creators: audio scene parsing, character consistency, BYOK image keys, and 1080p export.",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeArticle, setActiveArticle] = useState<GuideArticle | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
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

  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || article.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const featuredArticle = allArticles[0];

  return (
    <div className="blog-page">
      {/* 1. HERO SECTION */}
      <section className="blog-hero-section" aria-label="Blog Header">
        <div className="blog-container">
          <div className="blog-badge">
            <Sparkles size={14} className="text-[#FF6B00]" />
            <span>The Creator Playbook</span>
          </div>

          <h1 className="blog-hero-h1">
            Master the Craft of{" "}
            <span className="blog-gradient-text">Scene-Based Video Production</span>
          </h1>

          <p className="blog-hero-lead">
            In-depth guides, technical breakdowns, and playbooks for faceless YouTube channels, podcasters, and visual storytellers.
          </p>

          <div className="blog-search-wrap">
            <div className="blog-search-bar">
              <Search size={18} className="text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search guides (e.g. faceless, podcast, BYOK, Video Bible)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="blog-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[var(--text-muted)] hover:text-[var(--text)]"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="blog-categories-pill-row">
              {[
                { id: "all", label: "All Guides" },
                { id: "automation", label: "Faceless & Automation" },
                { id: "audio", label: "Audio & Podcasts" },
                { id: "videobible", label: "Video Bible & Consistency" },
                { id: "prompting", label: "BYOK & Economics" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`blog-cat-pill ${selectedCategory === cat.id ? "active" : ""}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED HERO ARTICLE */}
      {selectedCategory === "all" && !searchQuery && featuredArticle && (
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
                  <div className="blog-featured-badge">
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

      {/* 3. ARTICLES DIRECTORY */}
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

      {/* 4. ARTICLE READER MODAL */}
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

              {activeArticle.content.sections && activeArticle.content.sections.map((sec, idx) => (
                <div key={idx} className="blog-modal-section">
                  <h4>{sec.heading}</h4>
                  <p>{sec.text}</p>
                </div>
              ))}

              <div className="blog-modal-section">
                <h4>Step-by-Step Implementation</h4>
                <div className="space-y-4 mt-3">
                  {activeArticle.content.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]"
                    >
                      <h5 className="text-sm font-bold text-[var(--text)] mb-1">
                        {step.title}
                      </h5>
                      <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {activeArticle.content.promptRecipe && (
                <div className="blog-modal-section">
                  <h4>Example Video Bible Prompt Formula</h4>
                  <div className="p-3 bg-black/90 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto">
                    {activeArticle.content.promptRecipe}
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={() => {
                    setActiveArticle(null);
                    navigate("/app");
                  }}
                  className="px-6 py-3 rounded-xl bg-[#FF6B00] text-white text-sm font-bold shadow-lg flex items-center gap-2"
                >
                  <span>Build This Video in Studio Free →</span>
                </button>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="text-xs text-[var(--text-secondary)] hover:underline"
                >
                  Close Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. NEWSLETTER SUBSCRIPTION */}
      <section className="blog-nl-section" aria-label="Newsletter">
        <div className="blog-container">
          <div className="blog-nl-card">
            <h3>Get Weekly Prompt Blueprints &amp; Strategy Packs</h3>
            <p>
              Join 15,000+ creators receiving weekly Video Bible prompts, retention tactics, and video production playbooks.
            </p>

            {subscribed ? (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-500 font-semibold py-2">
                <CheckCircle2 size={18} />
                <span>You're subscribed! Check your inbox for the prompt pack.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="blog-nl-form">
                <input
                  type="email"
                  placeholder="Enter your creator email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="blog-nl-input"
                  required
                />
                <button type="submit" className="blog-nl-btn">
                  <span>Subscribe</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="blog-faq-section" aria-label="Blog FAQ">
        <div className="blog-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-[var(--text)]">Guides &amp; Production FAQ</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Common questions about our tutorials and video creation workflows.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {[
              {
                q: "Are these strategies applicable to YouTube monetization?",
                a: "Yes. All guides focus on high-effort, original storytelling that complies 100% with YouTube's channel monetization policies.",
              },
              {
                q: "Can I follow these guides using only the free features?",
                a: "Yes. Every tutorial can be executed completely free using ScenoraEdits built-in voice synthesis, Pollinations image generation, and 1080p export.",
              },
              {
                q: "How often are new guides published?",
                a: "We publish new creator guides and algorithm case studies every week.",
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
    </div>
  );
};
