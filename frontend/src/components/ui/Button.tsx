import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "success" | "ai" | "neu-primary" | "neu-secondary" | "neu-ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      style,
      children,
      ...props
    },
    ref
  ) => {
    // Variant styling using SaaS Design System
    const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
      primary: {
        background: "var(--color-primary)",
        color: "#FFFFFF",
        border: "1px solid var(--color-primary)",
        boxShadow: "none",
      },
      ai: {
        background: "var(--color-primary)",
        color: "#FFFFFF",
        border: "1px solid var(--color-primary)",
        boxShadow: "none",
      },
      secondary: {
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text)",
        border: "1.5px solid var(--color-outline)",
        boxShadow: "none",
      },
      ghost: {
        backgroundColor: "transparent",
        color: "var(--color-text)",
        border: "1px solid transparent",
      },
      danger: {
        backgroundColor: "var(--color-error)",
        color: "#FFFFFF",
        border: "1px solid var(--color-error)",
        boxShadow: "none",
      },
      outline: {
        backgroundColor: "transparent",
        color: "var(--color-primary)",
        border: "1.5px solid var(--color-primary)",
      },
      success: {
        backgroundColor: "var(--color-success)",
        color: "#FFFFFF",
        border: "1px solid var(--color-success)",
      },
      "neu-primary": {
        background: "var(--color-primary)",
        color: "#FFFFFF",
        border: "1px solid var(--color-primary)",
        boxShadow: "none",
      },
      "neu-secondary": {
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text)",
        border: "1.5px solid var(--color-outline)",
        boxShadow: "none",
      },
      "neu-ghost": {
        backgroundColor: "transparent",
        color: "var(--color-text)",
        border: "1.5px solid var(--color-border-subtle)",
      },
    };

    // Strict 12px radius across all button sizes
    const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
      sm: {
        padding: "6px 12px",
        fontSize: "0.8125rem",
        borderRadius: "var(--radius-button)",
        gap: "6px",
        height: "32px",
      },
      md: {
        padding: "9px 18px",
        fontSize: "0.875rem",
        borderRadius: "var(--radius-button)",
        gap: "8px",
        height: "40px",
      },
      lg: {
        padding: "12px 24px",
        fontSize: "1rem",
        borderRadius: "var(--radius-button)",
        gap: "10px",
        height: "48px",
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-semibold transition-colors duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  "aria-label": string;
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      isLoading = false,
      icon,
      disabled,
      className = "",
      style,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const sizeDimensions: Record<ButtonSize, { dim: string; padding: string }> = {
      sm: { dim: "28px", padding: "4px" },
      md: { dim: "36px", padding: "8px" },
      lg: { dim: "44px", padding: "10px" },
    };

    const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
      primary: {
        backgroundColor: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        border: "1px solid transparent",
      },
      ai: {
        background: "var(--color-primary)",
        color: "#FFFFFF",
        border: "1px solid transparent",
      },
      secondary: {
        backgroundColor: "var(--color-surface)",
        color: "var(--color-secondary)",
        border: "1px solid var(--color-border)",
      },
      ghost: {
        backgroundColor: "transparent",
        color: "var(--color-text)",
        border: "1px solid transparent",
      },
      danger: {
        backgroundColor: "var(--color-error)",
        color: "#FFFFFF",
        border: "1px solid transparent",
      },
      outline: {
        backgroundColor: "transparent",
        color: "var(--color-primary)",
        border: "1px solid var(--color-primary)",
      },
      success: {
        backgroundColor: "var(--color-success)",
        color: "#FFFFFF",
        border: "1px solid transparent",
      },
      "neu-primary": {
        backgroundColor: "var(--color-primary)",
        color: "#FFFFFF",
        border: "1px solid transparent",
      },
      "neu-secondary": {
        backgroundColor: "var(--neu-bg)",
        color: "var(--neu-text)",
        border: "1px solid var(--neu-border-subtle)",
      },
      "neu-ghost": {
        backgroundColor: "transparent",
        color: "var(--neu-text)",
        border: "1px solid transparent",
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{
          width: sizeDimensions[size].dim,
          height: sizeDimensions[size].dim,
          padding: sizeDimensions[size].padding,
          borderRadius: "var(--radius-md)",
          ...variantStyles[variant],
          ...style,
        }}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={size === "sm" ? 14 : 18} className="animate-spin shrink-0" />
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
