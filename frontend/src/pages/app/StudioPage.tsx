import React, { useEffect, useState } from "react";
import { useRouter } from "../../router/Router";
import { useApp } from "../../context/AppContext";
import { Workspace } from "../../components/Workspace";
import { ImportProject } from "../../components/ImportProject";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState, ErrorState } from "../../components/ui/StateViews";
import type { StudioStage } from "../../components/Header";
import { FileText, BookOpen, Clapperboard, Sliders, Film, Check, AlertTriangle } from "lucide-react";

interface StudioPageProps {
  projectId?: string;
}

export const StudioPage: React.FC<StudioPageProps> = ({ projectId }) => {
  const { navigate } = useRouter();
  const {
    projects,
    activeProject,
    projectsLoading,
    projectsError,
    selectProject,
    deleteProject,
    updateScene,
    applyProjectUpdate,
    patchActiveProject,
    refreshProjects,
    activeStage,
    setActiveStage,
    setIsCreateModalOpen,
    setIsRestoreModalOpen,
  } = useApp();

  const [viewMode, setViewMode] = useState<"studio" | "import">("studio");
  const [showMobileWarning, setShowMobileWarning] = useState<boolean>(true);

  // Synchronize route projectId with activeProject
  useEffect(() => {
    if (projectId && projects.length > 0) {
      if (!activeProject || activeProject.id !== projectId) {
        selectProject(projectId);
      }
    }
  }, [projectId, projects, activeProject, selectProject]);

  if (projectsLoading) {
    return <LoadingState message="Loading ScenoraEdits Studio..." className="py-20" />;
  }

  if (projectsError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorState message={projectsError} onRetry={() => refreshProjects()} />
      </div>
    );
  }

  if (projects.length === 0 || !activeProject) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <EmptyState
          onOpenImport={() => setViewMode("import")}
          onCreateProject={() => setIsCreateModalOpen(true)}
          onOpenRestore={() => setIsRestoreModalOpen(true)}
        />
      </div>
    );
  }

  const stageOrder: StudioStage[] = ["script", "bible", "storyboard", "timeline", "export"];
  const activeStageIdx = stageOrder.indexOf(activeStage);

  const stages: Array<{ id: StudioStage; label: string; icon: React.ReactNode }> = [
    { id: "script",     label: "Script & Audio",   icon: <FileText size={13} /> },
    { id: "bible",      label: "Video Bible",       icon: <BookOpen size={13} /> },
    { id: "storyboard", label: "Storyboard",        icon: <Clapperboard size={13} /> },
    { id: "timeline",   label: "Timeline Studio",   icon: <Sliders size={13} /> },
    { id: "export",     label: "Export & Deliver",  icon: <Film size={13} /> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Mobile Viewport Advisory Banner ──────────────────────────── */}
      {showMobileWarning && (
        <div className="md:hidden bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-500">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>
              ScenoraEdits Studio is optimized for desktop displays. For the best timeline and scene editing experience, use a computer or tablet.
            </span>
          </div>
          <button
            onClick={() => setShowMobileWarning(false)}
            className="ml-3 shrink-0 text-xs font-bold underline cursor-pointer"
          >
            Continue anyway
          </button>
        </div>
      )}

      {/* ── Director's Suite: Stage Stepper ─────────────────────────── */}
      <nav className="sb-stage-stepper" aria-label="Studio stages">
        <div className="flex items-center gap-0 overflow-x-auto py-1">
          {stages.map((stage, index) => {
            const isActive = activeStage === stage.id;
            const isCompleted = index < activeStageIdx;
            return (
              <React.Fragment key={stage.id}>
                {index > 0 && <div className="sb-stage-connector" aria-hidden="true" />}
                <button
                  type="button"
                  onClick={() => setActiveStage(stage.id)}
                  className={`sb-stage-step ${isActive ? "is-active" : isCompleted ? "is-completed" : ""}`}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span className="sb-stage-num">
                    {isCompleted ? <Check size={11} className="stroke-[3]" /> : index + 1}
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5">
                    {stage.icon}
                    <span>{stage.label}</span>
                  </span>
                  <span className="sm:hidden">{stage.icon}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Auto-Save Status Indicator ─────────────────────────────── */}
        <div className="ml-auto hidden md:flex items-center gap-2 pl-4 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>✓ Auto-saved to cloud</span>
          </div>
        </div>
      </nav>

      {/* ── Studio Content Container ─────────────────────────────────── */}
      <div className="studio-container flex-1">
        {viewMode === "import" ? (
          <ImportProject
            targetProject={activeProject}
            onSuccess={(updatedProject) => {
              if (updatedProject) {
                applyProjectUpdate(updatedProject);
              }
              setViewMode("studio");
              refreshProjects();
            }}
            onCancel={() => setViewMode("studio")}
          />
        ) : (
          <Workspace
            project={activeProject}
            activeStage={activeStage}
            onChangeStage={setActiveStage}
            onDeleteProject={async (id) => {
              await deleteProject(id);
              navigate("/app/projects");
            }}
            onOpenImport={() => setViewMode("import")}
            onUpdateScene={async (sceneId, update) => {
              await updateScene(activeProject.id, sceneId, update);
            }}
            onBibleUpdated={(bible) => {
              patchActiveProject((prev) => ({ ...prev, video_bible: bible }));
            }}
            onProjectUpdated={applyProjectUpdate}
          />
        )}
      </div>
    </div>
  );
};
