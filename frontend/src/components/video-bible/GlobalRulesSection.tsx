import React, { useState } from "react";
import { ShieldCheck, Plus, X, Sparkles, Check } from "lucide-react";

interface GlobalRulesSectionProps {
  rules: string[];
  onUpdateRules: (rules: string[]) => Promise<any>;
}

const PRESET_RULES = [
  { id: "cinematic", label: "Cinematic", description: "Dramatic composition, 2.39:1 letterbox framing, deliberate lighting" },
  { id: "realistic", label: "Realistic", description: "Natural physics, plausible textures, lifelike environmental interaction" },
  { id: "documentary", label: "Documentary", description: "Verité realism, observational angles, raw atmospheric authenticity" },
  { id: "animation", label: "Animation", description: "Stylized aesthetic, expressive rendering, vibrant visual dynamism" },
  { id: "historical", label: "Historical", description: "Period-accurate architecture, garments, props, and aged patina" },
  { id: "futuristic", label: "Futuristic", description: "Advanced tech motifs, clean sleek geometries, neon or bioluminescent accents" },
  { id: "noir", label: "Film Noir", description: "Chiaroscuro high contrast, heavy venetian blind shadows, melancholic mood" },
  { id: "anamorphic", label: "Anamorphic", description: "Horizontal lens flares, oval bokeh, wide aspect ratio perspective" },
];

export const GlobalRulesSection: React.FC<GlobalRulesSectionProps> = ({
  rules,
  onUpdateRules,
}) => {
  const [currentRules, setCurrentRules] = useState<string[]>(rules || []);
  const [newRuleInput, setNewRuleInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync if prop changes
  React.useEffect(() => {
    setCurrentRules(rules || []);
  }, [rules]);

  const handleTogglePreset = async (ruleText: string) => {
    const exists = currentRules.some((r) => r.toLowerCase() === ruleText.toLowerCase());
    let nextRules: string[];
    if (exists) {
      nextRules = currentRules.filter((r) => r.toLowerCase() !== ruleText.toLowerCase());
    } else {
      nextRules = [...currentRules, ruleText.toLowerCase()];
    }
    setCurrentRules(nextRules);
    await persistRules(nextRules);
  };

  const handleAddCustomRule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newRuleInput.trim().toLowerCase();
    if (!clean) return;

    if (!currentRules.includes(clean)) {
      const nextRules = [...currentRules, clean];
      setCurrentRules(nextRules);
      setNewRuleInput("");
      await persistRules(nextRules);
    } else {
      setNewRuleInput("");
    }
  };

  const handleRemoveRule = async (ruleToRemove: string) => {
    const nextRules = currentRules.filter((r) => r !== ruleToRemove);
    setCurrentRules(nextRules);
    await persistRules(nextRules);
  };

  const persistRules = async (rulesToSave: string[]) => {
    try {
      setSaving(true);
      await onUpdateRules(rulesToSave);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      alert(`Failed to save visual rules: ${err.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--orange)]" />
            Global Visual Rules ({currentRules.length} Active)
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Hard constraints that are injected into every prompt generated for this project.
            These prevent style drift across scenes.
          </p>
        </div>
        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--color-success-subtle)] text-[var(--color-success-text)] text-xs font-medium animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>

      {/* Preset Rules Grid */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Recommended Rule Presets
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_RULES.map((preset) => {
            const isActive = currentRules.some((r) => r.toLowerCase() === preset.id.toLowerCase());
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleTogglePreset(preset.id)}
                className={`p-3.5 rounded-[var(--radius-md)] border text-left transition-colors relative flex flex-col justify-between ${
                  isActive
                    ? "bg-[var(--color-primary-subtle)] border-[var(--color-primary)] text-[var(--text-primary)]"
                    : "bg-[var(--color-card)] border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs tracking-wide">
                    {preset.label}
                  </span>
                  <span
                    className={`w-4 h-4 rounded-[var(--radius-xs)] border flex items-center justify-center text-[10px] ${
                      isActive
                        ? "bg-[var(--orange)] border-[var(--orange)] text-white"
                        : "border-[var(--border-strong)] bg-transparent text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-normal line-clamp-2">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Rules Badges & Custom Rule Input */}
      <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--color-card)] space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--orange)]" />
            Active Consistency Directives
          </h4>
          <span className="text-[11px] text-[var(--text-muted)]">
            {currentRules.length} rule{currentRules.length === 1 ? "" : "s"} enforced
          </span>
        </div>

        {currentRules.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic">
            No rules currently active. Select presets above or type custom directives below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentRules.map((rule) => (
              <span
                key={rule}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] border border-[var(--color-primary)] text-[var(--color-primary)] text-xs font-medium group"
              >
                <span>{rule}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(rule)}
                  className="text-[var(--color-primary)] hover:text-[var(--color-error)] rounded transition-colors"
                  title={`Remove ${rule}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Custom Rule Input */}
        <form onSubmit={handleAddCustomRule} className="pt-2 flex gap-2">
          <input
            type="text"
            placeholder="Add custom rule (e.g. 'no lens flares', 'vintage 1970s film grain', 'isometric perspective')..."
            value={newRuleInput}
            onChange={(e) => setNewRuleInput(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-[var(--radius-input)] bg-[var(--color-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-focus)]"
          />
          <button
            type="submit"
            disabled={saving || !newRuleInput.trim()}
            className="px-4 py-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-medium disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </form>
      </div>
    </div>
  );
};
