import React, { createContext, useContext, useState, useEffect } from "react";
import { useProjects } from "../hooks/useProjects";
import { useAuth } from "./AuthContext";
import { useHealth } from "../hooks/useHealth";
import { useTheme } from "../hooks/useTheme";
import type { Project, ProjectCreateInput, SceneUpdateInput, Scene } from "../types";
import type { StudioStage } from "../components/Header";

interface AppContextType {
  // Projects
  projects: Project[];
  activeProject: Project | null;
  projectsLoading: boolean;
  projectsError: string | null;
  createProject: (input: ProjectCreateInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string) => void;
  updateScene: (projectId: string, sceneId: string, update: SceneUpdateInput) => Promise<Scene>;
  applyProjectUpdate: (updater: Project | ((previous: Project) => Project)) => void;
  patchActiveProject: (updater: (prev: Project) => Project) => void;
  refreshProjects: () => Promise<void>;

  // Health
  isHealthy: boolean | null;
  checkingHealth: boolean;
  healthError: string | null;
  refetchHealth: () => void;

  // Theme
  theme: "light" | "dark";
  themePreference: "light" | "dark" | "system";
  setThemePreference: (pref: "light" | "dark" | "system") => void;

  // Studio Stage State
  activeStage: StudioStage;
  setActiveStage: (stage: StudioStage) => void;

  // Modals
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isRestoreModalOpen: boolean;
  setIsRestoreModalOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, preference, setPreference } = useTheme();
  const { isHealthy, checking: checkingHealth, error: healthError, refetch: refetchHealth } = useHealth();
  const { user, loading: authLoading } = useAuth();
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
    refresh: refreshProjects,
  } = useProjects(user?.uid, authLoading);

  const [activeStage, setActiveStageState] = useState<StudioStage>(() => {
    if (typeof window === "undefined") return "script";
    const stage = new URLSearchParams(window.location.search).get("stage");
    return stage === "script" || stage === "bible" || stage === "storyboard" || stage === "timeline" || stage === "export"
      ? stage
      : "script";
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const stage = new URLSearchParams(window.location.search).get("stage");
      if (stage === "script" || stage === "bible" || stage === "storyboard" || stage === "timeline" || stage === "export") {
        setActiveStageState(stage);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setActiveStage = (stage: StudioStage) => {
    setActiveStageState(stage);
    const url = new URL(window.location.href);
    url.searchParams.set("stage", stage);
    window.history.pushState({ stage }, "", url);
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        activeProject,
        projectsLoading,
        projectsError,
        createProject,
        deleteProject,
        selectProject,
        updateScene,
        applyProjectUpdate,
        patchActiveProject,
        refreshProjects,
        isHealthy,
        checkingHealth,
        healthError,
        refetchHealth,
        theme,
        themePreference: preference,
        setThemePreference: setPreference,
        activeStage,
        setActiveStage,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isRestoreModalOpen,
        setIsRestoreModalOpen,
        isShortcutsModalOpen,
        setIsShortcutsModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
