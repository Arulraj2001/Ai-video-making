import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { SiteContainer } from "../../components/public/SiteContainer";
import { SectionHeader } from "../../components/public/SectionHeader";
import {
  ArrowUpRight,
  BookOpen,
  Cpu,
  Film,
  Sparkles,
  Send,
  CheckCircle2,
} from "lucide-react";

export const BlogPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const categories = [
    { id: "all", label: "All Articles" },
    { id: "bible", label: "Video Bible" },
    { id: "gpu", label: "Offline GPU" },
    { id: "workflow", label: "Playbooks" },
    { id: "engineering", label: "Engineering" },
  ];

  const articles = [
    {
      id: 1,
      title: "Mastering Character Consistency Across 60+ AI Video Scenes",
      category: "bible",
      categoryLabel: "Video Bible",
      icon: <BookOpen size={13} />,
      date: "Sep 2026",
      readTime: "5 min read",
      author: "Scenora Research",
      excerpt:
        "Anchoring character facial geometry and wardrobe tokens into your prompt engine completely stops subtle face drift across multi-scene documentary projects.",
      featured: true,
    },
    {
      id: 2,
      title: "Running SANA-Sprint 1.6B Locally on Consumer RTX 4060",
      category: "gpu",
      categoryLabel: "Hardware & GPU",
      icon: <Cpu size={13} />,
      date: "Aug 2026",
      readTime: "7 min read",
      author: "Engineering",
      excerpt:
        "Step-by-step setup for running 1-step diffusion locally on 4GB VRAM consumer GPUs — achieving sub-second frame generation without third-party API fees.",
      featured: false,
    },
    {
      id: 3,
      title: "Optimal Pacing: Matching Timestamps to Storyboard Scene Cuts",
      category: "workflow",
      categoryLabel: "Workflow",
      icon: <Film size={13} />,
      date: "Aug 2026",
      readTime: "4 min read",
      author: "Creator Community",
      excerpt:
        "Why cutting every 2.5–4.5 seconds dramatically improves audience retention on YouTube Shorts and Instagram Reels, with data from 2,400+ projects.",
      featured: false,
    },
    {
      id: 4,
      title: "Cloudflare Workers AI Quota Management for Daily Video Production",
      category: "gpu",
      categoryLabel: "Cloud Inference",
      icon: <Cpu size={13} />,
      date: "Jul 2026",
      readTime: "6 min read",
      author: "Engineering",
      excerpt:
        "How to distribute 25 free Cloudflare daily credits across a 12-scene project, leverage Pollinations.ai as a hot fallback, and avoid deadline blockers.",
      featured: false,
    },
    {
      id: 5,
      title: "Building a 10-Episode YouTube Series with Scenora Video Bible",
      category: "workflow",
      categoryLabel: "Case Study",
      icon: <BookOpen size={13} />,
      date: "Jul 2026",
      readTime: "9 min read",
      author: "Marcus Chen",
      excerpt:
        "How one 280K-subscriber creator cut production time from 3 days to under 4 hours per episode using Video Bible character anchoring.",
      featured: false,
    },
    {
      id: 6,
      title: "Understanding FFmpeg Multi-Track Audio Ducking in ScenoraEdits",
      category: "engineering",
      categoryLabel: "Engineering",
      icon: <Film size={13} />,
      date: "Jun 2026",
      readTime: "8 min read",
      author: "Engineering",
      excerpt:
        "How ScenoraEdits coordinates three independent FFmpeg audio streams—visual clips, voiceover speech, and ambient BGM—for frame-accurate 1080p MP4 exports.",
      featured: false,
    },
  ];

  const filteredArticles =
    activeCategory === "all"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
  };

  return (
    <div className="space-y-0">
      {/* ─── HERO HEADER ─────────────────────────────────────────────────────────── */}
      <section className="site-section-compact border-b border-[var(--color-border-subtle)]">
        <SiteContainer>
          <SectionHeader
            align="left"
            eyebrow="Editorial Publication"
            eyebrowIcon={<Sparkles size={12} />}
            title="Creator Guides &amp; Architecture"
            description="Engineering deep dives, offline GPU tutorials, and storytelling playbooks for creators building with ScenoraEdits."
          />
        </SiteContainer>
      </section>

      {/* ─── FEATURED ARTICLE (Large Asymmetric Layout) ─────────────────────────── */}
      <section className="site-section bg-[var(--color-surface)]">
        <SiteContainer>
          <div className="card-feature p-7 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-[var(--color-border-subtle)]">
            <div className="max-w-xl space-y-3">
              <div className="flex items-center gap-3">
                <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
                  FEATURED ARTICLE
                </span>
                <span className="text-xs meta-mono text-[var(--color-text-muted)]">5 min read</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--color-text)] leading-snug">
                Mastering Character Consistency Across 60+ AI Video Scenes
              </h2>
              <p className="prose-body text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Anchoring character facial geometry and wardrobe tokens directly into the Scenora prompt engine prevents subtle face drift across multi-scene documentary projects.
              </p>
              <div className="pt-2 flex items-center gap-3 text-xs meta-mono text-[var(--color-text-muted)]">
                <span>By Scenora Research</span>
                <span>•</span>
                <span>Sep 2026</span>
              </div>
            </div>

            <div className="shrink-0">
              <Button variant="primary" size="md" rightIcon={<ArrowUpRight size={14} />} className="font-bold">
                Read Guide
              </Button>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── CATEGORY FILTER CHIPS ──────────────────────────────────────────────── */}
      <section className="py-6 border-b border-[var(--color-border-subtle)]">
        <SiteContainer>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === c.id
                    ? "bg-[var(--color-primary)] text-white font-bold"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border-subtle)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ─── 3-COLUMN ARTICLE GRID (Properly Proportioned Cards) ────────────────── */}
      <section className="site-section bg-[var(--color-surface)]">
        <SiteContainer>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredArticles.map((a) => (
              <div
                key={a.id}
                className="card-content p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="pill-tag-mono bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] flex items-center gap-1 font-bold">
                      {a.icon} {a.categoryLabel}
                    </span>
                    <span className="text-[10px] meta-mono text-[var(--color-text-muted)]">{a.readTime}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold font-display text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                    {a.title}
                  </h3>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {a.excerpt}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] meta-mono text-[var(--color-text-muted)]">
                  <span>{a.author}</span>
                  <ArrowUpRight size={13} className="group-hover:text-[var(--color-primary)] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ─── NEWSLETTER SUBSCRIPTION DISPATCH ───────────────────────────────────── */}
      <section className="site-section border-t border-[var(--color-border-subtle)] pb-24">
        <SiteContainer>
          <div className="card-feature p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto">
            <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
              WEEKLY PLAYBOOKS
            </span>

            <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--color-text)]">
              Subscribe to the Scenora Dispatch
            </h2>

            <p className="prose-body text-xs sm:text-sm text-[var(--color-text-secondary)] mx-auto leading-relaxed">
              New SANA-Sprint GPU setups, prompt injection techniques, and timeline editing workflows delivered every Thursday.
            </p>

            {newsletterSubscribed ? (
              <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-success-subtle)] text-[var(--color-success)] text-xs font-bold">
                <CheckCircle2 size={14} />
                <span>You are subscribed! Welcome to the creator dispatch.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto pt-1">
                <input
                  type="email"
                  placeholder="creator@channel.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] font-mono"
                  required
                />
                <Button type="submit" variant="primary" size="sm" rightIcon={<Send size={13} />} className="font-bold">
                  Subscribe
                </Button>
              </form>
            )}

            <p className="text-[10px] meta-mono text-[var(--color-text-muted)]">
              No spam. Unsubscribe at any time.
            </p>
          </div>
        </SiteContainer>
      </section>
    </div>
  );
};
