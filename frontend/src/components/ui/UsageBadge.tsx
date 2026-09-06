import React, { useState } from "react";
import { Sparkles, Key, AlertTriangle, Calendar, ChevronRight, X } from "lucide-react";
import { useRouter } from "../../router/Router";
import type { UsageResponse } from "../../services/api";

interface UsageBadgeProps {
  usage: UsageResponse | null;
  loading?: boolean;
  className?: string;
}

export const UsageBadge: React.FC<UsageBadgeProps> = ({ usage, loading, className = "" }) => {
  const { navigate } = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading || !usage) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] animate-pulse ${className}`}>
        <Sparkles size={12} />
        <span>Checking quota...</span>
      </div>
    );
  }

  const isLimitReached = usage.remaining <= 0;
  const hasEntitlement = Boolean(usage.has_active_entitlement);
  const resetFormatted = new Date(usage.reset_date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const expiryFormatted = usage.entitlement_expires_at
    ? new Date(usage.entitlement_expires_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer text-[11px] font-semibold ${
          hasEntitlement
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs"
            : isLimitReached
            ? "bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border-[var(--color-warning)]"
            : usage.has_byok
            ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border-[var(--color-primary-subtle)]"
            : "bg-[var(--color-card-subtle)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]"
        } ${className}`}
        title="View Generation Usage & Subscription"
      >
        {hasEntitlement ? (
          <>
            <span className="text-xs">👑</span>
            <span>Pro Yearly (Active)</span>
          </>
        ) : isLimitReached ? (
          <>
            <AlertTriangle size={12} className="text-[var(--color-warning)]" />
            <span>{usage.current_usage}/{usage.limit} Limit Reached</span>
          </>
        ) : usage.has_byok ? (
          <>
            <Key size={12} className="text-[var(--color-primary)]" />
            <span>{usage.remaining} Free · BYOK Ready</span>
          </>
        ) : (
          <>
            <Sparkles size={12} className="text-[var(--color-primary)]" />
            <span>{usage.remaining} / {usage.limit} Free Left</span>
          </>
        )}
      </button>


      {/* Usage Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-subtle)] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${
                isLimitReached
                  ? "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                  : "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
              }`}>
                {isLimitReached ? <AlertTriangle size={22} /> : <Sparkles size={22} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  {isLimitReached ? "Free Tier Limit Reached" : "Generation Quota"}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Period: <span className="font-mono">{usage.period}</span>
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[var(--color-text-secondary)]">Free Generations Used</span>
                <span className="font-bold text-[var(--color-text)]">
                  {usage.current_usage} / {usage.limit}
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--color-card-subtle)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                <div
                  className={`h-full transition-all duration-500 ${
                    isLimitReached ? "bg-[var(--color-warning)]" : "bg-[var(--color-primary)]"
                  }`}
                  style={{
                    width: `${Math.min(100, (usage.current_usage / Math.max(1, usage.limit)) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-1">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Resets {resetFormatted}
                </span>
                <span>{usage.remaining} remaining this month</span>
              </div>
            </div>

            {/* Subscription / BYOK Status & Next Steps */}
            {hasEntitlement ? (
              <div className="rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-2 mb-5 text-xs">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="text-sm">👑</span>
                  <span>ScenoraEdits Pro Yearly Active</span>
                </div>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  Your yearly membership is active with unlimited AI scene and storyboard generations.
                  {expiryFormatted && ` Expiration date: ${expiryFormatted}.`}
                </p>
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] p-4 space-y-2.5 mb-5 text-xs">
                <div className="font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                  <Key size={14} className="text-[var(--color-primary)]" />
                  <span>Unlimited Generation Options</span>
                </div>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {isLimitReached
                    ? "You have consumed your 5 free monthly generations. Upgrade to ScenoraEdits Pro Yearly or add your custom API key in Settings to continue creating."
                    : "Every creator receives 5 free generations per month. Upgrade to Pro Yearly for unlimited cloud generations or configure your personal API key."}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-ghost text-xs py-2 px-3"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  navigate("/app/upgrade");
                }}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <span>{hasEntitlement ? "Manage Membership" : "Upgrade to Pro"}</span>
                <ChevronRight size={14} />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
