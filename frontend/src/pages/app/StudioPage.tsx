import React, { useEffect, useState } from "react";
import { useRouter } from "../../router/Router";
import { useApp } from "../../context/AppContext";
import { Workspace } from "../../components/Workspace";
import { ImportProject } from "../../components/ImportProject";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState, ErrorState } from "../../components/ui/StateViews";
import { Button } from "../../components/ui/Button";
import type { StudioStage } from "../../components/Header";
import {
  FileText,
  BookOpen,
  Clapperboard,
  Sliders,
  Film,
  Download,
  UploadCloud,
} from "lucide-react";
import { api } from "../../services/api";

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

  const handleExportBackup = async () => {
    if (!activeProject) return;
    try {
      await api.exportProjectBackup(activeProject.id);
    } catch (err: any) {
      alert("Failed to export backup: " + (err.message || "Unknown error"));
    }
  };

  const sceneCount = activeProject?.scenes?.length || 0;
  const bibleCount =
    (activeProject?.video_bible?.characters?.length || 0) +
    (activeProject?.video_bible?.locations?.length || 0);
  const imagesReadyCount =
    activeProject?.scenes?.filter((s) => Boolean(s.image_url)).length || 0;

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

  return (
    <div className="flex flex-col min-h-full">
      {/* Studio Stage Stepper Navigation Bar */}
      <div className="sticky top-0 z-20 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-2 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Stepper Buttons */}
          <nav className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto py-1">
            {[
              {
                id: "script",
                num: "1",
                label: "Script & Audio",
                icon: <FileText size={13} />,
                badge: sceneCount > 0 ? `${sceneCount} sc` : null,
              },
              {
                id: "bible",
                num: "2",
                label: "Video Bible",
                icon: <BookOpen size={13} />,
                badge: bibleCount > 0 ? `${bibleCount}` : null,
              },
              {
                id: "storyboard",
                num: "3",
                label: "Storyboard",
                icon: <Clapperboard size={13} />,
                badge: sceneCount > 0 ? `${imagesReadyCount}/${sceneCount}` : null,
              },
              {
                id: "timeline",
                num: "4",
                label: "Timeline Studio",
                icon: <Sliders size={13} />,
                badge: null,
              },
              {
                id: "export",
                num: "5",
                label: "Export & Deliver",
                icon: <Film size={13} />,
                badge: null,
              },
            ].map((step) => {
              const isActive = activeStage === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStage(step.id as StudioStage)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all select-none cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-subtle)]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {step.num}
                  </span>
                  {step.icon}
                  <span>{step.label}</span>
                  {step.badge && (
                    <span
                      className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                        isActive ? "bg-black/20 text-white" : "bg-[var(--color-card-subtle)] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {step.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Stage Tools */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Download size={13} />}
              onClick={handleExportBackup}
              title="Download project JSON backup"
            >
              Backup
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<UploadCloud size={13} />}
              onClick={() => setViewMode("import")}
            >
              Import Audio
            </Button>
          </div>
        </div>
      </div>

      {/* Workspace Body */}
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
