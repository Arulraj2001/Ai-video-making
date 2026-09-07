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
    { id: "script", label: "Script & Audio", icon: <FileText size={14} /> },
    { id: "bible", label: "Video Bible", icon: <BookOpen size={14} /> },
    { id: "storyboard", label: "Storyboard", icon: <Clapperboard size={14} /> },
    { id: "timeline", label: "Timeline Studio", icon: <Sliders size={14} /> },
    { id: "export", label: "Export & Deliver", icon: <Film size={14} /> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <nav className="studio-stage-nav" aria-label="Studio stages">
        {stages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => setActiveStage(stage.id)}
            className={`studio-stage-link ${activeStage === stage.id ? "is-active" : ""}`}
          >
            <span className="studio-stage-number">{index + 1}</span>
            {stage.icon}
            <span>{stage.label}</span>
          </button>
        ))}
      </nav>

      <div className="studio-container flex-1">
        {viewMode === "import" ? (
          <ImportProject
            onSuccess={() => {
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
