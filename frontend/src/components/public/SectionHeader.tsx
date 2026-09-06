import React from "react";

export interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  align = "center",
  action,
  className = "",
}) => {
  const isCenter = align === "center";

  return (
    <div
      className={`flex flex-col ${
        isCenter ? "items-center text-center mx-auto" : "items-start text-left"
      } ${action ? "md:flex-row md:items-end md:justify-between gap-6" : ""} ${className}`}
    >
      <div className={`space-y-3 ${isCenter ? "flex flex-col items-center" : ""}`}>
        {eyebrow && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] shadow-sm">
            {eyebrowIcon && <span className="text-[var(--color-primary)]">{eyebrowIcon}</span>}
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
              {eyebrow}
            </span>
          </div>
        )}

        <h2 className="section-headline">{title}</h2>

        {description && (
          <p className={`prose-body text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed ${isCenter ? "mx-auto" : ""}`}>
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 pt-2 md:pt-0">{action}</div>}
    </div>
  );
};
