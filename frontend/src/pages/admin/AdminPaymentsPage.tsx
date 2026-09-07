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
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

export const AdminPaymentsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [allPayments, setAllPayments] = useState<PaymentResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);

  // Proof preview modal
  const [viewingProofPayment, setViewingProofPayment] = useState<PaymentResponse | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState<boolean>(false);

  // Structured rejection modal
  const [rejectingPayment, setRejectingPayment] = useState<PaymentResponse | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const loadPayments = useCallback(async (force: boolean = false) => {
    try {
      if (allPayments.length === 0) setLoading(true);
      setFeedback(null);
      const data = await api.getAdminPayments("all", force);
      setAllPayments(data);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to load payments." });
    } finally {
      setLoading(false);
    }
  }, [allPayments.length]);

  useEffect(() => {
    loadPayments(false);
  }, [loadPayments]);

  const filteredPayments = allPayments.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  const pendingCount = allPayments.filter((p) => p.status === "pending").length;
  const approvedCount = allPayments.filter((p) => p.status === "approved").length;
  const rejectedCount = allPayments.filter((p) => p.status === "rejected").length;

  const handleCopyRef = (paymentId: string, ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRefId(paymentId);
    setTimeout(() => setCopiedRefId(null), 2000);
  };

  const handleApprove = async (paymentId: string) => {
    if (!window.confirm(`Approve payment ${paymentId} and activate a 1-year entitlement for this user?`)) return;

    try {
      setProcessingId(paymentId);
      const res = await api.approveAdminPayment(paymentId);
      setFeedback({ type: "success", text: res.message });
      if (viewingProofPayment?.payment_id === paymentId) {
        setViewingProofPayment(null);
        setProofUrl(null);
      }
      await loadPayments(true);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Payment approval failed." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (payment: PaymentResponse) => {
    setRejectingPayment(payment);
    setRejectReason("Transaction details could not be verified in bank statement.");
  };

  const handleConfirmReject = async () => {
    if (!rejectingPayment) return;
    const paymentId = rejectingPayment.payment_id;
    const reason = rejectReason.trim() || "Transaction could not be verified.";

    try {
      setProcessingId(paymentId);
      const res = await api.rejectAdminPayment(paymentId, reason);
      setFeedback({ type: "success", text: res.message });
      setRejectingPayment(null);
      if (viewingProofPayment?.payment_id === paymentId) {
        setViewingProofPayment(null);
        setProofUrl(null);
      }
      await loadPayments(true);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Payment rejection failed." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenProof = async (payment: PaymentResponse) => {
    try {
      setViewingProofPayment(payment);
      setLoadingProof(true);
      const res = await api.getAdminProofUrl(payment.payment_id);
      setProofUrl(res.proof_url);
    } catch (err: any) {
      alert("Failed to load proof: " + (err?.message || "Not found"));
      setViewingProofPayment(null);
    } finally {
      setLoadingProof(false);
    }
  };

  const REJECTION_PRESETS = [
    "Transaction details could not be verified in bank statement.",
    "Incorrect payment amount received.",
    "Unclear or illegible proof screenshot uploaded.",
    "Duplicate submission or already processed.",
    "Invalid transaction reference / UTR number provided.",
  ];

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
          onClick={() => loadPayments(true)}
        >
          Refresh Payments
        </Button>
      </div>

      {feedback && (
        <Alert type={feedback.type} title={feedback.type === "success" ? "Success" : "Error"}>
          {feedback.text}
        </Alert>
      )}

      {/* Filter Tabs with Live Count Badges */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-[var(--color-surface-sunken)] rounded-xl border border-[var(--color-border-subtle)] text-xs w-fit">
        {[
          { id: "all", label: "All Payments", count: allPayments.length },
          { id: "pending", label: "Pending Review", count: pendingCount, highlight: pendingCount > 0 },
          { id: "approved", label: "Approved", count: approvedCount },
          { id: "rejected", label: "Rejected", count: rejectedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              statusFilter === tab.id
                ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                tab.highlight
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Payments Table */}
      {loading && allPayments.length === 0 ? (
        <LoadingState message="Loading payment records..." />
      ) : (
        <Card variant="admin" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse app-data-table">
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
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                      No payments found under the "{statusFilter}" filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
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
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--color-text)]">
                            <span className="font-semibold">{p.reference}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyRef(p.payment_id, p.reference)}
                              className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                              title="Copy Reference / UTR"
                            >
                              {copiedRefId === p.payment_id ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 text-[var(--color-text-muted)]">
                          {new Date(p.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          {p.proof_storage_path ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProof(p)}
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
                              <span
                                className="text-[10px] text-red-500 max-w-[140px] truncate"
                                title={p.rejection_reason}
                              >
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
                                onClick={() => handleOpenRejectModal(p)}
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
      {viewingProofPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full p-6 relative flex flex-col"
            style={{ width: "min(1100px, 92vw)", maxHeight: "calc(100vh - 32px)" }}
          >
            <button
              onClick={() => {
                setViewingProofPayment(null);
                setProofUrl(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-subtle)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-[var(--color-text)] font-display">
                Payment Proof Screenshot
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-1">
                <span>Ref: <strong className="font-mono text-[var(--color-text)]">{viewingProofPayment.reference}</strong></span>
                <span>·</span>
                <span>Amount: <strong className="text-[var(--color-text)]">{viewingProofPayment.currency} {viewingProofPayment.amount}</strong></span>
                <span>·</span>
                <span>User: <span className="font-mono">{viewingProofPayment.uid}</span></span>
              </div>
            </div>

            {loadingProof ? (
              <div className="py-12">
                <LoadingState message="Retrieving secure proof image..." />
              </div>
            ) : proofUrl ? (
              <div className="space-y-4 min-h-0">
                <div
                  className="rounded-xl overflow-auto border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] flex items-center justify-center p-3"
                  style={{ maxHeight: "calc(100vh - 230px)", minHeight: "180px" }}
                >
                  <img
                    src={proofUrl}
                    alt="Payment Proof"
                    className="h-auto w-auto max-w-full object-contain rounded-lg"
                    style={{ maxHeight: "calc(100vh - 250px)" }}
                  />
                </div>

                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  Open full image in a new tab
                </a>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]">
                  {viewingProofPayment.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                        disabled={processingId === viewingProofPayment.payment_id}
                        onClick={() => handleApprove(viewingProofPayment.payment_id)}
                      >
                        <CheckCircle2 size={13} className="mr-1.5 inline" />
                        Approve & Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-red-500 hover:bg-red-500/10 text-xs font-bold"
                        disabled={processingId === viewingProofPayment.payment_id}
                        onClick={() => handleOpenRejectModal(viewingProofPayment)}
                      >
                        <XCircle size={13} className="mr-1.5 inline" />
                        Reject Payment
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">Status: {viewingProofPayment.status.toUpperCase()}</span>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setViewingProofPayment(null);
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

      {/* ─── STRUCTURED REJECTION MODAL ────────────────────────────────────────── */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 relative">
            <button
              onClick={() => setRejectingPayment(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-subtle)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 text-red-500">
              <AlertTriangle size={20} />
              <h3 className="text-base font-bold text-[var(--color-text)] font-display">
                Reject Payment Submission
              </h3>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)]">
              Rejecting payment <strong className="font-mono text-[var(--color-text)]">{rejectingPayment.payment_id}</strong> (Ref: {rejectingPayment.reference}). Select a preset reason or enter custom guidance to help the creator correct their payment:
            </p>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Common Rejection Reasons
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className={`text-left text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      rejectReason === preset
                        ? "bg-red-500/15 border-red-500/40 text-red-300 font-semibold"
                        : "bg-[var(--color-surface-sunken)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom reason input */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                Rejection Note for Creator *
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter detailed reason for rejection..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--color-border-subtle)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectingPayment(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-xs font-bold"
                disabled={processingId === rejectingPayment.payment_id || !rejectReason.trim()}
                onClick={handleConfirmReject}
              >
                {processingId === rejectingPayment.payment_id ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
