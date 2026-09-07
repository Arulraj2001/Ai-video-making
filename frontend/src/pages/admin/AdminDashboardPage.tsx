import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import {
  api,
  type AdminDashboardStats,
  type PaymentResponse,
  type AuditLogEntry,
} from "../../services/api";
import {
  Users,
  BarChart3,
  ShieldCheck,
  Tag,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "../../router/Router";

export const AdminDashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentResponse[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(async (force: boolean = false) => {
    try {
      if (!stats) setLoading(true);
      setActionMsg(null);
      const [statsData, pendingData, logsData] = await Promise.all([
        api.getAdminDashboard(force),
        api.getAdminPayments("pending", force).catch(() => []),
        api.getAdminAuditLogs(6, force).catch(() => []),
      ]);
      setStats(statsData);
      setPendingPayments(pendingData);
      setAuditLogs(logsData);
    } catch (err: any) {
      setActionMsg({ type: "error", text: err?.message || "Failed to load admin metrics." });
    } finally {
      setLoading(false);
    }
  }, [stats]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleApprove = async (paymentId: string) => {
    try {
      setProcessingId(paymentId);
      await api.approveAdminPayment(paymentId);
      setActionMsg({ type: "success", text: `Payment ${paymentId} approved and 1-year entitlement activated.` });
      await loadData();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err?.message || "Approval failed." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = window.prompt("Enter rejection reason:", "Transaction details could not be verified.");
    if (!reason) return;

    try {
      setProcessingId(paymentId);
      await api.rejectAdminPayment(paymentId, reason);
      setActionMsg({ type: "success", text: `Payment ${paymentId} rejected.` });
      await loadData();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err?.message || "Rejection failed." });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <LoadingState message="Loading administrative dashboard metrics..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Admin Overview"
          subtitle="Platform metrics, creator activity, and centralized management."
        />
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
          onClick={() => loadData(true)}
        >
          Refresh Data
        </Button>
      </div>

      {actionMsg && (
        <Alert type={actionMsg.type} title={actionMsg.type === "success" ? "Success" : "Error"}>
          {actionMsg.text}
        </Alert>
      )}

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <Card variant="admin" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-semibold">
              <span>Creators</span>
              <Users size={15} className="text-[var(--color-primary)]" />
            </div>
            <h3 className="text-xl font-black text-[var(--color-text)] font-display">{stats.total_users}</h3>
            <span className="text-[10px] meta-mono text-[var(--color-text-muted)]">Registered</span>
          </Card>

          <Card variant="admin" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-semibold">
              <span>Pending</span>
              <Clock size={15} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-amber-500 font-display">{stats.pending_payments}</h3>
            <span className="text-[10px] meta-mono text-[var(--color-text-muted)]">Awaiting review</span>
          </Card>

          <Card variant="admin" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-semibold">
              <span>Active Paid</span>
              <ShieldCheck size={15} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-emerald-500 font-display">{stats.active_paid_users}</h3>
            <span className="text-[10px] meta-mono text-[var(--color-text-muted)]">Pro Yearly</span>
          </Card>

          <Card variant="admin" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-semibold">
              <span>Generations</span>
              <BarChart3 size={15} className="text-[var(--color-secondary)]" />
            </div>
            <h3 className="text-xl font-black text-[var(--color-text)] font-display">{stats.total_generations}</h3>
            <span className="text-[10px] meta-mono text-[var(--color-text-muted)]">Total visual + LLM</span>
          </Card>

          <Card variant="admin" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-semibold">
              <span>Yearly Price</span>
              <Tag size={15} className="text-[var(--color-primary)]" />
            </div>
            <h3 className="text-xl font-black text-[var(--color-text)] font-display">₹{stats.yearly_price_inr}</h3>
            <span className="text-[10px] meta-mono text-[var(--color-text-muted)]">${stats.yearly_price_usd} USD</span>
          </Card>

          <Card variant="admin" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-semibold">
              <span>Free Quota</span>
              <Zap size={15} className="text-amber-400" />
            </div>
            <h3 className="text-xl font-black text-[var(--color-text)] font-display">{stats.free_generation_limit}</h3>
            <span className="text-[10px] meta-mono text-[var(--color-text-muted)]">Gens / Month</span>
          </Card>
        </div>
      )}

      {/* Pending Payments Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
            <Clock size={16} className="text-amber-500" />
            <span>Pending Payment Verifications ({pendingPayments.length})</span>
          </h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/payments")}>
            View All Payments →
          </Button>
        </div>

        {pendingPayments.length === 0 ? (
          <Card variant="admin" className="p-8 text-center text-xs text-[var(--color-text-muted)]">
            ✨ No payments currently awaiting review. All payments have been processed.
          </Card>
        ) : (
          <Card variant="admin" className="p-0 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse app-data-table">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-card-subtle)] text-[var(--color-text-secondary)] font-bold meta-mono uppercase">
                  <th className="p-3">User UID</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {pendingPayments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-[var(--color-card-interactive)]">
                    <td className="p-3 font-mono text-[11px] text-[var(--color-text)]">{p.uid}</td>
                    <td className="p-3 uppercase font-bold meta-mono">{p.payment_method}</td>
                    <td className="p-3 font-bold font-mono">
                      {p.currency === "INR" ? `₹${p.amount}` : `$${p.amount}`}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[var(--color-text-secondary)]">{p.reference}</td>
                    <td className="p-3 text-[var(--color-text-muted)]">
                      {new Date(p.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                          disabled={processingId === p.payment_id}
                          onClick={() => handleApprove(p.payment_id)}
                        >
                          <CheckCircle2 size={13} className="mr-1 inline" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs py-1 px-2.5 text-red-500 hover:bg-red-500/10"
                          disabled={processingId === p.payment_id}
                          onClick={() => handleReject(p.payment_id)}
                        >
                          <XCircle size={13} className="mr-1 inline" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Recent Audit Log */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[var(--color-text)] font-display">
          Recent Administrative Actions
        </h3>
        <Card variant="admin" className="p-0 overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--color-text-muted)]">
              No audit logs recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse app-data-table">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-card-subtle)] text-[var(--color-text-secondary)] font-bold meta-mono uppercase">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {auditLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-[var(--color-card-interactive)]">
                    <td className="p-3 text-[var(--color-text-muted)] font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[var(--color-text)]">
                      {log.admin_email}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="meta-mono uppercase text-[10px]">
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[var(--color-text-secondary)]">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
};
