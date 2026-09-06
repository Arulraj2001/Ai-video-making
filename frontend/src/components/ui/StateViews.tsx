import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this view.",
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`min-h-[320px] flex flex-col items-center justify-center p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-error-subtle)] text-[var(--color-error)] mb-4">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-base font-bold text-[var(--color-text)] mb-1.5">{title}</h3>
      <p className="text-xs text-[var(--color-text-secondary)] max-w-md mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  className = "",
}) => {
  return (
    <div
      className={`min-h-[260px] flex flex-col items-center justify-center gap-3 p-8 text-center ${className}`}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
        <Loader2 size={20} className="animate-spin" />
      </div>
      <p className="text-xs font-medium text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
};
