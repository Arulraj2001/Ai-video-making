import React from "react";
import { BookOpen, Check, ShieldCheck } from "lucide-react";

export const VideoBibleShowcase: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
      {/* LEFT 45%: Editorial Narrative */}
      <div className="lg:col-span-5 space-y-4 text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] shadow-sm">
          <BookOpen size={12} className="text-[var(--color-primary)]" />
          <span className="meta-mono uppercase text-[11px] font-bold">Character Persistence</span>
        </div>

        <h2 className="section-headline">
          Filmmaking continuity without re-prompting.
        </h2>

        <p className="prose-body text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Standard generative tools treat each scene as an isolated lottery. ScenoraEdits treats your project as a coherent production with an immutable cast, wardrobe, and location registry.
        </p>

        <div className="space-y-2.5 pt-2">
          {[
            "Facial structure stays locked across long-form projects",
            "Signature wardrobe and equipment remain identical scene-to-scene",
            "Structured JSON entity anchors reusable across entire series",
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[var(--color-text)]">
              <Check size={14} className="text-[var(--color-success)] shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT 55%: Dense Software Registry Panel (Level 3 Creative Software UI) */}
      <div className="lg:col-span-7 card-feature p-5 sm:p-6 space-y-3.5 border border-[var(--color-border)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] pulse-indicator" />
            <span className="font-bold text-[var(--color-text)] font-display">VIDEO BIBLE REGISTRY</span>
          </div>
          <span className="pill-tag-mono bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)]">
            ENTITY ID: #ELENA-01
          </span>
        </div>

        {/* Character Bio Header */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-sunken)]/70">
          <div>
            <div className="text-sm font-bold text-[var(--color-text)]">Dr. Elena Vance</div>
            <div className="text-[11px] text-[var(--color-text-secondary)]">Lead Marine Astrobiologist • Europa Dive Team</div>
          </div>
          <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
            PRIMARY CAST
          </span>
        </div>

        {/* Dense Technical Attribute Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs meta-mono">
          <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1">
            <span className="text-[10px] text-[var(--color-text-muted)] font-bold block uppercase">
              FACIAL GEOMETRY ANCHOR
            </span>
            <p className="text-[var(--color-text)] font-sans text-xs">
              Copper-red short hair, high cheekbones, hazel eyes, left eyebrow micro-scar.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1">
            <span className="text-[10px] text-[var(--color-text-muted)] font-bold block uppercase">
              WARDROBE &amp; PROPS
            </span>
            <p className="text-[var(--color-text)] font-sans text-xs">
              Matte obsidian hazmat exosuit, amber telemetry visor HUD, titanium chronometer.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1">
            <span className="text-[10px] text-[var(--color-text-muted)] font-bold block uppercase">
              LIGHTING &amp; ATMOSPHERE
            </span>
            <p className="text-[var(--color-text)] font-sans text-xs">
              Cyan bioluminescent vent glow, 50mm anamorphic cinematic aperture.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1">
            <span className="text-[10px] text-[var(--color-text-muted)] font-bold block uppercase">
              PERSISTENCE CONFIDENCE
            </span>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs font-bold text-[var(--color-success)] flex items-center gap-1">
                <ShieldCheck size={13} /> 100% Locked
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">45/45 Scenes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
