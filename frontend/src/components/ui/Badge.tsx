import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  icon,
  className = "",
  style,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    default: {
      backgroundColor: "var(--color-card-subtle)",
      color: "var(--color-text)",
      border: "1px solid var(--color-border)",
    },
    primary: {
      backgroundColor: "var(--color-primary-subtle)",
      color: "var(--color-primary)",
      border: "1px solid rgba(230, 72, 51, 0.25)",
    },
    secondary: {
      backgroundColor: "var(--color-secondary-subtle)",
      color: "var(--color-secondary)",
      border: "1px solid rgba(36, 72, 85, 0.2)",
    },
    accent: {
      backgroundColor: "var(--color-accent-subtle)",
      color: "var(--color-accent)",
      border: "1px solid rgba(135, 79, 65, 0.25)",
    },
    success: {
      backgroundColor: "var(--color-success-subtle)",
      color: "var(--color-success-text)",
      border: "1px solid rgba(30, 127, 96, 0.25)",
    },
    warning: {
      backgroundColor: "var(--color-warning-subtle)",
      color: "var(--color-warning-text)",
      border: "1px solid rgba(194, 94, 0, 0.25)",
    },
    error: {
      backgroundColor: "var(--color-error-subtle)",
      color: "var(--color-error-text)",
      border: "1px solid rgba(211, 47, 47, 0.25)",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--color-text-secondary)",
      border: "1px solid var(--color-border)",
    },
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full select-none ${className}`}
      style={{
        fontFamily: "var(--font-sans)",
        lineHeight: 1.25,
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
