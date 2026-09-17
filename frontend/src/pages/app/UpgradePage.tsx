import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import "./UpgradePage.css";
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
  Zap,
} from "lucide-react";

export const UpgradePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<PlanConfigResponse[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("scenora-pro-yearly");
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
      const [allPlans, entData, paymentsData] = await Promise.all([
        api.getPlans(),
        api.getCurrentEntitlement(),
        api.getUserPayments().catch(() => []),
      ]);
      setPlans(allPlans);
      if (allPlans.length > 0 && !allPlans.some((p) => p.plan_id === selectedPlanId)) {
        setSelectedPlanId(allPlans[0].plan_id);
      }
      setEntitlement(entData);
      setPayments(paymentsData);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activePlan = plans.find((p) => p.plan_id === selectedPlanId) || plans[0] || null;

  const handleCopyUpi = () => {
    if (!activePlan?.upi_id) return;
    navigator.clipboard.writeText(activePlan.upi_id);
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
    if (!activePlan) return;
    if (!reference.trim()) {
      setErrorMsg("Please enter your transaction reference / UTR number.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const currency = method === "upi" ? "INR" : "USD";
      const amount = method === "upi" ? activePlan.price_inr : activePlan.price_usd;

      // 1. Submit payment record
      const payment = await api.submitPayment({
        plan_id: activePlan.plan_id,
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

  if (loading && plans.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <LoadingState message="Loading ScenoraEdits creator passes..." />
      </div>
    );
  }

  const hasActiveMembership = entitlement && entitlement.is_active;
  const pendingPayment = payments.find((p) => p.status === "pending");
  const rejectedPayment = payments.find((p) => p.status === "rejected");

  const durationMonths = activePlan ? Math.round(activePlan.duration_days / 30) : 12;
  const priceInr = activePlan ? activePlan.price_inr : 2999;
  const priceUsd = activePlan ? activePlan.price_usd : 49;
  const monthlyInr = Math.round(priceInr / (durationMonths || 1));
  const monthlyUsd = (priceUsd / (durationMonths || 1)).toFixed(2);

  return (
    <div className="upg-page">
      <PageHeader
        title="Creator Pro Membership Pass"
        subtitle="Transparent platform & development pass for the studio timeline, Video Bible™ continuity, audio ducking, and BYOK unlimited generations."
        className="mb-6 pb-4"
      />

      {/* ─── PLATFORM DEVELOPMENT & BYOK TRANSPARENCY NOTICE ─────────────────── */}
      <div className="upg-notice-card">
        <div className="upg-notice-icon">
          <Zap size={22} />
        </div>
        <div>
          <h4 className="upg-notice-title">
            Transparent Software Platform License (Zero Token Markup)
          </h4>
          <p className="upg-notice-desc">
            You are paying for our software engineering, timeline studio, and workflow automation. Connect your own API keys (BYOK: Gemini, OpenAI, Replicate, Fal.ai) or run unlimited on local RTX GPUs with zero token markups. No monthly token expiration anxiety.
          </p>
        </div>
      </div>

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
        <div className="upg-status-banner is-active-member">
          <div className="upg-status-icon">
            <ShieldCheck size={26} />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                👑 Active ScenoraEdits Creator Pro Member
              </h3>
              <span className="upg-badge-status is-approved">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              You have full access to priority cloud rendering and the studio pipeline. Expiration date:{" "}
              <strong>{new Date(entitlement.expires_at).toLocaleDateString()}</strong> (
              {entitlement.days_remaining} days remaining).
            </p>
          </div>
        </div>
      )}

      {/* ─── PENDING VERIFICATION BANNER ─────────────────────────────────────── */}
      {!hasActiveMembership && pendingPayment && (
        <div className="upg-status-banner is-pending">
          <div className="upg-status-icon">
            <Clock size={26} />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                Payment Verification Pending
              </h3>
              <span className="upg-badge-status is-pending">
                PENDING REVIEW
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Transaction Reference: <span className="font-mono font-bold text-[var(--color-text)]">{pendingPayment.reference}</span> ·{" "}
              Submitted: {new Date(pendingPayment.submitted_at).toLocaleString()}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] pt-1">
              Our team is reviewing your transaction. Your account will automatically activate once approved.
            </p>
          </div>
        </div>
      )}

      {/* ─── REJECTED PAYMENT BANNER ───────────────────────────────────────── */}
      {!hasActiveMembership && !pendingPayment && rejectedPayment && (
        <div className="upg-status-banner is-rejected">
          <div className="upg-status-icon">
            <AlertTriangle size={26} />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                Previous Payment Submission Rejected
              </h3>
              <span className="upg-badge-status is-rejected">
                ACTION REQUIRED
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Reference submitted: <span className="font-mono font-bold text-[var(--color-text)]">{rejectedPayment.reference}</span> ·{" "}
              Date: {new Date(rejectedPayment.submitted_at).toLocaleDateString()}
            </p>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500">
              <strong>Admin Reason: </strong>{rejectedPayment.rejection_reason || "Payment could not be verified by admin."}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] pt-1">
              Please verify your transaction details in your banking app and submit your corrected reference/screenshot below.
            </p>
          </div>
        </div>
      )}

      {/* ─── DURATION SWITCHER (6 MONTHS VS 1 YEAR) ─────────────────────────── */}
      {plans.length > 1 && (
        <div className="upg-duration-wrapper">
          <div className="upg-duration-title">
            <Sparkles size={16} className="text-amber-500" />
            Choose Your Access Duration:
          </div>
          <div className="upg-duration-pills">
            {plans.map((p) => {
              const isSelected = p.plan_id === activePlan?.plan_id;
              const isYear = p.duration_days >= 300;
              return (
                <button
                  key={p.plan_id}
                  type="button"
                  onClick={() => setSelectedPlanId(p.plan_id)}
                  className={`upg-duration-btn ${isSelected ? "is-active" : ""}`}
                >
                  <span>{isYear ? "1 Year (Annual Pass)" : "6 Months Pass"}</span>
                  <span className="upg-duration-badge">{p.duration_days} Days</span>
                  {isYear && <span className="upg-save-badge">Save 25%</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── PLAN OVERVIEW & PAYMENT SECTION ─────────────────────────────── */}
      {activePlan && (
        <div className="upg-grid">
          {/* ─── LEFT COLUMN: PLAN OVERVIEW ───────────────────────────────── */}
          <div className="upg-plan-card">
            <div className="space-y-4">
              <div className="upg-plan-top">
                <span className="upg-plan-badge">
                  <Sparkles size={13} />
                  CREATOR PASS
                </span>
                <span className="upg-plan-days">
                  {activePlan.duration_days} DAYS
                </span>
              </div>

              <div>
                <h2 className="upg-plan-name">
                  {activePlan.name}
                </h2>

                <div className="upg-price-row">
                  <span className="upg-price-main">
                    {method === "upi" ? `₹${priceInr.toLocaleString()}` : `$${priceUsd}`}
                  </span>
                  <span className="upg-price-sub">
                    {method === "upi"
                      ? `INR / ${activePlan.duration_days} DAYS (~₹${monthlyInr}/MO)`
                      : `USD / ${activePlan.duration_days} DAYS (~$${monthlyUsd}/MO)`}
                  </span>
                </div>
              </div>

              <p className="upg-plan-desc">
                {activePlan.description}
              </p>

              <div className="upg-features-box">
                <div className="upg-features-header">
                  What's Included
                </div>
                {activePlan.features.map((feat, i) => (
                  <div key={i} className="upg-feature-item">
                    <div className="upg-feature-check">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: PAYMENT & SUBMISSION SECTION ───────────────── */}
          <div className="upg-payment-card">
            <div className="upg-section-header">
              <h3>
                <Sparkles size={17} className="text-amber-500" />
                Select Payment Method
              </h3>
              <p>
                Pay using India UPI or International Buy Me a Coffee / Card, then submit your reference below.
              </p>
            </div>

            {/* Method Switcher Tabs */}
            <div className="upg-method-grid">
              <button
                type="button"
                onClick={() => setMethod("upi")}
                className={`upg-method-btn ${method === "upi" ? "is-active" : ""}`}
              >
                <div className="upg-method-icon">
                  <QrCode size={19} />
                </div>
                <div>
                  <div className="upg-method-title">India UPI / QR</div>
                  <div className="upg-method-sub">₹{priceInr.toLocaleString()} INR</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("buymeacoffee")}
                className={`upg-method-btn ${method === "buymeacoffee" ? "is-active" : ""}`}
              >
                <div className="upg-method-icon">
                  <Coffee size={19} />
                </div>
                <div>
                  <div className="upg-method-title">Buy Me a Coffee / Card</div>
                  <div className="upg-method-sub">${priceUsd} USD (Intl)</div>
                </div>
              </button>
            </div>

            {/* Method Payment Box */}
            {method === "upi" ? (
              <div className="upg-method-box">
                {/* Hero QR & Payee Row */}
                <div className="upg-qr-row">
                  {activePlan.upi_qr_url && activePlan.upi_qr_url.trim() !== "" && (
                    <div className="upg-qr-frame">
                      <img
                        src={activePlan.upi_qr_url}
                        alt="Scan to pay with UPI"
                      />
                    </div>
                  )}
                  <div className="upg-qr-info">
                    <span className="block text-xs font-bold text-[var(--color-text)]">
                      {activePlan.upi_qr_url && activePlan.upi_qr_url.trim() !== ""
                        ? "Scan QR or pay directly via UPI"
                        : "Pay directly via UPI"}
                    </span>
                    <div className="text-2xl font-black text-[var(--color-text)] font-display leading-none">
                      ₹{priceInr.toLocaleString()}{" "}
                      <span className="text-xs font-mono font-normal text-[var(--color-text-muted)]">INR</span>
                    </div>
                    <div>
                      <div className="upg-upi-tag" title="UPI ID">
                        {activePlan.upi_id}
                      </div>
                    </div>
                    <div className="upg-btn-group">
                      <button
                        type="button"
                        className="upg-btn-copy"
                        onClick={handleCopyUpi}
                      >
                        {copiedUpi ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span>{copiedUpi ? "Copied!" : "Copy UPI ID"}</span>
                      </button>
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(activePlan.upi_id)}&pn=ScenoraEdits&am=${priceInr}&cu=INR&tn=${encodeURIComponent(activePlan.name)}`}
                        className="upg-btn-open-app"
                      >
                        Open UPI App
                      </a>
                    </div>
                  </div>
                </div>

                {/* 3-Step Guide */}
                <div className="upg-steps">
                  <div className="text-[10px] font-bold meta-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                    How to complete payment
                  </div>
                  <div className="upg-step-item">
                    <div className="upg-step-num">1</div>
                    <p>
                      {activePlan.upi_qr_url && activePlan.upi_qr_url.trim() !== ""
                        ? "Scan the QR code above or pay to the UPI ID"
                        : "Pay to the UPI ID above"}{" "}
                      using <strong>Google Pay, PhonePe, Paytm, or BHIM</strong>.
                    </p>
                  </div>
                  <div className="upg-step-item">
                    <div className="upg-step-num">2</div>
                    <p>
                      Complete the transfer of <strong>₹{priceInr.toLocaleString()} INR</strong> for {activePlan.name}.
                    </p>
                  </div>
                  <div className="upg-step-item">
                    <div className="upg-step-num">3</div>
                    <p>
                      Copy the 12-digit <strong>UTR / UPI Reference ID</strong> from your transaction receipt and submit below.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="upg-method-box">
                <div className="upg-bmc-box">
                  <div>
                    <div className="upg-bmc-title">
                      International Membership
                    </div>
                    <div className="upg-bmc-headline">
                      Buy Me a Coffee · ${priceUsd} USD
                    </div>
                  </div>
                  <a
                    href={activePlan.bmc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Buy Me a Coffee payment page in a new tab"
                    title="Open Buy Me a Coffee page"
                    className="upg-bmc-btn"
                  >
                    <Coffee size={15} />
                    <span>Open BMC Page</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="upg-steps">
                  <div className="text-[10px] font-bold meta-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                    How to complete payment
                  </div>
                  <div className="upg-step-item">
                    <div className="upg-step-num">1</div>
                    <p>Click the button above to visit our official Buy Me a Coffee page.</p>
                  </div>
                  <div className="upg-step-item">
                    <div className="upg-step-num">2</div>
                    <p>Pay the supporter membership of <strong>${priceUsd} USD</strong>.</p>
                  </div>
                  <div className="upg-step-item">
                    <div className="upg-step-num">3</div>
                    <p>Enter your supporter display name or order receipt ID in the form below.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmitPayment} className="upg-form">
              <div>
                <label className="upg-input-label">
                  {method === "upi" ? "UPI Reference / UTR Number *" : "Supporter Name / Receipt ID *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={method === "upi" ? "e.g. 423589012345" : "e.g. John Doe / Order #12345"}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="upg-input"
                />
              </div>

              <div>
                <label className="upg-input-label">
                  Upload Payment Screenshot / Proof (Optional, max 5MB)
                </label>
                <div className="upg-file-upload-box">
                  <label className="upg-file-label">
                    <Upload size={15} className="text-[var(--color-text-muted)]" />
                    <span className="truncate max-w-[220px]">{proofFile ? proofFile.name : "Choose screenshot (JPG/PNG/WebP)..."}</span>
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
                      className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="upg-submit-btn"
                >
                  {submitting ? "Submitting Verification..." : `Submit Payment for ${activePlan.name}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PAYMENT HISTORY TABLE ─────────────────────────────────────────── */}
      {payments.length > 0 && (
        <div className="upg-history-wrap">
          <h3 className="upg-history-title">
            Your Payment Submissions
          </h3>
          <div className="upg-history-card">
            <table className="w-full text-left text-xs app-data-table">
              <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] meta-mono uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 font-semibold">Payment ID</th>
                  <th className="p-3.5 font-semibold">Date</th>
                  <th className="p-3.5 font-semibold">Method</th>
                  <th className="p-3.5 font-semibold">Amount</th>
                  <th className="p-3.5 font-semibold">Reference</th>
                  <th className="p-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                {payments.map((p) => {
                  let statusBadge = (
                    <span className="upg-badge-status is-pending">
                      PENDING
                    </span>
                  );
                  if (p.status === "approved") {
                    statusBadge = (
                      <span className="upg-badge-status is-approved">
                        APPROVED
                      </span>
                    );
                  } else if (p.status === "rejected") {
                    statusBadge = (
                      <span className="upg-badge-status is-rejected">
                        REJECTED
                      </span>
                    );
                  }

                  return (
                    <tr key={p.payment_id} className="hover:bg-[var(--color-surface-sunken)]/50 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                        {p.payment_id}
                      </td>
                      <td className="p-3.5 text-[var(--color-text-secondary)]">
                        {new Date(p.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 uppercase text-[11px] meta-mono font-bold text-[var(--color-text)]">
                        {p.payment_method}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[var(--color-text)]">
                        {p.currency === "INR" ? `₹${p.amount}` : `$${p.amount}`}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[var(--color-text)]">
                        {p.reference}
                      </td>
                      <td className="p-3.5">
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

export default UpgradePage;
