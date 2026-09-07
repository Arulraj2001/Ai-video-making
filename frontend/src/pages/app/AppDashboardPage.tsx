import React, { useState, useEffect } from "react";
import { useRouter } from "../../router/Router";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useUsage } from "../../hooks/useUsage";
import { api, type PaymentResponse } from "../../services/api";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/EmptyState";
import { Film, Plus, Sliders, Calendar, Cpu, ArrowRight, Sparkles, Clock, AlertTriangle } from "lucide-react";

export const AppDashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { usage } = useUsage();
  const {
    projects,
    activeProject,
    projectsLoading,
    projectsError,
    selectProject,
    setIsCreateModalOpen,
    setIsRestoreModalOpen,
  } = useApp();

  const [payments, setPayments] = useState<PaymentResponse[]>([]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    api
      .getUserPayments()
      .then((data) => {
        if (mounted) setPayments(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleOpenStudio = (projectId: string) => {
    selectProject(projectId);
    navigate(`/app/studio/${projectId}`);
  };

  const totalScenes = projects.reduce((acc, p) => acc + (p.scenes?.length || 0), 0);
  const isPro = usage?.has_active_entitlement;
  const pendingPayment = payments.find((p) => p.status === "pending");
  const rejectedPayment = payments.find((p) => p.status === "rejected");

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader
        title="Creator Dashboard"
        subtitle="Manage your video projects, storyboard timelines, and production pipelines."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRestoreModalOpen(true)}
            >
              Restore Backup
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Project
            </Button>
          </div>
        }
      />

      {/* Payment & Subscription Notification Banners */}
      {pendingPayment && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <Clock size={20} className="text-amber-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
            <div>
              <h4 className="text-xs font-bold text-amber-300">Payment Verification Under Review (Ref: {pendingPayment.reference})</h4>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Your payment submission is being verified by the admin team. Pro features will unlock automatically upon confirmation.
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/app/account")} className="shrink-0 text-xs">
            View Status
          </Button>
        </div>
      )}

      {rejectedPayment && !isPro && !pendingPayment && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="text-xs font-bold text-red-300">Payment Submission Rejected</h4>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Reason: {rejectedPayment.rejection_reason || "Payment could not be verified."}
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate("/app/upgrade")} className="shrink-0 text-xs font-bold">
            Re-submit Payment
          </Button>
        </div>
      )}

      {!isPro && !pendingPayment && !rejectedPayment && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-xs font-bold text-[var(--color-text)]">Upgrade to Pro Yearly</h4>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Get 365 days of unrestricted creative power with unlimited 1080p/4K Cinema Exports and batch AI generations.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight size={13} />}
            onClick={() => navigate("/app/upgrade")}
            className="shrink-0 text-xs font-bold"
          >
            Upgrade Now
          </Button>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card variant="default" className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
            <Film size={20} />
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-muted)] font-medium">Projects</span>
            <h4 className="text-xl font-bold text-[var(--color-text)] font-display">
              {projects.length}
            </h4>
          </div>
        </Card>

        <Card variant="default" className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-secondary-subtle)] text-[var(--color-secondary)]">
            <Sliders size={20} />
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-muted)] font-medium">Total Scenes</span>
            <h4 className="text-xl font-bold text-[var(--color-text)] font-display">
              {totalScenes}
            </h4>
          </div>
        </Card>

        <Card variant="default" className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-success-subtle)] text-[var(--color-success)]">
            <Cpu size={20} />
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-muted)] font-medium">Inference Engine</span>
            <h4 className="text-xl font-bold text-[var(--color-text)] font-display">
              Active & Ready
            </h4>
          </div>
        </Card>
      </div>

      {/* Projects Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[var(--color-text)] font-display">
            Recent Projects
          </h2>
          {projects.length > 0 && (
            <button
              onClick={() => navigate("/app/projects")}
              className="app-action-link"
            >
              View all ({projects.length}) <ArrowRight size={12} />
            </button>
          )}
        </div>

        {projectsLoading ? (
          <Card variant="default" className="p-10 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">Loading your projects...</p>
          </Card>
        ) : projectsError ? (
          <Card variant="default" className="p-10 text-center">
            <p className="text-sm text-[var(--color-danger)]">{projectsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="app-action-link mt-3"
            >
              Try again
            </button>
          </Card>
        ) : projects.length === 0 ? (
          <EmptyState
            onOpenImport={() => setIsCreateModalOpen(true)}
            onCreateProject={() => setIsCreateModalOpen(true)}
            onOpenRestore={() => setIsRestoreModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {projects.slice(0, 6).map((project) => {
              const isActive = activeProject?.id === project.id;
              const sceneCount = project.scenes?.length || 0;
              const formattedDate = new Date(project.updated_at).toLocaleDateString();

              return (
                <Card
                  key={project.id}
                  variant="project"
                  className="flex flex-col justify-between p-5 group"
                  onClick={() => handleOpenStudio(project.id)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={isActive ? "primary" : "default"}>
                        {project.canvas_settings?.aspect_ratio || "16:9"}
                      </Badge>
                      {isActive && (
                        <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[var(--color-text)] font-display group-hover:text-[var(--color-primary)] transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
                      {project.description || "Video project storyboard and timeline"}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Sliders size={12} /> {sceneCount} scenes
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                      <Calendar size={12} /> {formattedDate}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
