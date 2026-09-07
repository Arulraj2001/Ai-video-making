import React, { useEffect, useState } from "react";
import { useRouter } from "../../router/Router";
import { useApp } from "../../context/AppContext";
import { Workspace } from "../../components/Workspace";
import { ImportProject } from "../../components/ImportProject";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState, ErrorState } from "../../components/ui/StateViews";
import type { StudioStage } from "../../components/Header";
import { FileText, BookOpen, Clapperboard, Sliders, Film } from "lucide-react";

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

  const stages: Array<{ id: StudioStage; label: string; icon: React.ReactNode }> = [
    { id: "script",     label: "Script & Audio",   icon: <FileText size={13} /> },
    { id: "bible",      label: "Video Bible",       icon: <BookOpen size={13} /> },
    { id: "storyboard", label: "Storyboard",        icon: <Clapperboard size={13} /> },
    { id: "timeline",   label: "Timeline Studio",   icon: <Sliders size={13} /> },
    { id: "export",     label: "Export & Deliver",  icon: <Film size={13} /> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Director's Suite: Stage Stepper ─────────────────────────── */}
      <nav className="sb-stage-stepper" aria-label="Studio stages">
        {stages.map((stage, index) => {
          const isActive = activeStage === stage.id;
          return (
            <React.Fragment key={stage.id}>
              {index > 0 && <div className="sb-stage-connector" aria-hidden="true" />}
              <button
                type="button"
                onClick={() => setActiveStage(stage.id)}
                className={`sb-stage-step ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="sb-stage-num">{index + 1}</span>
                <span className="hidden sm:flex items-center gap-1.5">
                  {stage.icon}
                  <span>{stage.label}</span>
                </span>
                <span className="sm:hidden">{stage.icon}</span>
              </button>
            </React.Fragment>
          );
        })}
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
