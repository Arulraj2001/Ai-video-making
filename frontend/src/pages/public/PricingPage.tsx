import React, { useState, useEffect } from "react";
import { useRouter } from "../../router/Router";
import { useAuth } from "../../context/AuthContext";
import { useSEO, PAGE_SEO } from "../../utils/seo";
import { SiteContainer } from "../../components/public/SiteContainer";
import { Button } from "../../components/ui/Button";
import { api, type PlanConfigResponse } from "../../services/api";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Coffee,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const PricingPage: React.FC = () => {
  useSEO(PAGE_SEO.pricing);
  const { navigate } = useRouter();
  const { isAuthenticated } = useAuth();

  const [currency, setCurrency] = useState<"inr" | "usd">("inr");
  const [plan, setPlan] = useState<PlanConfigResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getYearlyPlan()
      .then((data) => {
        if (mounted) setPlan(data);
      })
      .catch(() => {
        // Fallback default
        if (mounted) {
          setPlan({
            plan_id: "scenora-pro-yearly",
            name: "ScenoraEdits Pro (Yearly)",
            price_inr: 2999,
            price_usd: 49,
            duration_days: 365,
            enabled: true,
            description:
              "Unlimited AI scene generation, priority cloud rendering, multi-aspect export, and Video Bible consistency for 1 full year.",
            upi_id: "scenoraedits@upi",
            upi_qr_url: "",
            bmc_url: "https://buymeacoffee.com/scenoraedits",
            features: [
              "Unlimited AI scene generations for 365 days",
              "Priority cloud rendering queue",
              "Full Video Bible consistency engine",
              "Multi-aspect ratio exports (16:9, 9:16, 1:1)",
              "Priority creator support SLA",
              "All upcoming Pro features included",
            ],
          });
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading && !plan) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleUpgradeClick = () => {
    if (isAuthenticated) {
      navigate("/app/upgrade");
    } else {
      navigate("/sign-in?returnUrl=/app/upgrade");
    }
  };

  const handleFreeClick = () => {
    if (isAuthenticated) {
      navigate("/app");
    } else {
      navigate("/sign-up");
    }
  };

  const priceInr = plan?.price_inr || 2999;
  const priceUsd = plan?.price_usd || 49;

  const faqs = [
    {
      q: "How does the annual membership and payment verification work?",
      a: "ScenoraEdits uses a direct creator payment model to keep subscription prices at lowest possible rates with 0% platform transaction fees. You make a direct transfer using UPI (Google Pay, PhonePe, Paytm, BHIM) in India or Buy Me a Coffee / International Card globally, then submit your transaction reference (UTR) or supporter name. Our admin team verifies transactions directly and activates your account within a few hours.",
    },
    {
      q: "How many scenes and videos can I generate with Pro Yearly?",
      a: "Pro Yearly provides 365 days of unlimited AI scene generations and video productions. There are no surprise metering charges, token drains, or artificial limits on how many projects you can assemble.",
    },
    {
      q: "What is Bring Your Own Key (BYOK)?",
      a: "If you prefer using your own AI provider keys (like Fal.ai, Stability, or OpenAI), you can configure them directly in your Studio Settings. Both Free Tier and Pro Yearly members can use BYOK without restrictions.",
    },
    {
      q: "Can I use rendered videos for monetized YouTube channels and commercial client work?",
      a: "Yes! All videos rendered on ScenoraEdits come with full commercial rights. You own your exported MP4s completely and can monetize them on YouTube, TikTok, Instagram Reels, or deliver them to paying clients.",
    },
    {
      q: "Can I renew or extend my membership before it expires?",
      a: "Absolutely. Submitting a renewal payment extends your active entitlement by another 365 days from your existing expiration date, so you never lose any remaining membership days.",
    },
  ];

  return (
    <div className="public-page relative bg-[var(--surface)] text-[var(--text)] pb-24">
      {/* ─── HERO HEADER ────────────────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-24 pb-12 text-center">
        <SiteContainer>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-xs">
              <Sparkles size={13} />
              <span>Simple, Transparent Creator Pricing</span>
            </div>

            <h1
              className="font-bold text-[var(--text)] tracking-tight text-balance font-display"
              style={{ fontSize: "clamp(2.1rem, 4vw, 3.2rem)" }}
            >
              One Predictable Pass.
              <br />
              <span className="text-[var(--color-primary)]">Unlimited Video Creation.</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
              No complex credit math, no pay-per-scene surprises. Get full access to ScenoraEdits' complete 5-stage production studio.
            </p>

            {/* Currency Switcher */}
            <div className="pt-4 flex items-center justify-center">
              <div className="inline-flex items-center p-1 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] text-xs font-semibold shadow-xs">
                <button
                  onClick={() => setCurrency("inr")}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    currency === "inr"
                      ? "bg-[var(--color-surface)] text-[var(--text)] font-bold shadow-xs border border-[var(--color-border)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <span>🇮🇳 India (INR ₹)</span>
                </button>
                <button
                  onClick={() => setCurrency("usd")}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    currency === "usd"
                      ? "bg-[var(--color-surface)] text-[var(--text)] font-bold shadow-xs border border-[var(--color-border)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <span>🌐 Global (USD $)</span>
                </button>
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── PRICING CARDS ─────────────────────────────────────────────────── */}
      <section className="py-6">
        <SiteContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Free Tier Card */}
            <div className="rounded-2xl p-8 bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col justify-between shadow-xs hover:border-[var(--color-border-subtle)] transition-all">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] meta-mono">
                    COMMUNITY TIER
                  </span>
                  <h3 className="text-2xl font-bold font-display text-[var(--text)] mt-1">Free Creator</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    Test the complete 5-stage pipeline, experiment with storyboarding, or bring your own API keys.
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-[var(--text)] font-display">
                    {currency === "inr" ? "₹0" : "$0"}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] meta-mono">/ forever</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-[var(--color-border-subtle)]">
                  <div className="text-xs font-bold uppercase text-[var(--text)] meta-mono tracking-wider">
                    Included Capabilities:
                  </div>
                  {[
                    "5 free cloud AI scene generations every month",
                    "Full 5-Stage studio (Script, Storyboard, Timeline, Canvas, Export)",
                    "Video Bible character & style consistency anchors",
                    "Multi-track timeline with audio scrubbing",
                    "720p & 1080p full HD MP4 rendering",
                    "BYOK support for unlimited custom API generations",
                    "Community support & documentation",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--text)]">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleFreeClick}
                  className="w-full font-bold justify-center"
                >
                  {isAuthenticated ? "Go to Creator Studio" : "Get Started Free"}
                </Button>
              </div>
            </div>

            {/* Pro Yearly Pass (Featured) */}
            <div className="relative rounded-2xl p-8 bg-[var(--color-surface)] border-2 border-[var(--color-primary)] flex flex-col justify-between shadow-xl ring-4 ring-[var(--color-primary)]/10">
              {/* Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--color-primary)] text-white text-[11px] font-bold meta-mono uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>Most Popular · 365 Days Access</span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] meta-mono">
                      ALL-ACCESS PASS
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      SAVE 75%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold font-display text-[var(--text)] mt-1">
                    {plan?.name || "ScenoraEdits Pro (Yearly)"}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    Designed for dedicated YouTube creators, editors, and production agencies creating weekly videos.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-[var(--text)] font-display">
                      {currency === "inr" ? `₹${priceInr.toLocaleString()}` : `$${priceUsd}`}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] meta-mono">/ 365 days</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1">
                    {currency === "inr"
                      ? `Just ₹${Math.round(priceInr / 12)} / month · One-time payment`
                      : `Just $${(priceUsd / 12).toFixed(2)} / month · One-time payment`}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[var(--color-border-subtle)]">
                  <div className="text-xs font-bold uppercase text-[var(--text)] meta-mono tracking-wider">
                    Everything in Free, plus:
                  </div>
                  {[
                    "Unlimited AI scene generations for 365 days",
                    "Priority cloud rendering queue (up to 3x faster export)",
                    "Full Video Bible character consistency engine",
                    "Multi-aspect ratio outputs (16:9 Landscape, 9:16 Shorts/Reels, 1:1 Square)",
                    "Advanced audio ducking & custom background music",
                    "Subtitle styling & burn-in caption mastering",
                    "Full commercial usage rights for client & monetized channels",
                    "Direct priority SLA creator support",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--text)] font-medium">
                      <CheckCircle2 size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight size={16} />}
                  onClick={handleUpgradeClick}
                  className="w-full font-bold justify-center shadow-md py-3 text-sm"
                >
                  Upgrade to Pro Yearly
                </Button>
                <p className="text-[11px] text-center text-[var(--text-muted)] mt-2">
                  Instant UPI & Card payments · Zero hidden fees
                </p>
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── PAYMENT METHODS EXPLAINER ──────────────────────────────────────── */}
      <section className="py-16">
        <SiteContainer>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                Accepted Payment Methods & Transparent Verification
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
                Direct creator-to-creator payment with instant activation upon verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Method 1: India UPI */}
              <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">India UPI & QR Code</h4>
                    <span className="text-[11px] text-[var(--text-muted)]">Google Pay · PhonePe · Paytm · BHIM</span>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Transfer directly to our official UPI ID <code className="font-mono text-[var(--color-primary)] font-bold">{plan?.upi_id || "scenoraedits@upi"}</code> or scan the verified QR code inside the Studio Upgrade portal. Submit your 12-digit UTR reference for instant tracking.
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>0% payment gateway markup · Instant UTR verification</span>
                </div>
              </div>

              {/* Method 2: International BMC */}
              <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Coffee size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">International (Global)</h4>
                    <span className="text-[11px] text-[var(--text-muted)]">Buy Me a Coffee · Credit Cards · PayPal</span>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  International creators can pay via Buy Me a Coffee using Visa, Mastercard, Amex, Apple Pay, or PayPal. Enter your supporter display name or order confirmation ID to link your yearly entitlement.
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>Secure 256-bit SSL international processing</span>
                </div>
              </div>
            </div>

            {/* 4-Step Verification Timeline */}
            <div className="p-6 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] meta-mono mb-4 text-center">
                How Verification & Activation Works
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                <div className="space-y-1.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center mx-auto">
                    1
                  </div>
                  <div className="text-xs font-bold text-[var(--text)]">Select Payment</div>
                  <p className="text-[11px] text-[var(--text-muted)]">Choose India UPI (₹) or Buy Me a Coffee ($).</p>
                </div>

                <div className="space-y-1.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center mx-auto">
                    2
                  </div>
                  <div className="text-xs font-bold text-[var(--text)]">Make Transfer</div>
                  <p className="text-[11px] text-[var(--text-muted)]">Send the exact yearly amount via your banking app.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center mx-auto">
                    3
                  </div>
                  <div className="text-xs font-bold text-[var(--text)]">Submit Reference</div>
                  <p className="text-[11px] text-[var(--text-muted)]">Enter your 12-digit UTR and optional screenshot.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center mx-auto">
                    4
                  </div>
                  <div className="text-xs font-bold text-[var(--text)]">Account Activated</div>
                  <p className="text-[11px] text-[var(--text-muted)]">Verified within hours for 365 days of full Pro access.</p>
                </div>
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── DETAILED COMPARISON TABLE ─────────────────────────────────────── */}
      <section className="py-12">
        <SiteContainer>
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold font-display text-[var(--text)] text-center">
              Compare Features Side-by-Side
            </h2>

            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-xs">
              <table className="w-full text-left text-xs border-collapse app-data-table">
                <thead>
                  <tr className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-[var(--text)] font-bold meta-mono uppercase tracking-wider">
                    <th className="p-4">Feature / Capability</th>
                    <th className="p-4 text-center w-36">Free Creator</th>
                    <th className="p-4 text-center w-44 bg-[var(--color-primary-subtle)]/30 text-[var(--color-primary)]">
                      Pro Yearly Pass
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                  {[
                    { name: "Monthly Cloud AI Generations", free: "5 / month", pro: "Unlimited (365 Days)" },
                    { name: "Bring Your Own Key (BYOK)", free: "Yes (Full access)", pro: "Yes (Full access)" },
                    { name: "Video Bible Character Consistency", free: "Included", pro: "Included" },
                    { name: "Multi-Track Visual Timeline Editor", free: "Included", pro: "Included" },
                    { name: "Export Resolutions", free: "720p & 1080p HD", pro: "1080p Broadcast Master" },
                    { name: "Aspect Ratios", free: "All (16:9, 9:16, 1:1)", pro: "All (16:9, 9:16, 1:1)" },
                    { name: "Cloud Rendering Queue", free: "Standard queue", pro: "Priority queue (Instant)" },
                    { name: "Audio Mixing & Ducking", free: "Basic", pro: "Full Master Ducking" },
                    { name: "Commercial YouTube Rights", free: "Yes", pro: "Yes (Full License)" },
                    { name: "Support Response Time", free: "Community", pro: "Priority SLA Support" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-[var(--color-surface-sunken)]/40 transition-colors">
                      <td className="p-4 font-semibold text-[var(--text)]">{row.name}</td>
                      <td className="p-4 text-center text-[var(--text-secondary)] font-mono">{row.free}</td>
                      <td className="p-4 text-center font-bold text-[var(--color-primary)] bg-[var(--color-primary-subtle)]/15 font-mono">
                        {row.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── FAQ ACCORDION ─────────────────────────────────────────────────── */}
      <section className="py-12">
        <SiteContainer>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Got questions before upgrading? Everything you need to know.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => {
                const isOpen = openFaqIndex === i;
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                      className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[var(--text)] flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className="text-[var(--text-muted)] shrink-0">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--color-border-subtle)] pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── BOTTOM CTA BANNER ─────────────────────────────────────────────── */}
      <section className="pt-12">
        <SiteContainer>
          <div className="max-w-4xl mx-auto rounded-3xl p-10 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-sunken)] border border-[var(--color-border)] text-center space-y-6 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck size={14} />
              <span>Risk-Free Annual Pass</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)]">
              Start Producing Cinematic YouTube Videos Today.
            </h3>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
              Join creators saving 15+ hours per video with ScenoraEdits' automated script-to-master workflow.
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
                onClick={handleUpgradeClick}
                className="font-bold px-8 shadow-md"
              >
                Upgrade to Pro Yearly ({currency === "inr" ? `₹${priceInr.toLocaleString()}` : `$${priceUsd}`})
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleFreeClick}
                className="font-semibold px-6"
              >
                Start for Free
              </Button>
            </div>
          </div>
        </SiteContainer>
      </section>
    </div>
  );
};

