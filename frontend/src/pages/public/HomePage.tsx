import React from "react";
import { useRouter } from "../../router/Router";
import { useSEO, PAGE_SEO } from "../../utils/seo";
import { Button } from "../../components/ui/Button";
import { SiteContainer } from "../../components/public/SiteContainer";
import { ArrowRight } from "lucide-react";

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  useSEO(PAGE_SEO.home);

  return (
    <div className="public-page relative bg-[var(--surface)] text-[var(--text)]">
      <section className="py-20 sm:py-28">
        <SiteContainer>
          <div className="public-home-intro max-w-3xl mx-auto text-center">
            <h2
              className="font-bold text-[var(--text)] tracking-tight max-w-xl mx-auto text-balance"
              style={{ fontSize: "clamp(1.85rem, 3.5vw, 2.75rem)" }}
            >
              Start mastering your next video project now.
            </h2>

            <p className="text-base text-[var(--text-secondary)] max-w-lg leading-relaxed font-sans">
              Import narration stems, configure character anchors in the Video Bible, and render a broadcast-grade 1080p MP4 master.
            </p>

            <div className="flex flex-wrap gap-3.5 justify-center pt-5">
              <Button
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate("/app")}
                className="px-8 py-3.5 text-base font-bold shadow-sm"
              >
                Launch Scenora Studio
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/how-it-works")}
                className="px-7 py-3.5 text-base font-semibold"
              >
                View 5-Stage Pipeline
              </Button>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── PRICING TEASER SECTION ────────────────────────────────────────── */}
      <section className="py-16 bg-[var(--color-surface-sunken)] border-y border-[var(--color-border-subtle)]">
        <SiteContainer>
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              Transparent Creator Pricing
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)]">
              One Yearly Pass. 365 Days of Unlimited AI Video Production.
            </h3>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto">
              Start with 5 free generations each month or unlock the complete all-access pass for unlimited AI storyboarding and cinema rendering.
            </p>

            <div className="pt-6 flex flex-wrap gap-4 justify-center">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate("/pricing")}
                className="font-bold px-6 shadow-xs"
              >
                View Plans & Features (₹2,999 / $49 yr)
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate("/app")}
                className="font-semibold px-6"
              >
                Try Free Tier
              </Button>
            </div>
          </div>
        </SiteContainer>
      </section>
    </div>
  );
};
