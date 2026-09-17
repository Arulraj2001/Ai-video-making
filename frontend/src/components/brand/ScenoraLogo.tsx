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
      {/* Geometric Scenora Video Studio Icon */}
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="scenora-indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#3730A3" />
          </linearGradient>
          <linearGradient id="scenora-flame-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8533" />
            <stop offset="100%" stopColor="#FF5500" />
          </linearGradient>
          <filter id="logo-drop" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#1E1B4B" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Foundation Squircle Base */}
        <rect x="2" y="2" width="28" height="28" rx="7.5" fill="url(#scenora-indigo-grad)" filter="url(#logo-drop)" />
        <rect x="2" y="2" width="28" height="28" rx="7.5" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />

        {/* Lens Aperture Ring */}
        <circle cx="16" cy="16" r="9" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />

        {/* Clapper Slashes */}
        <line x1="11" y1="5.5" x2="14" y2="10" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="15.5" y1="5.5" x2="18.5" y2="10" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.2" strokeLinecap="round" />

        {/* Smooth Flame Orange Play Prism */}
        <path
          d="M 12 10.5 C 12 9.7 12.8 9.2 13.5 9.7 L 22.2 15.2 C 22.9 15.6 22.9 16.6 22.2 17.0 L 13.5 22.5 C 12.8 23.0 12 22.5 12 21.7 Z"
          fill="url(#scenora-flame-grad)"
        />
        {/* Bevel Highlight */}
        <path d="M 13 11 L 21 16" stroke="#FFE4B5" strokeOpacity="0.75" strokeWidth="0.8" strokeLinecap="round" />

        {/* Golden AI Magic Spark */}
        <path d="M 24 5.5 L 24.8 7.2 L 26.5 8 L 24.8 8.8 L 24 10.5 L 23.2 8.8 L 21.5 8 L 23.2 7.2 Z" fill="#FFC107" />
        <circle cx="24" cy="8" r="0.6" fill="#FFFFFF" />
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
