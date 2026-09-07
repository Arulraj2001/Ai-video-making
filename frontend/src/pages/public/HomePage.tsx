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
    </div>
  );
};
