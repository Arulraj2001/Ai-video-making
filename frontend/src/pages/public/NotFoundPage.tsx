import React from "react";
import { useRouter } from "../../router/Router";
import { useSEO, PAGE_SEO } from "../../utils/seo";
import { SiteContainer } from "../../components/public/SiteContainer";
import { Button } from "../../components/ui/Button";
import { ArrowRight, Home } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  const { navigate } = useRouter();
  useSEO(PAGE_SEO.notFound);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[var(--surface)]">
      <SiteContainer className="text-center py-24">
        {/* 404 number */}
        <div className="inline-flex items-center justify-center mb-6">
          <span
            className="text-[96px] sm:text-[128px] font-black font-display leading-none tracking-tight text-[var(--orange)]"
          >
            404
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-text)] mb-4">
          This scene does not exist.
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed mb-10">
          The page you are looking for could not be found. It may have been moved, deleted,
          or the URL might be incorrect. Let us get you back to your production.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Home size={16} />}
            onClick={() => navigate("/")}
            className="font-bold px-8"
          >
            Back to Home
          </Button>
          <Button
            variant="secondary"
            size="lg"
            rightIcon={<ArrowRight size={16} />}
            onClick={() => navigate("/features")}
            className="font-semibold"
          >
            Explore Features
          </Button>
        </div>

      </SiteContainer>
    </div>
  );
};