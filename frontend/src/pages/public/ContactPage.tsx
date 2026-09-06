import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { SiteContainer } from "../../components/public/SiteContainer";
import { SectionHeader } from "../../components/public/SectionHeader";
import {
  Mail,
  MessageSquare,
  GitBranch,
  Send,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Cpu,
} from "lucide-react";

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [inquiryType, setInquiryType] = useState<string>("technical");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  const contactMethods = [
    {
      icon: <Mail size={18} />,
      title: "Direct Engineering Email",
      desc: "For pipeline configuration, local GPU setup, and enterprise assistance.",
      value: "support@scenoraedits.ai",
      link: "mailto:support@scenoraedits.ai",
      sla: "< 24h SLA",
      accent: "var(--color-primary)",
    },
    {
      icon: <GitBranch size={18} />,
      title: "GitHub Issues & Discussions",
      desc: "Bug reports, feature RFCs, and open-source diffusers contributions.",
      value: "github.com/Arulraj2001/Ai-video-making",
      link: "https://github.com/Arulraj2001/Ai-video-making",
      sla: "Community Supported",
      accent: "var(--color-secondary)",
    },
    {
      icon: <MessageSquare size={18} />,
      title: "Creator Community Discord",
      desc: "Share Video Bible prompts, storyboard variants, and editing workflows.",
      value: "discord.gg/scenoraedits",
      link: "#",
      sla: "Active Daily Community",
      accent: "var(--scenora-rust)",
    },
  ];

  return (
    <div className="space-y-0">
      {/* ─── HERO HEADER ─────────────────────────────────────────────────────────── */}
      <section className="site-section-compact border-b border-[var(--color-border-subtle)]">
        <SiteContainer>
          <SectionHeader
            align="left"
            eyebrow="Studio Concierge"
            eyebrowIcon={<Sparkles size={12} />}
            title="Support &amp; Creator Concierge"
            description="Have questions about your project, local RTX GPU setup, or the Video Bible? We are here to help."
          />
        </SiteContainer>
      </section>

      {/* ─── SPLIT-SCREEN CHANNELS & FORM ───────────────────────────────────────── */}
      <section className="site-section bg-[var(--color-surface)]">
        <SiteContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Direct Support Channels (Col 5) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="text-[11px] meta-mono uppercase text-[var(--color-text-muted)] font-bold block mb-1">
                  DIRECT CHANNELS
                </span>
                <h3 className="text-lg font-bold font-display text-[var(--color-text)]">
                  Reach Us Directly
                </h3>
              </div>

              <div className="space-y-3">
                {contactMethods.map((m, i) => (
                  <a
                    key={i}
                    href={m.link}
                    target={m.link.startsWith("http") ? "_blank" : undefined}
                    rel={m.link.startsWith("http") ? "noreferrer" : undefined}
                    className="card-content p-4 flex flex-col gap-2 border border-[var(--color-border-subtle)] block hover:border-[var(--color-border)] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ background: m.accent }}
                      >
                        {m.icon}
                      </div>
                      <span className="text-[10px] meta-mono font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)]">
                        {m.sla}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text)]">{m.title}</h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>

                    <div className="pt-1 text-xs meta-mono text-[var(--color-primary)] font-semibold flex items-center gap-1">
                      <span>{m.value}</span>
                      <ExternalLink size={11} />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Right Column: Studio Inquiry Form (Col 7) */}
            <div className="lg:col-span-7 card-feature p-7 sm:p-9 space-y-5">
              <div className="space-y-1">
                <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
                  PRODUCTION INQUIRY
                </span>
                <h3 className="text-xl font-bold font-display text-[var(--color-text)]">
                  Send a Message to Engineering
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Fill out your project details and our team will get back to you within 24 hours.
                </p>
              </div>

              {submitted ? (
                <div className="p-8 rounded-xl bg-[var(--color-success-subtle)] border border-[var(--color-success)]/30 text-center space-y-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--color-text)]">Message Dispatched</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto leading-relaxed">
                    Ticket Reference: <strong className="font-mono text-[var(--color-primary)]">#SCN-{Math.floor(100000 + Math.random() * 900000)}</strong>.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                      setSubject("");
                    }}
                  >
                    Send Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Inquiry Type Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] meta-mono uppercase text-[var(--color-text-muted)] font-bold">
                      Inquiry Type
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "technical", label: "Pipeline & Technical" },
                        { id: "gpu", label: "GPU & SANA-Sprint Setup" },
                        { id: "commercial", label: "Studio / Enterprise" },
                        { id: "feedback", label: "Feature Proposal" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setInquiryType(t.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            inquiryType === t.id
                              ? "bg-[var(--color-primary)] text-white font-bold"
                              : "bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] meta-mono text-[var(--color-text-muted)] font-semibold">
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="Marcus Chen"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] meta-mono text-[var(--color-text-muted)] font-semibold">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="marcus@channel.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                        required
                      />
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="space-y-1">
                    <label className="text-[11px] meta-mono text-[var(--color-text-muted)] font-semibold">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SANA-Sprint VRAM allocation question on RTX 4060"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-1">
                    <label className="text-[11px] meta-mono text-[var(--color-text-muted)] font-semibold">
                      Message &amp; Project Details
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your project, audio length, or technical setup requirements..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                      required
                    />
                  </div>

                  <Button type="submit" variant="primary" size="md" className="w-full font-bold" rightIcon={<Send size={13} />}>
                    Dispatch Inquiry
                  </Button>
                </form>
              )}
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── QUICK SETUP GUIDANCE ────────────────────────────────────────────────── */}
      <section className="site-section-compact border-t border-[var(--color-border-subtle)] pb-24">
        <SiteContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="card-content p-5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text)]">
                <Cpu size={15} className="text-[var(--color-primary)]" />
                <span>Does Scenora work without an NVIDIA GPU?</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Yes. While SANA-Sprint 1.6B requires an RTX GPU for local acceleration, our cloud fallback engines (Cloudflare Workers AI and Pollinations.ai) run seamlessly on macOS, Intel/AMD CPUs, and laptops.
              </p>
            </div>
            <div className="card-content p-5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text)]">
                <Cpu size={15} className="text-[var(--color-secondary)]" />
                <span>How are FFmpeg binaries handled?</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                The Scenora backend automatically detects local FFmpeg installations with hardware NVENC flags. If hardware acceleration is unavailable, it gracefully defaults to software libx264 encoding.
              </p>
            </div>
          </div>
        </SiteContainer>
      </section>
    </div>
  );
};
