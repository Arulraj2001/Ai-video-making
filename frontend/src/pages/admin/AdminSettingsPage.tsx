import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import { api, type PlatformConfig, type AuditLogEntry } from "../../services/api";
import { Save, RefreshCw, Settings, History } from "lucide-react";

export const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form fields
  const [upiId, setUpiId] = useState<string>("");
  const [upiQrUrl, setUpiQrUrl] = useState<string>("");
  const [bmcUrl, setBmcUrl] = useState<string>("");
  const [yearlyEnabled, setYearlyEnabled] = useState<boolean>(true);
  const [freeLimit, setFreeLimit] = useState<number>(5);
  const [allowRegistration, setAllowRegistration] = useState<boolean>(true);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const [configData, logsData] = await Promise.all([
        api.getAdminConfig(),
        api.getAdminAuditLogs(20).catch(() => []),
      ]);
      setConfig(configData);
      setAuditLogs(logsData);
      setUpiId(configData.payment_upi_id);
      setUpiQrUrl(configData.payment_upi_qr_url);
      setBmcUrl(configData.payment_bmc_url);
      setYearlyEnabled(configData.yearly_plan_enabled);
      setFreeLimit(configData.free_generation_limit);
      setAllowRegistration(configData.allow_registration);
      setMaintenanceMode(configData.maintenance_mode);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to load platform settings." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFeedback(null);
      const updated = await api.updateAdminConfig({
        payment_upi_id: upiId.trim(),
        payment_upi_qr_url: upiQrUrl.trim(),
        payment_bmc_url: bmcUrl.trim(),
        yearly_plan_enabled: yearlyEnabled,
        free_generation_limit: Number(freeLimit),
        allow_registration: allowRegistration,
        maintenance_mode: maintenanceMode,
      });
      setConfig(updated);
      setFeedback({ type: "success", text: "Platform settings updated and audit logged." });
      const freshLogs = await api.getAdminAuditLogs(20).catch(() => []);
      setAuditLogs(freshLogs);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <LoadingState message="Loading administrative platform settings..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Platform Settings & Central Control"
          subtitle="Manage payment collection destinations, global platform toggles, and review audit trail."
        />
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
          onClick={loadData}
        >
          Refresh Settings
        </Button>
      </div>

      {feedback && (
        <Alert type={feedback.type} title={feedback.type === "success" ? "Success" : "Error"}>
          {feedback.text}
        </Alert>
      )}

      {/* Settings Form */}
      <Card variant="admin" className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
            <Settings size={16} className="text-[var(--color-primary)]" />
            Payment Collection Instructions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                Official UPI ID (India)
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                UPI QR Code Asset Reference
              </label>
              <input
                type="text"
                required
                value={upiQrUrl}
                onChange={(e) => setUpiQrUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
              Buy Me a Coffee URL (International)
            </label>
            <input
              type="url"
              required
              value={bmcUrl}
              onChange={(e) => setBmcUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text)] font-display">
              Platform & Access Flags
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={yearlyEnabled}
                  onChange={(e) => setYearlyEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--color-primary)]"
                />
                <span className="text-xs font-semibold text-[var(--color-text)]">
                  Yearly Plan Enabled for Subscription
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--color-primary)]"
                />
                <span className="text-xs font-semibold text-[var(--color-text)]">
                  Allow New Creator Signups
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <span className="text-xs font-semibold text-[var(--color-text)]">
                  Maintenance Mode (Read-only Studio)
                </span>
              </label>
            </div>
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={saving}
              leftIcon={<Save size={15} />}
              className="font-bold"
            >
              {saving ? "Saving Settings..." : "Save Platform Settings"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Audit Log Table */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
          <History size={16} className="text-[var(--color-primary)]" />
          Administrative Audit Trail
        </h3>
        <Card variant="admin" className="p-0 overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
              No audit records logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse app-data-table">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-card-subtle)] text-[var(--color-text-secondary)] font-bold meta-mono uppercase tracking-wider">
                    <th className="p-3.5">Timestamp (UTC)</th>
                    <th className="p-3.5">Admin User</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {auditLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-[var(--color-card-interactive)]">
                      <td className="p-3.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[var(--color-text)]">
                        {log.admin_email}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="secondary" className="meta-mono uppercase text-[10px]">
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[var(--color-text-secondary)] max-w-md truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
