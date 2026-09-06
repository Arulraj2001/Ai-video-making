import React from "react";
import { BRAND } from "../../config/brand";

export type SubBrand = "main" | "studio" | "admin" | "local";

interface ScenoraLogoProps {
  subBrand?: SubBrand;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const ScenoraLogo: React.FC<ScenoraLogoProps> = ({
  subBrand = "main",
  size = "md",
  showText = true,
  className = "",
  onClick,
}) => {
  // Dimensions based on size token
  const dimensions = {
    sm: { icon: 22, text: "0.95rem", badge: "0.625rem", gap: "6px" },
    md: { icon: 28, text: "1.2rem", badge: "0.675rem", gap: "9px" },
    lg: { icon: 38, text: "1.6rem", badge: "0.75rem", gap: "12px" },
  }[size];

  const subBrandLabel = {
    main: null,
    studio: "STUDIO",
    admin: "ADMIN",
    local: "LOCAL",
  }[subBrand];

  return (
    <div
      className={`inline-flex items-center select-none cursor-pointer ${className}`}
      style={{ gap: dimensions.gap }}
      onClick={onClick}
      role="banner"
      aria-label={`${BRAND.name}${subBrandLabel ? ` ${subBrandLabel}` : ""}`}
    >
      {/* Geometric Scenora Camera Slate Icon */}
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="scenora-petrol-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#244855" />
            <stop offset="100%" stopColor="#18313A" />
          </linearGradient>
          <linearGradient id="scenora-crimson-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E64833" />
            <stop offset="100%" stopColor="#C93824" />
          </linearGradient>
        </defs>

        {/* Foundation Slate Base */}
        <rect x="2" y="5" width="28" height="22" rx="6" fill="url(#scenora-petrol-grad)" />
        {/* Subtle Slate Clapper Stripes */}
        <path
          d="M 6 5 L 10 5 L 8 11 L 4 11 Z"
          fill="#90AEAD"
          fillOpacity="0.4"
        />
        <path
          d="M 13 5 L 17 5 L 15 11 L 11 11 Z"
          fill="#90AEAD"
          fillOpacity="0.4"
        />
        <path
          d="M 20 5 L 24 5 L 22 11 L 18 11 Z"
          fill="#90AEAD"
          fillOpacity="0.4"
        />

        {/* Focus Film Aperture / Dynamic Play Prism */}
        <circle cx="16" cy="18" r="6" fill="#FBE9D0" fillOpacity="0.12" />
        <path
          d="M 14.5 14.5 L 20 18 L 14.5 21.5 Z"
          fill="url(#scenora-crimson-grad)"
        />

        {/* Accent Cornerstone Pip */}
        <circle cx="26" cy="9" r="1.75" fill="#E64833" />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: dimensions.text,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--color-text)",
            }}
          >
            Scenora
            <span
              style={{
                color: "var(--color-primary)",
                fontWeight: 800,
              }}
            >
              Edits
            </span>
          </span>

          {subBrandLabel && (
            <span
              style={{
                fontSize: dimensions.badge,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
                backgroundColor:
                  subBrand === "admin"
                    ? "var(--scenora-rust)"
                    : "var(--color-primary-subtle)",
                color:
                  subBrand === "admin"
                    ? "#FFFFFF"
                    : "var(--color-primary)",
                border: "1px solid var(--color-border)",
                lineHeight: 1.1,
              }}
            >
              {subBrandLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
