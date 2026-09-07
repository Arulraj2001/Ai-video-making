import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import { api, type PlatformConfig } from "../../services/api";
import { Save, RefreshCw, Zap, Tag } from "lucide-react";

export const AdminPricingPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form fields
  const [planName, setPlanName] = useState<string>("");
  const [priceInr, setPriceInr] = useState<number>(2999);
  const [priceUsd, setPriceUsd] = useState<number>(49);
  const [freeLimit, setFreeLimit] = useState<number>(5);
  const [durationDays, setDurationDays] = useState<number>(365);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");

  const loadConfig = useCallback(async (force: boolean = false) => {
    try {
      if (!config) setLoading(true);
      setFeedback(null);
      const data = await api.getAdminConfig(force);
      setConfig(data);
      setPlanName(data.yearly_plan_name);
      setPriceInr(data.yearly_plan_price_inr);
      setPriceUsd(data.yearly_plan_price_usd);
      setFreeLimit(data.free_generation_limit);
      setDurationDays(data.yearly_plan_duration_days);
      setEnabled(data.yearly_plan_enabled);
      setDescription(data.yearly_plan_description);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to load platform configuration." });
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadConfig(false);
  }, [loadConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (priceInr <= 0 || priceUsd <= 0) {
      setFeedback({ type: "error", text: "Pricing must be greater than zero." });
      return;
    }
    if (freeLimit < 1) {
      setFeedback({ type: "error", text: "Free generation limit must be at least 1." });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const updated = await api.updateAdminConfig({
        yearly_plan_name: planName.trim(),
        yearly_plan_price_inr: Number(priceInr),
        yearly_plan_price_usd: Number(priceUsd),
        free_generation_limit: Number(freeLimit),
        yearly_plan_duration_days: Number(durationDays),
        yearly_plan_enabled: enabled,
        yearly_plan_description: description.trim(),
      });
      setConfig(updated);
      setFeedback({
        type: "success",
        text: "Configuration successfully updated! Pricing and generation limits are now active across the platform without server restart.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to update configuration." });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <LoadingState message="Loading pricing and limits configuration..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Pricing & Free Limits Control"
          subtitle="Centrally configure yearly subscription prices and free tier generation allowances. Changes take immediate effect."
        />
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
          onClick={() => loadConfig(true)}
        >
          Reset to Server
        </Button>
      </div>

      {feedback && (
        <Alert type={feedback.type} title={feedback.type === "success" ? "Success" : "Error"}>
          {feedback.text}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Configuration Form */}
        <Card variant="admin" className="md:col-span-2 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
              <Tag size={16} className="text-[var(--color-primary)]" />
              Yearly Subscription Plan
            </h3>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">Plan Name</label>
              <input
                type="text"
                required
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  India Price (INR ₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={priceInr}
                  onChange={(e) => setPriceInr(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  International Price (USD $)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">Plan Description</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] leading-relaxed"
              />
            </div>

            <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
                <Zap size={16} className="text-amber-400" />
                Free Tier Limits
              </h3>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  FREE_GENERATION_LIMIT (Gens per creator per month)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={1000}
                  value={freeLimit}
                  onChange={(e) => setFreeLimit(Number(e.target.value))}
                  className="w-full max-w-xs px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Modifying this value updates future generation quota checks across all free creators immediately.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="enabled-toggle"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--color-primary)] cursor-pointer"
                />
                <label htmlFor="enabled-toggle" className="text-xs font-semibold text-[var(--color-text)] cursor-pointer">
                  Yearly Subscription Plan Enabled for New Signups
                </label>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={saving}
                leftIcon={<Save size={15} />}
                className="w-full sm:w-auto font-bold"
              >
                {saving ? "Saving Changes..." : "Save Platform Pricing & Limits"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Live Plan Preview Card */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-[var(--color-text-muted)] meta-mono uppercase tracking-wider">
            Live Creator Preview
          </div>
          <Card className="p-6 space-y-4 border-2 border-[var(--color-primary)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold meta-mono uppercase text-[var(--color-primary)]">
                {enabled ? "ACTIVE PLAN" : "DISABLED"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                {durationDays} DAYS
              </span>
            </div>
            <div>
              <h4 className="text-lg font-bold font-display text-[var(--color-text)]">{planName || "Plan Name"}</h4>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-black font-display text-[var(--color-text)]">₹{priceInr}</span>
                <span className="text-xs meta-mono text-[var(--color-text-muted)]">(${priceUsd} USD) / year</span>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {description || "Plan description preview..."}
            </p>
            <div className="pt-3 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] space-y-1">
              <div>Free Tier Allowance: <strong>{freeLimit} gens/month</strong></div>
              <div>Payment Methods: India UPI + Buy Me a Coffee</div>
              <div className="pt-1">
                <a href="/admin/settings" className="text-[11px] text-[var(--color-primary)] hover:underline">
                  Configure UPI ID & QR Code link in Settings →
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
