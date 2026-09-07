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
  Clock,
  QrCode,
  Coffee,
  Copy,
  Check,
  Upload,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <LoadingState message="Loading ScenoraEdits subscription options..." />
      </div>
    );
  }

  const hasActiveMembership = entitlement && entitlement.is_active;
  const pendingPayment = payments.find((p) => p.status === "pending");
  const rejectedPayment = payments.find((p) => p.status === "rejected");

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-16 sm:pt-20 pb-16 space-y-8">
      <PageHeader
        title="Upgrade to Pro Yearly"
        subtitle="One annual pass for unlimited AI scene generation, high-speed cloud rendering, and character consistency."
        className="mb-10 pb-8"
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

      {/* ─── REJECTED PAYMENT BANNER ───────────────────────────────────────── */}
      {!hasActiveMembership && !pendingPayment && rejectedPayment && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border-2 border-red-500/50 shadow-sm space-y-2">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  Previous Payment Submission Rejected
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-red-500/10 text-red-500 border border-red-500/20">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Reference submitted: <span className="font-mono font-bold text-[var(--color-text)]">{rejectedPayment.reference}</span> ·{" "}
                Date: {new Date(rejectedPayment.submitted_at).toLocaleDateString()}
              </p>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <strong>Admin Reason: </strong>{rejectedPayment.rejection_reason || "Payment could not be verified by admin."}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] pt-1">
                Please verify your transaction details in your banking app and submit your corrected reference/screenshot below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── PLAN OVERVIEW & PAYMENT SECTION ─────────────────────────────── */}
      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ─── LEFT COLUMN: PLAN OVERVIEW ───────────────────────────────── */}
          <Card className="lg:col-span-3 p-6 flex flex-col justify-between border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/[0.04] via-transparent to-transparent shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold meta-mono uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  ALL-ACCESS PASS
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold meta-mono bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  365 DAYS
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold font-display tracking-tight text-[var(--color-text)]">
                  {plan.name}{" "}
                  <span className="text-amber-500 font-semibold text-base block sm:inline">
                    (Yearly)
                  </span>
                </h2>

                <div className="flex items-baseline gap-2 mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
                  <span className="text-3xl sm:text-4xl font-black text-[var(--color-text)] font-display tracking-tight">
                    {method === "upi" ? `₹${plan.price_inr.toLocaleString()}` : `$${plan.price_usd}`}
                  </span>
                  <span className="text-xs meta-mono font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {method === "upi" ? "INR / 1 Year" : "USD / 1 Year"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {plan.description}
              </p>

              <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2.5">
                <div className="text-[10px] font-bold meta-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  What's Included
                </div>
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--color-text)]">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ─── RIGHT COLUMN: PAYMENT & SUBMISSION SECTION ───────────────── */}
          <Card className="lg:col-span-9 p-6 space-y-6 shadow-sm border border-[var(--color-border)]">
            <div>
              <h3 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <Sparkles size={17} className="text-amber-500" />
                Select Payment Method
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Pay using India UPI or International Buy Me a Coffee, then submit your transaction details below.
              </p>
            </div>

            {/* Method Switcher Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("upi")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  method === "upi"
                    ? "border-amber-500 bg-amber-500/10 shadow-xs"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  method === "upi" ? "bg-amber-500 text-white" : "bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)]"
                }`}>
                  <QrCode size={18} />
                </div>
                <div>
                  <div className={`text-xs font-bold ${method === "upi" ? "text-amber-500" : "text-[var(--color-text)]"}`}>
                    India UPI / QR
                  </div>
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
                    ? "border-amber-500 bg-amber-500/10 shadow-xs"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  method === "buymeacoffee" ? "bg-amber-500 text-white" : "bg-[var(--color-surface-sunken)] text-amber-500"
                }`}>
                  <Coffee size={18} />
                </div>
                <div>
                  <div className={`text-xs font-bold ${method === "buymeacoffee" ? "text-amber-500" : "text-[var(--color-text)]"}`}>
                    Buy Me a Coffee
                  </div>
                  <div className="text-[11px] meta-mono text-[var(--color-text-muted)]">
                    ${plan.price_usd} USD (Intl)
                  </div>
                </div>
              </button>
            </div>

            {/* Method Payment Box */}
            {method === "upi" ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/30 space-y-4">
                {/* Hero QR & Payee Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 sm:p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                  {plan.upi_qr_url && plan.upi_qr_url.trim() !== "" && (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-white p-1.5 rounded-xl flex items-center justify-center shadow-xs border border-gray-200 overflow-hidden">
                      <img
                        src={plan.upi_qr_url}
                        alt="Scan to pay with UPI"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 w-full space-y-3 text-center sm:text-left">
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold text-[var(--color-text)]">
                        {plan.upi_qr_url && plan.upi_qr_url.trim() !== ""
                          ? "Scan QR or pay via UPI"
                          : "Pay via UPI"}
                      </span>
                      <div className="text-2xl font-black text-[var(--color-text)] font-display leading-none">
                        ₹{plan.price_inr.toLocaleString()}{" "}
                        <span className="text-xs font-mono font-normal text-[var(--color-text-muted)]">INR</span>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-[var(--color-card-subtle)] border border-amber-500/30 inline-block max-w-full">
                        <span className="text-xs font-mono font-bold text-[var(--color-primary)] break-all select-all" title="UPI ID">
                          {plan.upi_id}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-start gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap px-3.5 py-2"
                        onClick={handleCopyUpi}
                      >
                        {copiedUpi ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span>{copiedUpi ? "Copied!" : "Copy UPI ID"}</span>
                      </Button>
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(plan.upi_id)}&pn=ScenoraEdits&am=${plan.price_inr}&cu=INR&tn=Scenora%20Pro%20Yearly`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                      >
                        Open UPI App
                      </a>
                    </div>
                  </div>
                </div>

                {/* 3-Step Guide */}
                <div className="space-y-2 pt-1 border-t border-[var(--color-border-subtle)]">
                  <div className="text-[10px] font-bold meta-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                    How to complete payment
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-amber-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="leading-snug">
                      {plan.upi_qr_url && plan.upi_qr_url.trim() !== ""
                        ? "Scan the QR code above or pay to the UPI ID"
                        : "Pay to the UPI ID above"}{" "}
                      using <strong>Google Pay, PhonePe, Paytm, or BHIM</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-amber-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="leading-snug">
                      Complete the transfer of <strong>₹{plan.price_inr.toLocaleString()} INR</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-amber-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="leading-snug">
                      Copy the 12-digit <strong>UTR / UPI Reference ID</strong> from your transaction receipt and submit below.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                  <div>
                    <span className="text-[10px] meta-mono font-bold uppercase tracking-wider text-amber-500">
                      International Membership
                    </span>
                    <div className="text-base font-bold text-[var(--color-text)]">
                      Buy Me a Coffee · ${plan.price_usd} USD
                    </div>
                  </div>
                  <a
                    href={plan.bmc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Buy Me a Coffee payment page in a new tab"
                    title="Open Buy Me a Coffee page"
                    className="inline-flex w-full sm:w-auto min-h-10 items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-bold shadow-sm hover:shadow-md cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 whitespace-nowrap"
                  >
                    <Coffee size={14} />
                    Open BMC Page
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="space-y-2 pt-1 border-t border-[var(--color-border-subtle)]">
                  <div className="text-[10px] font-bold meta-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                    How to complete payment
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-amber-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="leading-snug">Click the button above to visit our official Buy Me a Coffee page.</p>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-amber-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="leading-snug">Pay the yearly supporter membership of <strong>${plan.price_usd} USD</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-amber-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="leading-snug">Enter your supporter display name or order receipt ID in the form below.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4 pt-1">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-500/60 bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Upload Payment Screenshot / Proof (Optional, max 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 border-amber-500/60 bg-[var(--color-surface)] text-xs text-[var(--color-text)] hover:border-amber-500 cursor-pointer transition-colors">
                    <Upload size={14} className="text-[var(--color-text-muted)]" />
                    <span className="truncate max-w-[200px]">{proofFile ? proofFile.name : "Choose screenshot (JPG/PNG/WebP)..."}</span>
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
                  className="w-full font-bold flex items-center justify-center gap-2 py-2.5 shadow-sm"
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
            <table className="w-full text-left text-xs app-data-table">
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
