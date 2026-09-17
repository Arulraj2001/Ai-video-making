import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import { api, type PlatformConfig } from "../../services/api";
import { db } from "../../lib/firebase";
import { Save, RefreshCw, Zap, Tag, Calendar } from "lucide-react";

export const AdminPricingPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1-Year Plan Fields
  const [planName, setPlanName] = useState<string>("");
  const [priceInr, setPriceInr] = useState<number>(2999);
  const [priceUsd, setPriceUsd] = useState<number>(49);
  const [durationDays, setDurationDays] = useState<number>(365);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");

  // 6-Month Plan Fields
  const [plan6mName, setPlan6mName] = useState<string>("");
  const [price6mInr, setPrice6mInr] = useState<number>(1799);
  const [price6mUsd, setPrice6mUsd] = useState<number>(29);
  const [duration6mDays, setDuration6mDays] = useState<number>(180);
  const [enabled6m, setEnabled6m] = useState<boolean>(true);
  const [description6m, setDescription6m] = useState<string>("");

  // Free Tier Limits
  const [freeLimit, setFreeLimit] = useState<number>(5);

  const loadConfig = useCallback(async (force: boolean = false) => {
    try {
      if (!config) setLoading(true);
      setFeedback(null);
      let data: PlatformConfig | null = null;
      try {
        data = await api.getAdminConfig(force);
      } catch (apiErr) {
        if (db) {
          const firestore = db;
          const { doc, getDoc } = await import("firebase/firestore");
          const snap = await getDoc(doc(firestore, "platform", "config"));
          if (snap.exists()) {
            data = snap.data() as PlatformConfig;
          }
        }
        if (!data) throw apiErr;
      }

      setConfig(data);

      // Yearly Plan
      setPlanName(data.yearly_plan_name);
      setPriceInr(data.yearly_plan_price_inr);
      setPriceUsd(data.yearly_plan_price_usd);
      setDurationDays(data.yearly_plan_duration_days);
      setEnabled(data.yearly_plan_enabled);
      setDescription(data.yearly_plan_description);

      // 6-Month Plan
      setPlan6mName(data.plan_6m_name || "ScenoraEdits Pro (6 Months)");
      setPrice6mInr(data.plan_6m_price_inr || 1799);
      setPrice6mUsd(data.plan_6m_price_usd || 29);
      setDuration6mDays(data.plan_6m_duration_days || 180);
      setEnabled6m(data.plan_6m_enabled !== false);
      setDescription6m(
        data.plan_6m_description ||
          "Full studio timeline access, Video Bible consistency, and BYOK integration for 6 months."
      );

      // Free Limit
      setFreeLimit(data.free_generation_limit);
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
    if (priceInr <= 0 || priceUsd <= 0 || price6mInr <= 0 || price6mUsd <= 0) {
      setFeedback({ type: "error", text: "All plan prices must be greater than zero." });
      return;
    }
    if (freeLimit < 1) {
      setFeedback({ type: "error", text: "Free generation limit must be at least 1." });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const payload = {
        yearly_plan_name: planName.trim(),
        yearly_plan_price_inr: Number(priceInr),
        yearly_plan_price_usd: Number(priceUsd),
        yearly_plan_duration_days: Number(durationDays),
        yearly_plan_enabled: enabled,
        yearly_plan_description: description.trim(),
        plan_6m_name: plan6mName.trim(),
        plan_6m_price_inr: Number(price6mInr),
        plan_6m_price_usd: Number(price6mUsd),
        plan_6m_duration_days: Number(duration6mDays),
        plan_6m_enabled: enabled6m,
        plan_6m_description: description6m.trim(),
        free_generation_limit: Number(freeLimit),
      };

      if (db) {
        const firestore = db;
        try {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(firestore, "platform", "config"), payload, { merge: true });
        } catch (fsErr) {
          console.warn("Direct Firestore update notice:", fsErr);
        }
      }

      const updated = await api.updateAdminConfig(payload);
      setConfig(updated);
      setFeedback({
        type: "success",
        text: "Platform plans and pricing successfully updated! Changes are live across the marketing page and user dashboard.",
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Pricing & Duration Control"
          subtitle="Centrally configure 6-month & 1-year subscription plans, custom durations, and free tier limits."
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Configuration Form */}
        <Card variant="admin" className="lg:col-span-8 p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. SIX-MONTH PASS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
                  <Calendar size={16} className="text-amber-500" />
                  6-Month Creator Plan
                </h3>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  plan_id: scenora-pro-6months
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Plan Display Name
                </label>
                <input
                  type="text"
                  required
                  value={plan6mName}
                  onChange={(e) => setPlan6mName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    India Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price6mInr}
                    onChange={(e) => setPrice6mInr(Number(e.target.value))}
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
                    value={price6mUsd}
                    onChange={(e) => setPrice6mUsd(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    required
                    min={30}
                    max={1000}
                    value={duration6mDays}
                    onChange={(e) => setDuration6mDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Plan Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={description6m}
                  onChange={(e) => setDescription6m(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="enabled-6m-toggle"
                  checked={enabled6m}
                  onChange={(e) => setEnabled6m(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--color-primary)] cursor-pointer"
                />
                <label
                  htmlFor="enabled-6m-toggle"
                  className="text-xs font-semibold text-[var(--color-text)] cursor-pointer"
                >
                  6-Month Plan Enabled for Creator Selection
                </label>
              </div>
            </div>

            {/* 2. ONE-YEAR PASS SECTION */}
            <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
                  <Tag size={16} className="text-[#FF6B00]" />
                  1-Year Creator Plan (Annual Pass)
                </h3>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  plan_id: scenora-pro-yearly
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Plan Display Name
                </label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    required
                    min={30}
                    max={1000}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Plan Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="enabled-toggle"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--color-primary)] cursor-pointer"
                />
                <label
                  htmlFor="enabled-toggle"
                  className="text-xs font-semibold text-[var(--color-text)] cursor-pointer"
                >
                  1-Year Plan Enabled for Creator Selection
                </label>
              </div>
            </div>

            {/* 3. FREE TIER LIMITS */}
            <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
                <Zap size={16} className="text-amber-400" />
                Free Tier Allowances
              </h3>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  FREE_GENERATION_LIMIT (Cloud Gens per creator per month)
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
                  Note: Local NVIDIA RTX GPU generations are always unlimited for all users.
                </p>
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
                {saving ? "Saving Changes..." : "Save Platform Pricing & Plans"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Live Creator Previews */}
        <div className="lg:col-span-4 space-y-5">
          <div className="text-xs font-bold text-[var(--color-text-muted)] meta-mono uppercase tracking-wider">
            Live Creator Preview
          </div>

          {/* 6-Month Preview */}
          <Card className="p-5 space-y-3 border border-amber-500/30 bg-[var(--color-surface)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold meta-mono uppercase text-amber-500">
                {enabled6m ? "ACTIVE 6M PLAN" : "DISABLED"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-amber-500/15 text-amber-500">
                {duration6mDays} DAYS (~{Math.round(duration6mDays / 30)} MOS)
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold font-display text-[var(--color-text)]">
                {plan6mName || "6-Month Plan"}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-display text-[var(--color-text)]">
                  ₹{price6mInr}
                </span>
                <span className="text-xs meta-mono text-[var(--color-text-muted)]">
                  (${price6mUsd} USD) · ~₹{Math.round(price6mInr / (duration6mDays / 30))}/mo
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {description6m || "6-month plan preview..."}
            </p>
          </Card>

          {/* 1-Year Preview */}
          <Card className="p-5 space-y-3 border-2 border-[#FF6B00] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold meta-mono uppercase text-[#FF6B00]">
                {enabled ? "ACTIVE 1-YR PLAN" : "DISABLED"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-[#FF6B00]/15 text-[#FF6B00]">
                {durationDays} DAYS (1 YEAR)
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold font-display text-[var(--color-text)]">
                {planName || "1-Year Plan"}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-display text-[var(--color-text)]">
                  ₹{priceInr}
                </span>
                <span className="text-xs meta-mono text-[var(--color-text-muted)]">
                  (${priceUsd} USD) · ~₹{Math.round(priceInr / (durationDays / 30))}/mo
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {description || "1-year plan preview..."}
            </p>
          </Card>

          <div className="text-[11px] text-[var(--color-text-muted)] p-3 rounded-xl bg-[var(--color-surface-alt)] space-y-1">
            <div>✓ BYOK unlimited generation enabled</div>
            <div>✓ Instant updates to /pricing &amp; /app/upgrade</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPricingPage;
