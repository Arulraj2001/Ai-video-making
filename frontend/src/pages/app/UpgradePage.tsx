import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import { api } from "../../services/api";
import type {
  PlanConfigResponse,
  PaymentResponse,
  EntitlementResponse,
} from "../../services/api";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  QrCode,
  Coffee,
  Copy,
  Check,
  Upload,
  ShieldCheck,
} from "lucide-react";


export const UpgradePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [plan, setPlan] = useState<PlanConfigResponse | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(null);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);

  // Payment form state
  const [method, setMethod] = useState<"upi" | "buymeacoffee">("upi");
  const [reference, setReference] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [planData, entData, paymentsData] = await Promise.all([
        api.getYearlyPlan(),
        api.getCurrentEntitlement(),
        api.getUserPayments().catch(() => []),
      ]);
      setPlan(planData);
      setEntitlement(entData);
      setPayments(paymentsData);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyUpi = () => {
    if (!plan?.upi_id) return;
    navigator.clipboard.writeText(plan.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Proof file exceeds 5MB limit. Please select a smaller screenshot.");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type.toLowerCase())) {
      setErrorMsg("Only JPG, PNG, or WebP images are allowed.");
      return;
    }

    setErrorMsg(null);
    setProofFile(file);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    if (!reference.trim()) {
      setErrorMsg("Please enter your transaction reference / UTR number.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const currency = method === "upi" ? "INR" : "USD";
      const amount = method === "upi" ? plan.price_inr : plan.price_usd;

      // 1. Submit payment record
      const payment = await api.submitPayment({
        plan_id: plan.plan_id,
        amount,
        currency,
        payment_method: method,
        reference: reference.trim(),
      });

      // 2. Upload proof if provided
      if (proofFile) {
        await api.uploadPaymentProof(payment.payment_id, proofFile);
      }

      setSuccessMsg(
        "Payment submitted successfully! Your payment is pending admin review and will be verified within 24 hours."
      );
      setReference("");
      setProofFile(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <LoadingState message="Loading ScenoraEdits subscription options..." />
      </div>
    );
  }

  const hasActiveMembership = entitlement && entitlement.is_active;
  const pendingPayment = payments.find((p) => p.status === "pending");

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <PageHeader
        title="Upgrade to Pro Yearly"
        subtitle="One annual pass for unlimited AI scene generation, high-speed cloud rendering, and character consistency."
      />

      {errorMsg && (
        <Alert type="error" title="Submission Error">
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert type="success" title="Success">
          {successMsg}
        </Alert>
      )}

      {/* ─── ACTIVE MEMBERSHIP BANNER ────────────────────────────────────────── */}
      {hasActiveMembership && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-success)] shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  👑 Active ScenoraEdits Pro Yearly Member
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                You have full access to unlimited generations. Expiration date:{" "}
                <strong>{new Date(entitlement.expires_at).toLocaleDateString()}</strong> (
                {entitlement.days_remaining} days remaining).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── PENDING VERIFICATION BANNER ─────────────────────────────────────── */}
      {!hasActiveMembership && pendingPayment && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border-2 border-amber-500/50 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  Payment Verification Pending
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  PENDING REVIEW
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Transaction Reference: <span className="font-mono">{pendingPayment.reference}</span> ·{" "}
                Submitted: {new Date(pendingPayment.submitted_at).toLocaleString()}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] pt-1">
                Our team is reviewing your transaction. Your account will automatically activate once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── PLAN OVERVIEW CARD ─────────────────────────────────────────────── */}
      {plan && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <Card className="md:col-span-1 p-6 flex flex-col justify-between border-2 border-[var(--color-primary)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold meta-mono uppercase tracking-wider text-[var(--color-primary)]">
                  ALL-ACCESS PASS
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                  365 DAYS
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display text-[var(--color-text)]">{plan.name}</h2>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-[var(--color-text)] font-display">
                    {method === "upi" ? `₹${plan.price_inr.toLocaleString()}` : `$${plan.price_usd}`}
                  </span>
                  <span className="text-xs meta-mono text-[var(--color-text-muted)]">/ year</span>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {plan.description}
              </p>
              <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-text)]">
                    <CheckCircle2 size={14} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ─── PAYMENT & SUBMISSION SECTION ─────────────────────────────────── */}
          <Card className="md:col-span-2 p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--color-primary)]" />
                Select Payment Method
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Pay using India UPI or International Buy Me a Coffee, then submit your transaction details below.
              </p>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("upi")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  method === "upi"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/30 shadow-xs"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-sunken)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                  <QrCode size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--color-text)]">India UPI / QR</div>
                  <div className="text-[11px] meta-mono text-[var(--color-text-muted)]">
                    ₹{plan.price_inr.toLocaleString()} INR
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("buymeacoffee")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  method === "buymeacoffee"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/30 shadow-xs"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-sunken)] flex items-center justify-center text-amber-500 shrink-0">
                  <Coffee size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--color-text)]">Buy Me a Coffee</div>
                  <div className="text-[11px] meta-mono text-[var(--color-text-muted)]">
                    ${plan.price_usd} USD (Intl)
                  </div>
                </div>
              </button>
            </div>

            {/* Method Instructions */}
            {method === "upi" ? (
              <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] meta-mono font-bold uppercase text-[var(--color-text-muted)]">
                      Official UPI ID
                    </span>
                    <div className="text-sm font-bold font-mono text-[var(--color-text)]">
                      {plan.upi_id}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold"
                    onClick={handleCopyUpi}
                  >
                    {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                    {copiedUpi ? "Copied!" : "Copy UPI ID"}
                  </Button>
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] space-y-1">
                  <p>1. Open Google Pay, PhonePe, Paytm, or BHIM app.</p>
                  <p>2. Send <strong>₹{plan.price_inr.toLocaleString()}</strong> to the UPI ID above.</p>
                  <p>3. Copy the 12-digit UTR / UPI Reference ID and paste it in the form below.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] meta-mono font-bold uppercase text-[var(--color-text-muted)]">
                      International Payment
                    </span>
                    <div className="text-sm font-bold text-[var(--color-text)]">
                      Buy Me a Coffee · ${plan.price_usd} USD
                    </div>
                  </div>
                  <a
                    href={plan.bmc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
                  >
                    <Coffee size={14} />
                    Open BMC Page
                  </a>
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] space-y-1">
                  <p>1. Click the button above to visit our Buy Me a Coffee page.</p>
                  <p>2. Pay the yearly supporter amount (${plan.price_usd} USD).</p>
                  <p>3. Enter your supporter display name or order receipt ID below.</p>
                </div>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  {method === "upi" ? "UPI Reference / UTR Number *" : "Supporter Name / Receipt ID *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={method === "upi" ? "e.g. 423589012345" : "e.g. John Doe / Order #12345"}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Upload Payment Screenshot / Proof (Optional, max 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] hover:border-[var(--color-border-subtle)] cursor-pointer">
                    <Upload size={14} className="text-[var(--color-text-muted)]" />
                    <span>{proofFile ? proofFile.name : "Choose screenshot (JPG/PNG/WebP)..."}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {proofFile && (
                    <button
                      type="button"
                      onClick={() => setProofFile(null)}
                      className="text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  className="w-full font-bold flex items-center justify-center gap-2"
                >
                  {submitting ? "Submitting Verification..." : "Submit Payment for Review"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── PAYMENT HISTORY TABLE ─────────────────────────────────────────── */}
      {payments.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--color-text)] font-display">
            Your Payment Submissions
          </h3>
          <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] meta-mono uppercase tracking-wider">
                <tr>
                  <th className="p-3 font-semibold">Payment ID</th>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Method</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Reference</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                {payments.map((p) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      PENDING
                    </span>
                  );
                  if (p.status === "approved") {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        APPROVED
                      </span>
                    );
                  } else if (p.status === "rejected") {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-red-500/10 text-red-600 dark:text-red-400">
                        REJECTED
                      </span>
                    );
                  }

                  return (
                    <tr key={p.payment_id} className="hover:bg-[var(--color-surface-sunken)]/50">
                      <td className="p-3 font-mono text-[11px] text-[var(--color-text-muted)]">
                        {p.payment_id}
                      </td>
                      <td className="p-3 text-[var(--color-text-secondary)]">
                        {new Date(p.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 uppercase text-[11px] meta-mono font-bold text-[var(--color-text)]">
                        {p.payment_method}
                      </td>
                      <td className="p-3 font-mono font-bold text-[var(--color-text)]">
                        {p.currency === "INR" ? `₹${p.amount}` : `$${p.amount}`}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[var(--color-text)]">
                        {p.reference}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          {statusBadge}
                          {p.rejection_reason && (
                            <span className="text-[10px] text-red-500 mt-0.5">
                              {p.rejection_reason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
