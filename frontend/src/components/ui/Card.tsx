import React from "react";

export type CardVariant =
  | "default"
  | "info"
  | "project"
  | "scene"
  | "action"
  | "warning"
  | "settings"
  | "admin";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      interactive = false,
      padded = true,
      className = "",
      style,
      children,
      ...props
    },
    ref
  ) => {
    // Distinct treatments across card types
    const variantStyles: Record<CardVariant, React.CSSProperties> = {
      default: {
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      },
      info: {
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderLeft: "4px solid var(--color-info)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      },
      project: {
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      },
      scene: {
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      },
      action: {
        backgroundColor: "var(--color-primary-subtle)",
        border: "1.5px dashed var(--color-primary)",
        borderRadius: "var(--radius-card)",
        cursor: "pointer",
      },
      warning: {
        backgroundColor: "var(--color-warning-subtle)",
        border: "1px solid var(--color-warning)",
        borderLeft: "4px solid var(--color-warning)",
        borderRadius: "var(--radius-card)",
      },
      settings: {
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-sm)",
      },
      admin: {
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--scenora-rust)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      },
    };

    return (
      <div
        ref={ref}
        className={`transition-all duration-180 ${
          padded ? "p-5" : ""
        } ${
          interactive || variant === "project" || variant === "action"
            ? "hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] cursor-pointer"
            : ""
        } ${className}`}
        style={{
          ...variantStyles[variant],
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
