import React from "react";
import { useRouter } from "../../router/Router";
import { useSEO, PAGE_SEO } from "../../utils/seo";
import { SiteContainer } from "../../components/public/SiteContainer";
import { Button } from "../../components/ui/Button";
import { ArrowRight, Home, Sparkles, DollarSign } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  const { navigate } = useRouter();
  useSEO(PAGE_SEO.notFound);

  return (
    <div className="min-h-[70vh] flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--color-primary)]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[var(--scenora-petrol)]/8 blur-3xl pointer-events-none" />

      <SiteContainer className="text-center relative z-10 py-24">
        {/* 404 number */}
        <div className="inline-flex items-center justify-center mb-8">
          <span
            className="text-[120px] sm:text-[160px] font-black font-display leading-none tracking-tight"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #FF6B4A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
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

        {/* Quick links */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)] font-mono">Quick links:</span>
          {[
            { label: "Features", to: "/features", icon: <Sparkles size={12} /> },
            { label: "How It Works", to: "/how-it-works", icon: <ArrowRight size={12} /> },
            { label: "Pricing", to: "/pricing", icon: <DollarSign size={12} /> },
            { label: "Contact", to: "/contact", icon: <ArrowRight size={12} /> },
          ].map((link) => (
            <button
              key={link.to}
              type="button"
              onClick={() => navigate(link.to)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] transition-all cursor-pointer"
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </div>
      </SiteContainer>
    </div>
  );
};