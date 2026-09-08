import React, { useState } from "react";
import { useRouter } from "../../router/Router";
import { useSEO } from "../../utils/seo";
import { api } from "../../services/api";
import "./ContactPage.css";
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  Mail,
  Cpu,
  CreditCard,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";

const GitHubIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const ContactPage: React.FC = () => {
  const { navigate } = useRouter();

  useSEO({
    title: "Contact Us & Creator Support — ScenoraEdits",
    description:
      "Get direct support for NVIDIA RTX GPU local configuration, Video Bible consistency, creator passes, and custom studio workflows. 24-hour response SLA guarantee.",
    canonical: "https://scenoraedits.web.app/contact",
    ogTitle: "Contact ScenoraEdits — Real-Time Support for YouTube Creators",
    ogDescription:
      "Reach out to the ScenoraEdits engineering team for local GPU setup, billing assistance, or faceless channel automation inquiries.",
  });

  // Form State
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("Technical & Local GPU Setup");
  const [channelUrl, setChannelUrl] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSubject = subject.trim();
    const trimmedChannelUrl = channelUrl.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (trimmedName.length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (trimmedMessage.length < 10) {
      const validationMessage = "Please provide at least 10 characters in your message.";
      setErrorMsg(validationMessage);
      return;
    }
    if (trimmedSubject.length > 150 || trimmedChannelUrl.length > 300 || trimmedMessage.length > 3000) {
      setErrorMsg("One or more fields exceed the allowed length.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      await api.submitContactInquiry({
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        channel_url: trimmedChannelUrl || undefined,
        message: trimmedMessage,
      });
      setSuccess(true);
      setMessage("");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit inquiry. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="contact-page">
      {/* ====================================================================
          1. HERO SECTION
          ==================================================================== */}
      <section className="contact-hero-section" aria-label="Contact Hero">
        <div className="contact-container">
          <div className="contact-badge">
            <Sparkles size={14} className="text-[#FF6B00]" />
            <span>Creator Support &amp; Engineering Help</span>
          </div>

          <h1 className="contact-hero-h1">
            We're Here to Help You{" "}
            <span className="contact-gradient-text">Scale Your Video Channel</span>
          </h1>

          <p className="contact-hero-lead">
            Have questions about configuring your local NVIDIA RTX GPU, setting up Video Bible™ character
            continuity, creator pass billing, or custom channel automation? Reach out directly.
          </p>
        </div>
      </section>

      {/* ====================================================================
          2. 3 QUICK-HELP CARDS
          ==================================================================== */}
      <section className="contact-pillars-section" aria-label="Support Pillars">
        <div className="contact-container">
          <div className="contact-pillars-grid">
            <div className="contact-pillar-card">
              <div className="contact-pillar-icon">
                <Cpu size={22} />
              </div>
              <h3>NVIDIA RTX GPU Assistance</h3>
              <p>
                Get direct help configuring local PyTorch, CUDA acceleration, and diffusion models on
                RTX 3060, 4070, 4080, and 4090 GPUs.
              </p>
              <span className="contact-pillar-tag">✓ 0 Credits Consumed</span>
            </div>

            <div className="contact-pillar-card">
              <div className="contact-pillar-icon">
                <CreditCard size={22} />
              </div>
              <h3>Passes, UPI &amp; Billing</h3>
              <p>
                Questions regarding 6-month or 1-year passes, instant Indian UPI UTR verification, BuyMeACoffee,
                or GST tax invoice generation.
              </p>
              <span className="contact-pillar-tag">✓ Instant Verification</span>
            </div>

            <div className="contact-pillar-card">
              <div className="contact-pillar-icon">
                <Zap size={22} />
              </div>
              <h3>Studio Channel Pipelines</h3>
              <p>
                Faceless channel automation, high-volume production setups, Bring Your Own Key (BYOK)
                integration, and custom API pipelines.
              </p>
              <span className="contact-pillar-tag">✓ Unlimited Scale</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. MAIN SECTION: FORM + DIRECT CHANNELS
          ==================================================================== */}
      <section className="contact-main-section" aria-label="Contact Form and Channels">
        <div className="contact-container">
          <div className="contact-main-grid">
            {/* Form Column */}
            <div className="contact-form-card">
              {success ? (
                <div className="contact-success-box">
                  <div className="contact-success-icon">
                    <CheckCircle2 size={30} />
                  </div>
                  <h3>Inquiry Received!</h3>
                  <p>
                    Thank you for reaching out. Your message has been routed to our engineering and creator
                    support queue. We reply within 24 hours.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="hiw-btn-secondary inline-flex items-center gap-2"
                  >
                    <span>Send Another Message</span>
                  </button>
                </div>
              ) : (
                <div>
                  <h2>Send Us a Message</h2>
                  <p className="form-subtitle">
                    Fill out the details below and our pipeline team will review your inquiry promptly.
                  </p>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 mb-5 flex items-center gap-2">
                      <AlertCircle size={15} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="contact-form-group">
                      <label className="contact-label" htmlFor="contact-name">
                        Your Name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        placeholder="e.g. Alex Rivera"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="contact-input"
                      />
                    </div>

                    <div className="contact-form-group">
                      <label className="contact-label" htmlFor="contact-email">
                        Email Address *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        placeholder="you@channel.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="contact-input"
                      />
                    </div>

                    <div className="contact-form-group">
                      <label className="contact-label" htmlFor="contact-subject">
                        Inquiry Topic *
                      </label>
                      <select
                        id="contact-subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="contact-select"
                      >
                        <option value="Technical & Local GPU Setup">Technical &amp; Local GPU Setup</option>
                        <option value="Creator Passes & Billing">Creator Passes, UPI &amp; Billing</option>
                        <option value="Video Bible Character Consistency">Video Bible™ Character Consistency</option>
                        <option value="Channel Automation & BYOK">Channel Automation &amp; BYOK Integration</option>
                        <option value="Feature Request & Feedback">Feature Request &amp; Feedback</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>

                    <div className="contact-form-group">
                      <label className="contact-label" htmlFor="contact-channel">
                        YouTube Channel or Website (Optional)
                      </label>
                      <input
                        id="contact-channel"
                        type="text"
                        placeholder="https://youtube.com/@yourchannel"
                        value={channelUrl}
                        onChange={(e) => setChannelUrl(e.target.value)}
                        className="contact-input"
                      />
                    </div>

                    <div className="contact-form-group">
                      <label className="contact-label" htmlFor="contact-message">
                        How can we help? *
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        minLength={10}
                        rows={4}
                        placeholder="Describe your question, GPU model, or workflow requirements (10+ characters)..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="contact-textarea"
                      />
                      <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                        Please enter at least 10 characters.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="hiw-btn-primary w-full justify-center"
                      id="contact-submit-btn"
                    >
                      <span>{submitting ? "Sending Inquiry..." : "Send Message to Engineering"}</span>
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar Column: Direct Channels */}
            <div className="contact-sidebar">
              <div className="contact-channel-card">
                <h3>Direct Creator Channels</h3>
                <p className="sub">Connect directly with our core engineering team through your preferred channel.</p>

                <a
                  href="mailto:support@scenoraedits.com"
                  className="contact-channel-item"
                >
                  <div className="contact-channel-icon">
                    <Mail size={18} />
                  </div>
                  <div className="contact-channel-info">
                    <div className="contact-channel-title">Official Email</div>
                    <div className="contact-channel-val">support@scenoraedits.com</div>
                  </div>
                  <ExternalLink size={13} className="text-[var(--text-muted)]" />
                </a>

                <a
                  href="https://discord.gg/scenoraedits"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-channel-item"
                >
                  <div className="contact-channel-icon">
                    <MessageSquare size={18} />
                  </div>
                  <div className="contact-channel-info">
                    <div className="contact-channel-title">Creator Discord</div>
                    <div className="contact-channel-val">Join 2,400+ video creators</div>
                  </div>
                  <ExternalLink size={13} className="text-[var(--text-muted)]" />
                </a>

                <a
                  href="https://github.com/Arulraj2001/Ai-video-making/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-channel-item"
                >
                  <div className="contact-channel-icon">
                    <GitHubIcon size={18} />
                  </div>
                  <div className="contact-channel-info">
                    <div className="contact-channel-title">GitHub Issue Tracker</div>
                    <div className="contact-channel-val">Bug reports &amp; release notes</div>
                  </div>
                  <ExternalLink size={13} className="text-[var(--text-muted)]" />
                </a>
              </div>

              {/* SLA Guarantee Card */}
              <div className="contact-sla-card">
                <h4>
                  <Clock size={16} />
                  <span>24-Hour Creator SLA</span>
                </h4>
                <p>
                  Every technical inquiry is reviewed directly by our core pipeline engineers. We aim to
                  resolve GPU configuration blockers within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. CONTACT FAQ SECTION
          ==================================================================== */}
      <section className="contact-faq-section" aria-label="Contact FAQ">
        <div className="contact-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="contact-badge">
              <Sparkles size={14} />
              <span>Support FAQ</span>
            </div>
            <h2 className="contact-hero-h1" style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}>
              Frequently Asked Questions
            </h2>
            <p className="contact-hero-lead" style={{ fontSize: "14px" }}>
              Quick answers about GPU compatibility, response timelines, and custom studio setups.
            </p>
          </div>

          <div className="contact-faq-list">
            {[
              {
                q: "What is the typical response time for technical support?",
                a: "Our core engineering team monitors inquiries continuously and guarantees a response within 24 hours. For urgent billing or activation queries, Indian UPI submissions are verified directly in our queue.",
              },
              {
                q: "Can you help me configure my local NVIDIA RTX GPU?",
                a: "Yes! If you have an NVIDIA GPU (RTX 3060, 3070, 3080, 4070, 4080, 4090), we can provide exact guidance on installing PyTorch with CUDA, allocating VRAM, and running completely free local generation.",
              },
              {
                q: "How do I request a feature or suggest a new AI model?",
                a: "We welcome creator feedback! Simply select 'Feature Request & Feedback' in the form or submit an issue on our GitHub repository. We prioritize features requested by active YouTube creators.",
              },
              {
                q: "Can I get an itemized tax invoice with GST attribution?",
                a: "Yes. After completing your Creator Pro pass, send an inquiry with your transaction reference number and billing legal name, and our team will issue an itemized tax invoice.",
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="contact-faq-item">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="contact-faq-question"
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
                    <div className="contact-faq-answer">
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
          5. BOTTOM CONVERSION BANNER
          ==================================================================== */}
      <section className="contact-cta-section" aria-label="Get Started">
        <div className="contact-container">
          <div className="contact-cta-banner">
            <h2>Ready to Start Producing Consistent AI Videos?</h2>
            <p>
              Experience the 5-stage automated production pipeline. Start free on your local GPU or
              explore how ScenoraEdits maintains character consistency.
            </p>

            <div className="contact-cta-actions">
              <button
                onClick={() => navigate("/app")}
                className="hiw-btn-primary"
                id="contact-bottom-studio-cta"
              >
                <span>Open Studio — Start Free</span>
                <ArrowRight size={17} />
              </button>

              <button
                onClick={() => navigate("/how-it-works")}
                className="hiw-btn-secondary"
                id="contact-bottom-hiw-cta"
              >
                <span>View How It Works</span>
              </button>
            </div>

            <div className="contact-cta-subtext">
              <span>✓ No credit card required</span>
              <span>✓ 24-Hour creator support</span>
              <span>✓ 100% Commercial YouTube rights</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
