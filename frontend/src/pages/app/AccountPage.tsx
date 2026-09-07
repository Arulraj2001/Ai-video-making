import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "../../router/Router";
import { useUsage } from "../../hooks/useUsage";
import { api, type PaymentResponse } from "../../services/api";
import {
  User,
  Copy,
  Check,
  LogOut,
  ShieldCheck,
  Mail,
  Key,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  CreditCard,
} from "lucide-react";

export const AccountPage: React.FC = () => {
  const { user, isAdmin, signOutUser } = useAuth();
  const { navigate } = useRouter();
  const { usage, loading: usageLoading } = useUsage();

  const [copiedUid, setCopiedUid] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    api
      .getUserPayments()
      .then((data) => {
        if (mounted) setPayments(data);
      })
      .catch(() => {
        // silent fallback
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      navigate("/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName = user?.displayName || "Scenora Creator";
  const userEmail = user?.email || "No email provided";
  const providerId = user?.providerData?.[0]?.providerId || (user?.email ? "password" : "unknown");
  const providerLabel = providerId === "google.com" ? "Google Account" : "Email / Password";

  // Initials generator
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isPro = usage?.has_active_entitlement;
  const pendingPayment = payments.find((p) => p.status === "pending");
  const rejectedPayment = payments.find((p) => p.status === "rejected");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Creator Profile"
        subtitle="Manage your ScenoraEdits authentication, subscription membership, and session settings."
      />

      <div className="space-y-6">
        {/* User Identity Card */}
        <Card variant="default" className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-16 h-16 rounded-2xl object-cover border border-[var(--color-border)] shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold text-xl font-display shadow-sm">
              {initials || <User size={28} />}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-[var(--color-text)] font-display truncate">
                {displayName}
              </h3>
              {isAdmin && (
                <Badge variant="primary">
                  <ShieldCheck size={12} className="inline mr-1" />
                  Administrator
                </Badge>
              )}
              {isPro ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles size={11} />
                  PRO YEARLY
                </span>
              ) : (
                <Badge variant="default">FREE CREATOR</Badge>
              )}
              <Badge variant="default">{providerLabel}</Badge>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <Mail size={13} className="shrink-0 text-[var(--color-text-muted)]" />
              <span className="truncate">{userEmail}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-2 font-mono">
              <span className="truncate">UID: {user?.uid || "Local Session"}</span>
              {user?.uid && (
                <button
                  onClick={handleCopyUid}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                  title="Copy User ID"
                >
                  {copiedUid ? <Check size={10} className="text-[var(--color-success)]" /> : <Copy size={10} />}
                  <span>{copiedUid ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LogOut size={14} />}
            isLoading={isSigningOut}
            onClick={handleSignOut}
            className="self-stretch sm:self-auto"
          >
            Sign Out
          </Button>
        </Card>

        {/* Subscription & Membership Plan Card */}
        <Card variant="default" className="p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isPro ? "bg-amber-500/10 text-amber-400" : "bg-[var(--color-card-subtle)] text-[var(--color-text-muted)]"}`}>
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text)] font-display">
                  Subscription & Entitlement Plan
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {isPro
                    ? "Active All-Access Pro Yearly Membership with full studio features."
                    : "Standard Free Creator tier with daily generation limits."}
                </p>
              </div>
            </div>

            {isPro ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                <Sparkles size={13} className="text-amber-400" />
                Active Pro Member
              </span>
            ) : (
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight size={13} />}
                onClick={() => navigate("/app/upgrade")}
                className="font-bold text-xs"
              >
                Upgrade to Pro
              </Button>
            )}
          </div>

          {/* Pending Payment Alert */}
          {pendingPayment && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Clock size={18} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-amber-300 block">
                  Payment Under Review (Ref: {pendingPayment.reference})
                </span>
                <p className="text-[var(--color-text-secondary)]">
                  Your payment submission ({pendingPayment.currency} {pendingPayment.amount} via{" "}
                  {pendingPayment.payment_method.toUpperCase()}) is being verified by our administrative team.
                  Verification typically completes within 10–30 minutes.
                </p>
              </div>
            </div>
          )}

          {/* Rejected Payment Alert */}
          {rejectedPayment && !isPro && !pendingPayment && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-red-300 block">
                    Payment Verification Rejected
                  </span>
                  <p className="text-[var(--color-text-secondary)]">
                    Reason: <span className="text-red-200 font-medium">{rejectedPayment.rejection_reason || "Payment could not be verified."}</span>
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate("/app/upgrade")}
                className="shrink-0 text-xs"
              >
                Re-submit
              </Button>
            </div>
          )}

          {/* Plan Details Box */}
          <div className="p-4 rounded-xl bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] space-y-3">
            {isPro ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[var(--color-text-muted)] font-medium">Membership Status</span>
                  <span className="font-bold text-[var(--color-success)] flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Full All-Access Entitlement
                  </span>
                </div>
                {usage?.entitlement_expires_at && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[var(--color-text-muted)] font-medium">Valid Until</span>
                    <span className="font-bold text-[var(--color-text)] font-mono">
                      {new Date(usage.entitlement_expires_at).toLocaleDateString(undefined, {
                        dateStyle: "full",
                      })}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-[var(--color-border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>Unlimited SANA-Sprint AI Images</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>Unlimited 1080p & 4K Cinema Exports</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>Priority Cloud Rendering Queue</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>Full Commercial Video Rights</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[var(--color-text-muted)] font-medium">Daily AI Generation Quota</span>
                  <span className="font-bold text-[var(--color-text)] font-mono">
                    {usageLoading ? "..." : `${usage?.current_usage || 0} / ${usage?.limit || 3} used today`}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[var(--color-surface)] overflow-hidden border border-[var(--color-border-subtle)]">
                  <div
                    className="h-full bg-[var(--color-primary)] transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((usage?.current_usage || 0) / Math.max(1, usage?.limit || 3)) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Daily reset happens at midnight UTC. Upgrade to Pro for zero generation limits and unlimited 1080p/4K exports.
                </p>
              </div>
            )}
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Payment History
              </h4>
              <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden divide-y divide-[var(--color-border-subtle)]">
                {payments.map((p) => {
                  const badgeVariant =
                    p.status === "approved" ? "success" : p.status === "rejected" ? "error" : "warning";
                  return (
                    <div
                      key={p.payment_id}
                      className="p-3 bg-[var(--color-card-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--color-text)]">
                            {p.currency} {p.amount}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] uppercase">
                            · {p.payment_method}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                          Ref / UTR: {p.reference}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {new Date(p.submitted_at).toLocaleDateString()}
                        </span>
                        <Badge variant={badgeVariant as any}>
                          {p.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Authentication & Session Info */}
        <Card variant="default" className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text)] font-['Outfit',sans-serif] flex items-center gap-2">
            <Key size={16} className="text-[var(--color-primary)]" />
            <span>Authentication Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Provider ID</span>
              <span className="font-semibold text-[var(--color-text)] font-mono">{providerId}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Email Verification</span>
              <span className="font-semibold text-[var(--color-text)]">
                {user?.emailVerified ? (
                  <span className="text-[var(--color-success)]">Verified</span>
                ) : (
                  <span className="text-[var(--color-warning)]">Unverified</span>
                )}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Account Created</span>
              <span className="font-medium text-[var(--color-text)]">
                {user?.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })
                  : "Current Session"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Last Sign In</span>
              <span className="font-medium text-[var(--color-text)]">
                {user?.metadata?.lastSignInTime
                  ? new Date(user.metadata.lastSignInTime).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })
                  : "Just now"}
              </span>
            </div>
          </div>
        </Card>

        {/* Subscription / Engine Status */}
        <Card variant="default" className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text)] font-display">
            Active Studio Engine
          </h3>
          <div className="p-4 rounded-xl bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[var(--color-text)] block">
                Local SANA-Sprint & Cloud Director
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                Full access to Visual Storyboard, Timeline Multi-track, and Cinema Export
              </span>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
