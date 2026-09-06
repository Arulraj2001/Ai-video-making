import React, { useState } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "../../router/Router";
import { User, Copy, Check, LogOut, ShieldCheck, Mail, Key } from "lucide-react";

export const AccountPage: React.FC = () => {
  const { user, isAdmin, signOutUser } = useAuth();
  const { navigate } = useRouter();
  const [copiedUid, setCopiedUid] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Creator Profile"
        subtitle="Manage your ScenoraEdits authentication, identity, and session settings."
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
