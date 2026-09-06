import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import { api, type PaymentResponse } from "../../services/api";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Image as ImageIcon,
} from "lucide-react";

export const AdminPaymentsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Proof preview modal
  const [viewingProofPaymentId, setViewingProofPaymentId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState<boolean>(false);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const data = await api.getAdminPayments(statusFilter);
      setPayments(data);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to load payments." });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleApprove = async (paymentId: string) => {
    if (!window.confirm(`Approve payment ${paymentId} and activate a 1-year entitlement?`)) return;

    try {
      setProcessingId(paymentId);
      const res = await api.approveAdminPayment(paymentId);
      setFeedback({ type: "success", text: res.message });
      await loadPayments();
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Payment approval failed." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = window.prompt("Enter rejection reason:", "Unable to verify transaction details on bank statement.");
    if (!reason || !reason.trim()) return;

    try {
      setProcessingId(paymentId);
      const res = await api.rejectAdminPayment(paymentId, reason.trim());
      setFeedback({ type: "success", text: res.message });
      await loadPayments();
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Payment rejection failed." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenProof = async (paymentId: string) => {
    try {
      setViewingProofPaymentId(paymentId);
      setLoadingProof(true);
      const res = await api.getAdminProofUrl(paymentId);
      setProofUrl(res.proof_url);
    } catch (err: any) {
      alert("Failed to load proof: " + (err?.message || "Not found"));
      setViewingProofPaymentId(null);
    } finally {
      setLoadingProof(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Payment Audit & Approvals"
          subtitle="Review creator payment submissions, verify transaction proofs, and activate yearly entitlements."
        />
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
          onClick={loadPayments}
        >
          Refresh Payments
        </Button>
      </div>

      {feedback && (
        <Alert type={feedback.type} title={feedback.type === "success" ? "Success" : "Error"}>
          {feedback.text}
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[var(--color-surface-sunken)] rounded-xl border border-[var(--color-border-subtle)] text-xs w-fit">
        {[
          { id: "all", label: "All Payments" },
          { id: "pending", label: "⏳ Pending" },
          { id: "approved", label: "✅ Approved" },
          { id: "rejected", label: "❌ Rejected" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === tab.id
                ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      {loading && payments.length === 0 ? (
        <LoadingState message="Loading payment records..." />
      ) : (
        <Card variant="admin" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-card-subtle)] text-[var(--color-text-secondary)] font-bold meta-mono uppercase tracking-wider">
                  <th className="p-3.5">Payment ID</th>
                  <th className="p-3.5">User UID</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Reference / UTR</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5">Proof</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                      No payments found under the "{statusFilter}" filter.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    let statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        PENDING
                      </span>
                    );
                    if (p.status === "approved") {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          APPROVED
                        </span>
                      );
                    } else if (p.status === "rejected") {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          REJECTED
                        </span>
                      );
                    }

                    return (
                      <tr key={p.payment_id} className="hover:bg-[var(--color-card-interactive)]">
                        <td className="p-3.5 font-mono text-[11px] text-[var(--color-text)]">
                          {p.payment_id}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-[var(--color-text-secondary)]">
                          {p.uid}
                        </td>
                        <td className="p-3.5 uppercase font-bold meta-mono text-[var(--color-text)]">
                          {p.payment_method}
                        </td>
                        <td className="p-3.5 font-bold font-mono text-[var(--color-text)]">
                          {p.currency === "INR" ? `₹${p.amount}` : `$${p.amount}`}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-[var(--color-text)]">
                          {p.reference}
                        </td>
                        <td className="p-3.5 text-[var(--color-text-muted)]">
                          {new Date(p.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          {p.proof_storage_path ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProof(p.payment_id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                            >
                              <ImageIcon size={13} />
                              <span>View Proof</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[var(--color-text-muted)]">None</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col gap-0.5">
                            {statusBadge}
                            {p.rejection_reason && (
                              <span className="text-[10px] text-red-500 max-w-[140px] truncate" title={p.rejection_reason}>
                                {p.rejection_reason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          {p.status === "pending" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                className="text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold"
                                disabled={processingId === p.payment_id}
                                onClick={() => handleApprove(p.payment_id)}
                              >
                                <CheckCircle2 size={13} className="mr-1 inline" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-xs py-1 px-2.5 text-red-500 hover:bg-red-500/10 font-bold"
                                disabled={processingId === p.payment_id}
                                onClick={() => handleReject(p.payment_id)}
                              >
                                <XCircle size={13} className="mr-1 inline" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--color-text-muted)] italic">
                              Reviewed by {p.reviewed_by ? p.reviewed_by.split("@")[0] : "Admin"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── PROOF VIEWING MODAL ──────────────────────────────────────────────── */}
      {viewingProofPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-2xl max-w-xl w-full p-6 relative">
            <button
              onClick={() => {
                setViewingProofPaymentId(null);
                setProofUrl(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-subtle)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[var(--color-text)] mb-3 font-display">
              Payment Proof Screenshot ({viewingProofPaymentId})
            </h3>

            {loadingProof ? (
              <div className="py-12">
                <LoadingState message="Retrieving secure proof image..." />
              </div>
            ) : proofUrl ? (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] max-h-[460px] flex items-center justify-center">
                  <img
                    src={proofUrl}
                    alt="Payment Proof"
                    className="max-h-[460px] object-contain w-auto"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Authorized Administrator View Only</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setViewingProofPaymentId(null);
                      setProofUrl(null);
                    }}
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-red-500 py-6">Could not load proof image.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
