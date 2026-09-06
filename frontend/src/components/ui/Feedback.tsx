import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export type AlertType = "info" | "success" | "warning" | "error";

export interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
  onDismiss,
  className = "",
}) => {
  const configs: Record<
    AlertType,
    { bg: string; border: string; color: string; icon: React.ReactNode }
  > = {
    info: {
      bg: "var(--color-info-subtle)",
      border: "var(--color-info)",
      color: "var(--color-info-text)",
      icon: <Info size={16} className="shrink-0 mt-0.5" />,
    },
    success: {
      bg: "var(--color-success-subtle)",
      border: "var(--color-success)",
      color: "var(--color-success-text)",
      icon: <CheckCircle2 size={16} className="shrink-0 mt-0.5" />,
    },
    warning: {
      bg: "var(--color-warning-subtle)",
      border: "var(--color-warning)",
      color: "var(--color-warning-text)",
      icon: <AlertTriangle size={16} className="shrink-0 mt-0.5" />,
    },
    error: {
      bg: "var(--color-error-subtle)",
      border: "var(--color-error)",
      color: "var(--color-error-text)",
      icon: <AlertCircle size={16} className="shrink-0 mt-0.5" />,
    },
  };

  const current = configs[type];

  return (
    <div
      className={`p-3.5 rounded-[var(--radius-md)] flex items-start gap-3 text-xs leading-relaxed transition-all ${className}`}
      style={{
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
      }}
      role="alert"
    >
      {current.icon}
      <div className="flex-1">
        {title && <h5 className="font-bold text-xs mb-0.5">{title}</h5>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-current opacity-70 hover:opacity-100 cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  showPercent?: boolean;
  color?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = "md",
  label,
  showPercent = false,
  color = "var(--color-primary)",
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size];

  return (
    <div className="w-full flex flex-col gap-1.5">
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] font-medium">
          {label && <span>{label}</span>}
          {showPercent && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-[var(--color-border-subtle)] rounded-full overflow-hidden ${heights}`}
      >
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

export interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "lg" | "full";
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "16px",
  rounded = "md",
  className = "",
}) => {
  const radiusMap = {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    full: "var(--radius-full)",
  }[rounded];

  return (
    <div
      className={`animate-pulse bg-[var(--color-border-subtle)] ${className}`}
      style={{
        width,
        height,
        borderRadius: radiusMap,
      }}
      aria-hidden="true"
    />
  );
};
