import React from "react";
import { Clapperboard, Sparkles, BookOpen, RefreshCw } from "lucide-react";

interface StoryboardEmptyStateProps {
  scenesCount: number;
  onSynthesize: () => void;
  onSwitchToBible?: () => void;
  synthesizing: boolean;
}

export const StoryboardEmptyState: React.FC<StoryboardEmptyStateProps> = ({
  scenesCount,
  onSynthesize,
  onSwitchToBible,
  synthesizing,
}) => {
  return (
    <div className="sb-empty-state">
      {/* Animated icon */}
      <div className="sb-empty-icon-wrap">
        <Clapperboard size={36} />
      </div>

      {/* Stage badge */}
      <div className="sb-empty-badge">
        <Sparkles size={12} />
        <span>Stage 3 — AI Storyboard Synthesis</span>
      </div>

      {/* Headline */}
      <h3 className="sb-empty-title">
        Synthesize Your<br />Visual Storyboard
      </h3>

      {/* Description */}
      <p className="sb-empty-desc">
        Transform your {scenesCount} timestamped scenes into camera directives, artistic
        visual descriptions, and high-coherence image prompts — all aligned with
        your Video Bible style guide.
      </p>

      {/* CTAs */}
      <div className="sb-empty-actions">
        <button
          type="button"
          id="storyboard-synthesize-btn"
          onClick={onSynthesize}
          disabled={synthesizing || scenesCount === 0}
          className="sb-btn-primary"
        >
          {synthesizing ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Synthesizing Storyboard…</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Synthesize Storyboard ({scenesCount} Scenes)</span>
            </>
          )}
        </button>

        {onSwitchToBible && (
          <button
            type="button"
            onClick={onSwitchToBible}
            className="sb-btn-secondary"
          >
            <BookOpen size={14} />
            <span>Review Video Bible First</span>
          </button>
        )}
      </div>
    </div>
  );
};
