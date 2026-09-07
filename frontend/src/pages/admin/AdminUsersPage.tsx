import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import { api, type AdminUserSummary } from "../../services/api";
import { Search, RefreshCw, User } from "lucide-react";

export const AdminUsersPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUsers = useCallback(async (force: boolean = false) => {
    try {
      if (users.length === 0) setLoading(true);
      setErrorMsg(null);
      const data = await api.getAdminUsers(force);
      setUsers(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load creator accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(false);
  }, [loadUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (tierFilter === "all") return true;
    return u.tier.toLowerCase() === tierFilter.toLowerCase();
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Creator Accounts & Users"
          subtitle="Directory of creators, subscription tiers, and quota consumption. Secrets and API keys are strictly masked."
        />
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
          onClick={() => loadUsers(true)}
        >
          Refresh Users
        </Button>
      </div>

      {errorMsg && (
        <Alert type="error" title="Error">
          {errorMsg}
        </Alert>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="max-w-md w-full">
          <Input
            placeholder="Search by UID or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftElement={<Search size={15} />}
          />
        </div>

        {/* Tier filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-sunken)] rounded-xl border border-[var(--color-border-subtle)] text-xs">
          {[
            { id: "all", label: "All Users" },
            { id: "pro_yearly", label: "👑 Pro Yearly" },
            { id: "byok", label: "🔑 BYOK" },
            { id: "free", label: "Free Tier" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTierFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                tierFilter === tab.id
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading && users.length === 0 ? (
        <LoadingState message="Loading creator accounts..." />
      ) : (
        <Card variant="admin" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse app-data-table">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-card-subtle)] text-[var(--color-text-secondary)] font-bold meta-mono uppercase tracking-wider">
                  <th className="p-3.5">User / UID</th>
                  <th className="p-3.5">Tier & Plan</th>
                  <th className="p-3.5">Entitlement Expiry</th>
                  <th className="p-3.5">Current Usage</th>
                  <th className="p-3.5">Total Gens</th>
                  <th className="p-3.5">Projects</th>
                  <th className="p-3.5">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                      No creators match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    let tierBadge = <Badge variant="secondary">Free Tier</Badge>;
                    if (u.tier === "pro_yearly") {
                      tierBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          👑 Pro Yearly
                        </span>
                      );
                    } else if (u.tier === "byok") {
                      tierBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          🔑 Custom Key
                        </span>
                      );
                    }

                    return (
                      <tr key={u.uid} className="hover:bg-[var(--color-card-interactive)]">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center text-[var(--color-text-muted)] shrink-0">
                              <User size={13} />
                            </div>
                            <div>
                              <div className="font-bold text-[var(--color-text)] font-sans">
                                {u.email || u.uid}
                              </div>
                              <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                                {u.uid}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">{tierBadge}</td>
                        <td className="p-3.5 font-mono text-[11px] text-[var(--color-text-secondary)]">
                          {u.entitlement_expires_at
                            ? new Date(u.entitlement_expires_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-[var(--color-text)]">
                          {u.current_usage}
                        </td>
                        <td className="p-3.5 font-mono text-[var(--color-text-muted)]">
                          {u.total_generations}
                        </td>
                        <td className="p-3.5 font-mono text-[var(--color-text-secondary)]">
                          {u.project_count}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold meta-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Active
                          </span>
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
    </div>
  );
};
