import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import type { Project, ProjectCreateInput, SceneUpdateInput, Scene } from "../types";

type ProjectUpdate = Project | ((previous: Project) => Project);

export function useProjects(userId?: string | null, authLoading?: boolean) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (authLoading) return;
    try {
      setLoading(true);
      setError(null);
      const list = await api.listProjects();
      setProjects(list);
      if (list.length > 0) {
        setActiveProject((prev) => (prev && list.some((p) => p.id === prev.id) ? list.find((p) => p.id === prev.id)! : list[0]));
      } else {
        setActiveProject(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [authLoading, userId]);

  useEffect(() => {
    if (!authLoading) {
      fetchProjects();
    }
  }, [fetchProjects, authLoading, userId]);

  const createProject = async (input: ProjectCreateInput): Promise<Project> => {
    try {
      setError(null);
      const newProject = await api.createProject(input);
      setProjects((prev) => [newProject, ...prev]);
      setActiveProject(newProject);
      return newProject;
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      throw err;
    }
  };

  const importProject = async (formData: FormData): Promise<Project> => {
    try {
      setError(null);
      const newProject = await api.importProject(formData);
      setProjects((prev) => [newProject, ...prev]);
      setActiveProject(newProject);
      return newProject;
    } catch (err: any) {
      setError(err.message || "Failed to import project");
      throw err;
    }
  };

  const uploadAudio = async (projectId: string, file: File): Promise<Project> => {
    try {
      setError(null);
      const updated = await api.uploadAudio(projectId, file);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      if (activeProject?.id === projectId) {
        setActiveProject(updated);
      }
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to upload audio");
      throw err;
    }
  };

  const updateScene = async (
    projectId: string,
    sceneId: string,
    update: SceneUpdateInput
  ): Promise<Scene> => {
    try {
      setError(null);
      const updatedScene = await api.updateScene(projectId, sceneId, update);
      setActiveProject((prev) => {
        if (!prev || prev.id !== projectId) return prev;
        const newScenes = prev.scenes
          .map((s) => (s.id === sceneId ? updatedScene : s))
          .sort((a, b) => a.start - b.start);
        return { ...prev, scenes: newScenes };
      });
      return updatedScene;
    } catch (err: any) {
      setError(err.message || "Failed to update scene");
      throw err;
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    try {
      setError(null);
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setActiveProject((prev) => (prev?.id === id ? null : prev));
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
      throw err;
    }
  };

  const selectProject = (id: string) => {
    const found = projects.find((p) => p.id === id);
    if (found) {
      setActiveProject(found);
    }
  };

  const applyProjectUpdate = (update: ProjectUpdate) => {
    const activeId = activeProject?.id;
    setActiveProject((prev) => {
      if (!prev || !activeId || prev.id !== activeId) return prev;
      return typeof update === "function" ? update(prev) : update;
    });
    setProjects((projects) => projects.map((project) => {
      if (typeof update !== "function") {
        return project.id === update.id ? update : project;
      }
      return project.id === activeId ? update(project) : project;
    }));
  };

  /**
   * Patch the active project's local state without any API call.
   * Used to reflect sub-resource changes (e.g. video_bible updates) instantly
   * without triggering a full project list refresh.
   */
  const patchActiveProject = (updater: (prev: Project) => Project) => {
    const activeId = activeProject?.id;
    setActiveProject((prev) => prev && prev.id === activeId ? updater(prev) : prev);
    setProjects((projects) => projects.map((project) =>
      project.id === activeId ? updater(project) : project
    ));
  };

  return {
    projects,
    activeProject,
    loading,
    error,
    createProject,
    importProject,
    uploadAudio,
    updateScene,
    deleteProject,
    selectProject,
    applyProjectUpdate,
    patchActiveProject,
    refresh: fetchProjects,
  };
}
