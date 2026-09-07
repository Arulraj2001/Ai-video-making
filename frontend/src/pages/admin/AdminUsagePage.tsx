import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Progress, Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import { api, type AdminUsageStats } from "../../services/api";
import { BarChart3, RefreshCw, Sparkles, Key, AlertTriangle, Users } from "lucide-react";

export const AdminUsagePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminUsageStats | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUsage = useCallback(async (force: boolean = false) => {
    try {
      if (!stats) setLoading(true);
      setErrorMsg(null);
      const data = await api.getAdminUsage(force);
      setStats(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load usage statistics.");
    } finally {
      setLoading(false);
    }
  }, [stats]);

  useEffect(() => {
    loadUsage(false);
  }, [loadUsage]);

  if (loading && !stats) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <LoadingState message="Loading platform generation usage stats..." />
      </div>
    );
  }

  const successRate = stats && stats.total_generations > 0
    ? Math.round((stats.successful_generations / stats.total_generations) * 100)
    : 100;

  const freePercentage = stats && stats.total_generations > 0
    ? Math.round((stats.free_tier_generations / stats.total_generations) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Platform Generation Analytics"
          subtitle="System-wide consumption metrics, provider execution split, and free tier quotas."
        />
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
          onClick={() => loadUsage(true)}
        >
          Refresh Metrics
        </Button>
      </div>

      {errorMsg && (
        <Alert type="error" title="Error">
          {errorMsg}
        </Alert>
      )}

      {stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card variant="admin" className="p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-semibold">
                <span>Total Generations</span>
                <BarChart3 size={16} className="text-[var(--color-primary)]" />
              </div>
              <h3 className="text-2xl font-black text-[var(--color-text)] font-display">{stats.total_generations}</h3>
              <span className="text-[11px] text-[var(--color-text-muted)]">Across all creators</span>
            </Card>

            <Card variant="admin" className="p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-semibold">
                <span>Free Tier Gens</span>
                <Sparkles size={16} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-[var(--color-text)] font-display">{stats.free_tier_generations}</h3>
              <span className="text-[11px] text-[var(--color-text-muted)]">{freePercentage}% of volume</span>
            </Card>

            <Card variant="admin" className="p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-semibold">
                <span>BYOK Generations</span>
                <Key size={16} className="text-indigo-500" />
              </div>
              <h3 className="text-2xl font-black text-[var(--color-text)] font-display">{stats.byok_generations}</h3>
              <span className="text-[11px] text-emerald-500 font-medium">Zero platform cost</span>
            </Card>

            <Card variant="admin" className="p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-semibold">
                <span>Near Free Quota</span>
                <AlertTriangle size={16} className="text-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-amber-500 font-display">{stats.users_approaching_limit}</h3>
              <span className="text-[11px] text-[var(--color-text-muted)]">Creators at {stats.free_generation_limit - 1}+ gens</span>
            </Card>
          </div>

          {/* Consumption & Success Visual Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="admin" className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[var(--color-text)] font-display">Generation Reliability</h4>
                <Badge variant="success">{successRate}% Success Rate</Badge>
              </div>
              <Progress value={successRate} max={100} label="Fulfilled vs Failed Requests" showPercent />
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border-subtle)]">
                <span>Successful: <strong>{stats.successful_generations}</strong></span>
                <span>Failed: <strong>{stats.failed_generations}</strong></span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Per Phase 16 design, failed provider calls are automatically rolled back and never decrement creator quotas.
              </p>
            </Card>

            <Card variant="admin" className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[var(--color-text)] font-display">Active Subscriptions</h4>
                <Badge variant="primary">{stats.active_paid_users} Pro Yearly</Badge>
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] space-y-2">
                <div className="text-xs text-[var(--color-text)] font-semibold flex items-center gap-1.5">
                  <Users size={14} className="text-[var(--color-primary)]" />
                  <span>Paid Membership Conversion</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  <strong>{stats.active_paid_users}</strong> creators have active yearly paid entitlements and enjoy unlimited scene generation.
                </p>
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  Configured Free Limit: <strong>{stats.free_generation_limit} generations / month</strong>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
