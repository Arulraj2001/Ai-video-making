import React from "react";

export type CardVariant =
  | "default"
  | "neu"
  | "schematic"
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
    // Cards define content boundaries without making every section float.
    const baseCardStyle: React.CSSProperties = {
      backgroundColor: "var(--color-card)",
      border: "1px solid var(--color-outline)",
      borderRadius: "var(--radius-md)",
      boxShadow: "none",
    };

    const variantStyles: Record<CardVariant, React.CSSProperties> = {
      default: {
        ...baseCardStyle,
      },
      neu: {
        ...baseCardStyle,
      },
      schematic: {
        ...baseCardStyle,
        border: "1px solid var(--color-outline-strong)",
      },
      info: {
        ...baseCardStyle,
        borderLeft: "4px solid var(--blue)",
      },
      project: {
        ...baseCardStyle,
      },
      scene: {
        ...baseCardStyle,
        border: "1px solid var(--color-outline)",
      },
      action: {
        backgroundColor: "var(--surface)",
        border: "1.5px dashed var(--orange)",
        borderRadius: "12px",
        cursor: "pointer",
      },
      warning: {
        ...baseCardStyle,
        borderLeft: "4px solid var(--accent)",
      },
      settings: {
        ...baseCardStyle,
      },
      admin: {
        ...baseCardStyle,
        border: "1px solid var(--color-outline-strong)",
      },
    };

    return (
      <div
        ref={ref}
        className={`transition-all duration-200 ${
          padded ? "p-6" : ""
        } ${
          interactive || variant === "project" || variant === "action"
            ? "hover:border-[var(--color-primary)] cursor-pointer"
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
