import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
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
    // Variant styling using ScenoraEdits design tokens
    const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
      primary: {
        backgroundColor: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        border: "1px solid transparent",
        boxShadow: "var(--shadow-sm)",
      },
      secondary: {
        backgroundColor: "var(--color-surface)",
        color: "var(--color-secondary)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
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
    };

    // Size styling
    const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
      sm: {
        padding: "5px 10px",
        fontSize: "0.8125rem",
        borderRadius: "var(--radius-sm)",
        gap: "5px",
        height: "30px",
      },
      md: {
        padding: "8px 16px",
        fontSize: "0.875rem",
        borderRadius: "var(--radius-md)",
        gap: "8px",
        height: "38px",
      },
      lg: {
        padding: "12px 24px",
        fontSize: "1rem",
        borderRadius: "var(--radius-lg)",
        gap: "10px",
        height: "46px",
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
