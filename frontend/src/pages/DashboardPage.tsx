import React, { useEffect, useState } from "react";
import { Header, type StudioStage } from "../components/Header";
import { EmptyState } from "../components/EmptyState";
import { Workspace } from "../components/Workspace";
import { ImportProject } from "../components/ImportProject";
import { CreateProjectModal } from "../components/CreateProjectModal";
import { ImportBackupModal } from "../components/ImportBackupModal";
import { KeyboardShortcutsModal } from "../components/KeyboardShortcutsModal";
import { useHealth } from "../hooks/useHealth";
import { useProjects } from "../hooks/useProjects";
import { useTheme } from "../hooks/useTheme";
import { api } from "../services/api";
import { AlertCircle, Film } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isHealthy, checking: checkingHealth, error: healthError, refetch: refetchHealth } = useHealth();
  const {
    projects,
    activeProject,
    loading: projectsLoading,
    error: projectsError,
    createProject,
    updateScene,
    deleteProject,
    selectProject,
    applyProjectUpdate,
    patchActiveProject,
    refresh,
  } = useProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"dashboard" | "import">("dashboard");
  const [importTargetProject, setImportTargetProject] = useState<any | null>(null);
  const [activeStage, setActiveStage] = useState<StudioStage>(() => {
    const stage = new URLSearchParams(window.location.search).get("stage");
    return stage === "script" || stage === "bible" || stage === "storyboard" || stage === "timeline" || stage === "export"
      ? stage
      : "script";
  });

  useEffect(() => {
    const handlePopState = () => {
      const stage = new URLSearchParams(window.location.search).get("stage");
      if (stage === "script" || stage === "bible" || stage === "storyboard" || stage === "timeline" || stage === "export") {
        setActiveStage(stage);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleChangeStage = (stage: StudioStage) => {
    setActiveStage(stage);
    const url = new URL(window.location.href);
    url.searchParams.set("stage", stage);
    window.history.pushState({ stage }, "", url);
  };

  const displayError = projectsError || (isHealthy === false ? healthError : null);

  const handleExportBackup = async () => {
    if (!activeProject) return;
    try {
      await api.exportProjectBackup(activeProject.id);
    } catch (err: any) {
      alert("Failed to export backup: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-app)",
        color: "var(--text-primary)",
      }}
    >
      {/* Studio Header with Pipeline Stepper & Controls */}
      <Header
        activeProject={activeProject}
        projects={projects}
        onSelectProject={selectProject}
        isHealthy={isHealthy}
        checkingHealth={checkingHealth}
        onNewProject={() => setIsModalOpen(true)}
        onOpenImport={() => {
          setImportTargetProject(null);
          setViewMode("import");
        }}
        onRefreshHealth={refetchHealth}
        activeStage={activeStage}
        onChangeStage={handleChangeStage}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenRestore={() => setIsRestoreOpen(true)}
        onExportProject={handleExportBackup}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Studio Workspace Container */}
      <main className="studio-container flex-1">
        {/* Error notification banner */}
        {displayError && (
          <div
            className="mb-6 p-4 rounded-xl flex items-start gap-3 text-xs"
            style={{
              background: "var(--accent-danger-subtle)",
              border: "1px solid var(--accent-danger)",
              color: "var(--accent-danger-text)",
            }}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Notice: </strong>
              <span>{displayError}</span>
            </div>
          </div>
        )}

        {/* View Routing */}
        {viewMode === "import" ? (
          <ImportProject
            targetProject={importTargetProject}
            onSuccess={() => {
              setViewMode("dashboard");
              setImportTargetProject(null);
              refresh();
            }}
            onCancel={() => {
              setViewMode("dashboard");
              setImportTargetProject(null);
            }}
          />
        ) : projectsLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
              style={{
                background: "var(--accent-primary-subtle)",
                color: "var(--accent-primary)",
              }}
            >
              <Film size={24} />
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading workspace projects...</p>
          </div>
        ) : projects.length === 0 || !activeProject ? (
          /* Empty project state */
          <EmptyState
            onOpenImport={() => {
              setImportTargetProject(null);
              setViewMode("import");
            }}
            onCreateProject={() => setIsModalOpen(true)}
            onOpenRestore={() => setIsRestoreOpen(true)}
          />
        ) : (
          /* Main Guided 5-Stage Studio Workspace */
          <Workspace
            project={activeProject}
            activeStage={activeStage}
            onChangeStage={handleChangeStage}
            onDeleteProject={deleteProject}
            onOpenImport={() => {
              setImportTargetProject(activeProject);
              setViewMode("import");
            }}
            onUpdateScene={async (sceneId, update) => {
              await updateScene(activeProject.id, sceneId, update);
            }}
            onBibleUpdated={(bible) => {
              // Merge bible update locally — avoids full project list refetch
              // which would cause a re-render loop via onBibleUpdated → refresh → remount
              patchActiveProject((prev) => ({ ...prev, video_bible: bible }));
            }}
            onProjectUpdated={applyProjectUpdate}
          />
        )}
      </main>

      {/* Create Blank Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (input) => {
          await createProject(input);
        }}
      />

      {/* Restore Project Backup (JSON) Modal */}
      <ImportBackupModal
        isOpen={isRestoreOpen}
        onClose={() => setIsRestoreOpen(false)}
        onSuccess={(imported) => {
          refresh();
          selectProject(imported.id);
        }}
      />

      {/* Keyboard Shortcuts Cheat Sheet */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
