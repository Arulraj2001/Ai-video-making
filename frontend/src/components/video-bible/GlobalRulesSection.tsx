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
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Global Visual Rules ({currentRules.length} Active)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Hard constraints that are injected into every prompt generated for this project.
            These prevent style drift across scenes.
          </p>
        </div>
        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-medium animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>

      {/* Preset Rules Grid */}
      <div>
        <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
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
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isActive
                    ? "bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-950/30 text-zinc-100"
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs tracking-wide">
                    {preset.label}
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isActive
                        ? "bg-indigo-600 border-indigo-400 text-white"
                        : "border-zinc-700 bg-zinc-800 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal line-clamp-2">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Rules Badges & Custom Rule Input */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Active Consistency Directives
          </h4>
          <span className="text-[11px] text-zinc-500">
            {currentRules.length} rule{currentRules.length === 1 ? "" : "s"} enforced
          </span>
        </div>

        {currentRules.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            No rules currently active. Select presets above or type custom directives below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentRules.map((rule) => (
              <span
                key={rule}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/80 text-indigo-200 text-xs font-medium group"
              >
                <span>{rule}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(rule)}
                  className="text-indigo-400 hover:text-rose-400 rounded transition-colors"
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
            className="flex-1 px-3.5 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={saving || !newRuleInput.trim()}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </form>
      </div>
    </div>
  );
};
