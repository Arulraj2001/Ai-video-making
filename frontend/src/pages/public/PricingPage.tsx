import React, { useState } from "react";
import { useRouter } from "../../router/Router";
import { Button } from "../../components/ui/Button";
import { SiteContainer } from "../../components/public/SiteContainer";
import { SectionHeader } from "../../components/public/SectionHeader";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Cpu,
  HelpCircle,
} from "lucide-react";

export const PricingPage: React.FC = () => {
  const { navigate } = useRouter();
  const [annualBilling, setAnnualBilling] = useState<boolean>(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      tagline: "Local RTX GPU & Free Cloud",
      priceMonthly: "$0",
      priceAnnual: "$0",
      period: "forever",
      desc: "For solo creators with an RTX GPU or producing with free cloud providers. Full pipeline access with no credit card required.",
      badge: "Community",
      popular: false,
      features: [
        "Unlimited local GPU SANA-Sprint 1.6B diffusion",
        "Cloudflare Workers AI (~25 daily cloud calls free)",
        "Pollinations.ai free cloud backup endpoint",
        "Full Video Bible character consistency system",
        "3-branch storyboard variant generation",
        "Multi-track timeline editor & Cinema Preview",
        "Full HD 1080p MP4 export (16:9, 9:16, 1:1)",
        "Open-source GitHub community support",
      ],
      ctaText: "Start Creating Free",
      ctaVariant: "secondary" as const,
    },
    {
      id: "pro",
      name: "Creator Pro",
      tagline: "High-Volume Cloud Production",
      priceMonthly: "$19",
      priceAnnual: "$15",
      period: "/ month",
      desc: "For creators publishing weekly who need priority cloud GPUs and advanced style controls without running local hardware.",
      badge: "Most Popular",
      popular: true,
      features: [
        "Everything in Starter, plus:",
        "Priority Cloudflare & FLUX.1 cloud GPUs",
        "150+ AI scene generations per day",
        "Custom LoRA style blending & aesthetics",
        "Advanced timeline zoom & multi-track controls",
        "Batch 1080p multi-aspect rendering queue",
        "Direct 1-click YouTube & TikTok export (Phase 13)",
        "Priority creator email support (< 24h SLA)",
      ],
      ctaText: "Get Creator Pro",
      ctaVariant: "primary" as const,
    },
    {
      id: "team",
      name: "Studio Team",
      tagline: "For Channels & Media Studios",
      priceMonthly: "$49",
      priceAnnual: "$39",
      period: "/ month",
      desc: "Designed for content studios, agencies, and collaborative teams producing multi-episode series simultaneously.",
      badge: "Studio Scale",
      popular: false,
      features: [
        "Everything in Creator Pro, plus:",
        "Unlimited high-speed cloud GPU generation",
        "Shared multi-user Video Bible workspaces",
        "Dedicated cloud GPU instance allocation",
        "Project-level role & permission management",
        "Custom branded export templates & watermarks",
        "Dedicated account technical onboarding",
        "24/7 Priority Discord & SLA support",
      ],
      ctaText: "Contact Studio Sales",
      ctaVariant: "secondary" as const,
    },
  ];

  const comparisonRows = [
    { feature: "SANA-Sprint 1.6B Local GPU", starter: "Unlimited", pro: "Unlimited", team: "Unlimited" },
    { feature: "Cloudflare Workers AI", starter: "~25 / day", pro: "150+ / day", team: "Unlimited" },
    { feature: "Video Bible Entity Registry", starter: "Yes (Unlimited)", pro: "Yes (Unlimited)", team: "Shared Team Bibles" },
    { feature: "Storyboard Variants", starter: "3 Parallel Branches", pro: "3 Parallel Branches", team: "5 Parallel Branches" },
    { feature: "Timeline Narration Waveforms", starter: "Yes", pro: "Yes", team: "Yes" },
    { feature: "1080p MP4 Export (16:9, 9:16, 1:1)", starter: "Included", pro: "Included", team: "Included" },
    { feature: "Custom LoRA Style Blending", starter: "—", pro: "Included", team: "Included" },
    { feature: "Team Workspace Collaboration", starter: "—", pro: "—", team: "Included" },
    { feature: "Dedicated Cloud GPU Instance", starter: "—", pro: "—", team: "Included" },
    { feature: "Support SLA", starter: "GitHub Community", pro: "< 24h Email SLA", team: "24/7 Dedicated" },
  ];

  const faqs = [
    {
      q: "Can I truly use ScenoraEdits for free without paying anything?",
      a: "Yes — 100%. The Starter tier runs directly on your local GPU (SANA-Sprint 1.6B via HuggingFace Diffusers) for unlimited scene generation at zero API cost. Cloudflare Workers AI also provides ~25 free high-quality cloud generations per day. No credit card is required to begin.",
    },
    {
      q: "What GPU specifications are needed for local inference?",
      a: "An NVIDIA RTX GPU with at least 4GB VRAM (e.g. RTX 3060, RTX 4060, or laptop equivalents) is recommended. SANA-Sprint 1.6B generates scenes in 0.8–1.5 seconds. For creators without local GPUs, our cloud fallback options work seamlessly on any computer.",
    },
    {
      q: "When will paid subscriptions go live?",
      a: "Billing infrastructure launches in Phase 13. Currently, all Starter features are completely free, and preview access for Creator Pro and Studio Team features can be requested through your account settings.",
    },
    {
      q: "Is my video script and audio content private?",
      a: "When running local GPU generation, your project data, audio, and images never leave your computer. When using cloud providers, only the textual prompt is transmitted to the inference endpoint.",
    },
    {
      q: "Can I export in multiple aspect ratios for Shorts and YouTube?",
      a: "Yes. ScenoraEdits natively supports 16:9 widescreen for YouTube, 9:16 vertical for Shorts and TikTok, and 1:1 square for Instagram—complete with burned-in styled subtitles.",
    },
  ];

  return (
    <div className="space-y-0">
      {/* ─── HERO HEADER ─────────────────────────────────────────────────────────── */}
      <section className="site-section-compact border-b border-[var(--color-border-subtle)]">
        <SiteContainer className="text-center">
          <SectionHeader
            eyebrow="Transparent Pricing"
            eyebrowIcon={<Sparkles size={12} />}
            title="Creator-First Pricing. Start 100% Free."
            description="Run unlimited scenes on your local RTX GPU for $0. Scale to cloud GPUs when you need high-volume team velocity."
            className="mb-6"
          />

          {/* Billing Switcher Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-xs font-semibold ${!annualBilling ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setAnnualBilling(!annualBilling)}
              className="w-11 h-6 rounded-full bg-[var(--color-secondary)] p-0.5 relative transition-colors cursor-pointer"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  annualBilling ? "translate-x-5 bg-[var(--color-primary)]" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${annualBilling ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
              <span>Annual Billing</span>
              <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
                SAVE 20%
              </span>
            </span>
          </div>
        </SiteContainer>
      </section>

      {/* ─── PRICING CARDS ──────────────────────────────────────────────────────── */}
      <section className="site-section bg-[var(--color-surface)]">
        <SiteContainer>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((p) => {
              const price = annualBilling ? p.priceAnnual : p.priceMonthly;
              return (
                <div
                  key={p.id}
                  className={`card-feature p-7 flex flex-col justify-between relative transition-all ${
                    p.popular
                      ? "border-2 border-[var(--color-primary)] shadow-md"
                      : "border border-[var(--color-border-subtle)]"
                  }`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] meta-mono font-bold uppercase tracking-wider bg-[var(--color-primary)] text-white">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] meta-mono font-bold text-[var(--color-text-muted)] uppercase">
                        {p.tagline}
                      </span>
                      <span className="pill-tag-mono bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)]">
                        {p.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold font-display text-[var(--color-text)]">{p.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-3xl sm:text-4xl font-black font-display text-[var(--color-text)]">{price}</span>
                        <span className="text-xs meta-mono text-[var(--color-text-muted)]">{p.period}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{p.desc}</p>

                    <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
                      {p.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-text)]">
                          <Check size={13} className="text-[var(--color-success)] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      variant={p.ctaVariant}
                      size="md"
                      className="w-full font-bold"
                      onClick={() => navigate(p.id === "pro" ? "/app/upgrade" : "/app")}
                    >
                      {p.ctaText}
                    </Button>

                  </div>
                </div>
              );
            })}
          </div>
        </SiteContainer>
      </section>

      {/* ─── FEATURE COMPARISON TABLE ───────────────────────────────────────────── */}
      <section className="site-section border-y border-[var(--color-border-subtle)]">
        <SiteContainer>
          <SectionHeader
            title="Feature-by-Feature Comparison"
            description="Every tier includes the full production pipeline from script to 1080p render:"
            className="mb-10"
          />

          <div className="card-feature overflow-hidden max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs meta-mono">
                <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 font-bold">Feature</th>
                    <th className="p-3.5 font-bold">Starter</th>
                    <th className="p-3.5 font-bold text-[var(--color-primary)]">Creator Pro</th>
                    <th className="p-3.5 font-bold">Studio Team</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {comparisonRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[var(--color-surface-sunken)]/40 transition-colors">
                      <td className="p-3.5 font-sans font-semibold text-[var(--color-text)]">{r.feature}</td>
                      <td className="p-3.5 text-[var(--color-text-secondary)]">{r.starter}</td>
                      <td className="p-3.5 text-[var(--color-primary)] font-bold">{r.pro}</td>
                      <td className="p-3.5 text-[var(--color-text)] font-semibold">{r.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── HARDWARE RECOMMENDATION GUIDE ──────────────────────────────────────── */}
      <section className="site-section-compact bg-[var(--color-surface)]">
        <SiteContainer>
          <div className="card-content p-6 flex flex-col sm:flex-row items-start gap-4 max-w-3xl mx-auto border border-[var(--color-border-subtle)]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-primary-subtle)] text-[var(--color-primary)] shrink-0">
              <Cpu size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[var(--color-text)] font-display">
                Local RTX GPU Hardware Guidelines
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                SANA-Sprint 1.6B requires a minimum of <strong>4GB VRAM</strong> (NVIDIA RTX 3060, RTX 4060, or equivalent). Higher-tier cards like the RTX 4080/4090 generate in under 0.8 seconds per scene. Creators on Mac Apple Silicon or thin laptops can use our free Cloudflare cloud endpoint with zero setup.
              </p>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── INTERACTIVE FAQ ACCORDION ──────────────────────────────────────────── */}
      <section className="site-section pb-24">
        <SiteContainer>
          <SectionHeader
            eyebrow="FAQ"
            eyebrowIcon={<HelpCircle size={12} />}
            title="Frequently Asked Questions"
            className="mb-10"
          />

          <div className="space-y-2.5 max-w-3xl mx-auto">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="card-content border border-[var(--color-border-subtle)] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text)] font-sans">{f.q}</span>
                    <span className="text-[var(--color-text-muted)] shrink-0">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border-subtle)] pt-3">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SiteContainer>
      </section>
    </div>
  );
};
