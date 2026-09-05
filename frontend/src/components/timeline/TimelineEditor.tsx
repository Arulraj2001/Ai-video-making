import React, { useState, useEffect, useRef, useCallback } from "react";
import { Film, MessageSquare, Music, Layout, Sliders, Keyboard } from "lucide-react";
import type { Project, Scene, SceneUpdateInput } from "../../types/project";
import { CinemaPreview } from "./CinemaPreview";
import { TimelineTracks } from "./TimelineTracks";
import { SceneInspector } from "./SceneInspector";
import { ExportModal } from "./ExportModal";
import { CaptionsSettingsPanel } from "./settings/CaptionsSettingsPanel";
import { AudioSettingsPanel } from "./settings/AudioSettingsPanel";
import { CanvasSettingsPanel } from "./settings/CanvasSettingsPanel";
import { ConfirmModal } from "../ConfirmModal";
import { KeyboardShortcutsModal } from "../KeyboardShortcutsModal";
import { api } from "../../services/api";

interface TimelineEditorProps {
  project: Project;
  onProjectUpdated: (updatedProject: Project) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  project,
  onProjectUpdated,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    project.scenes && project.scenes.length > 0 ? project.scenes[0].id : null
  );
  const [pixelsPerSecond, setPixelsPerSecond] = useState(60);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"scene" | "captions" | "audio" | "canvas">("scene");
  const [deleteTargetSceneId, setDeleteTargetSceneId] = useState<string | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<Scene[][]>([project.scenes || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const totalDuration =
    project.scenes && project.scenes.length > 0
      ? Math.max(...project.scenes.map((s) => s.end))
      : 10;

  // Selected scene
  const selectedScene =
    (project.scenes || []).find((s) => s.id === selectedSceneId) ||
    project.scenes?.[0] ||
    null;

  // Push new state snapshot to undo/redo history
  const pushHistorySnapshot = useCallback((newScenes: Scene[]) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newScenes];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Undo
  const handleUndo = useCallback(async () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetScenes = history[targetIndex];
      setHistoryIndex(targetIndex);

      try {
        const updated = await api.restoreTimelineScenes(
          project.id,
          targetScenes
        );
        onProjectUpdated(updated);
      } catch (err) {
        console.error("Undo failed:", err);
      }
    }
  }, [historyIndex, history, project.id, onProjectUpdated]);

  // Redo
  const handleRedo = useCallback(async () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetScenes = history[targetIndex];
      setHistoryIndex(targetIndex);

      try {
        const updated = await api.restoreTimelineScenes(
          project.id,
          targetScenes
        );
        onProjectUpdated(updated);
      } catch (err) {
        console.error("Redo failed:", err);
      }
    }
  }, [historyIndex, history, project.id, onProjectUpdated]);

  // Global Keyboard shortcuts: Space (Play/Pause), Ctrl+Z (Undo), Ctrl+Y (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        handleSeek(Math.max(0, currentTime - step));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        handleSeek(Math.min(totalDuration, currentTime + step));
      } else if (e.code === "KeyS" && !e.ctrlKey && !e.metaKey) {
        // Split current active scene at playhead
        const activeScene = (project.scenes || []).find(
          (s) => currentTime >= s.start && currentTime <= s.end
        );
        if (
          activeScene &&
          currentTime > activeScene.start + 0.2 &&
          currentTime < activeScene.end - 0.2
        ) {
          e.preventDefault();
          handleSplitScene(activeScene.id, Number(currentTime.toFixed(3)));
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedSceneId && (project.scenes || []).length > 1) {
          e.preventDefault();
          setDeleteTargetSceneId(selectedSceneId);
        }
      } else if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, currentTime, totalDuration, selectedSceneId, project.scenes]);

  // Playhead update loop
  const updatePlayhead = (timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }
    const delta = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    setCurrentTime((prevTime) => {
      const nextTime = prevTime + delta;
      if (nextTime >= totalDuration) {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        return totalDuration;
      }
      return nextTime;
    });

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        // If at the end, restart from 0
        if (currentTime >= totalDuration) {
          setCurrentTime(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }
        lastTimestampRef.current = null;
        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
        if (audioRef.current) {
          audioRef.current.currentTime = currentTime;
          audioRef.current.play().catch(() => {});
        }
      } else {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
      return next;
    });
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // --- Scene Operations ---

  const handleUpdateScene = async (
    updates: Partial<Scene>,
    ripple: boolean = true
  ) => {
    if (!selectedScene) return;
    try {
      const cleanUpdate: SceneUpdateInput = {
        start: updates.start,
        end: updates.end,
        caption: updates.caption,
        visual_description: updates.visual_description ?? undefined,
        image_prompt: updates.image_prompt ?? undefined,
        suggested_motion: updates.suggested_motion ?? undefined,
        suggested_transition: updates.suggested_transition ?? undefined,
        motion: updates.motion,
        transition: updates.transition,
        transition_duration: updates.transition_duration,
      };
      const updatedProject = await api.updateSceneTimeline(
        project.id,
        selectedScene.id,
        cleanUpdate,
        ripple
      );
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
    } catch (err: any) {
      alert(err.message || "Failed to update scene timeline");
    }
  };

  const handleSplitScene = async (sceneId: string, splitTime: number) => {
    try {
      const updatedProject = await api.splitScene(project.id, sceneId, splitTime);
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
    } catch (err: any) {
      alert(err.message || "Failed to split scene");
    }
  };

  const handleDuplicateScene = async (sceneId: string) => {
    try {
      const updatedProject = await api.duplicateScene(project.id, sceneId);
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
    } catch (err: any) {
      alert(err.message || "Failed to duplicate scene");
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    setDeleteTargetSceneId(sceneId);
  };

  const confirmDeleteScene = async () => {
    if (!deleteTargetSceneId) return;
    const sceneId = deleteTargetSceneId;
    setDeleteTargetSceneId(null);
    try {
      const updatedProject = await api.deleteTimelineScene(project.id, sceneId, true);
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
      if (updatedProject.scenes.length > 0) {
        setSelectedSceneId(updatedProject.scenes[0].id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete scene");
    }
  };

  const handleMoveScene = async (sceneId: string, direction: "earlier" | "later") => {
    const scenes = project.scenes || [];
    const index = scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) return;

    const newIndex = direction === "earlier" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= scenes.length) return;

    const newIds = scenes.map((s) => s.id);
    const temp = newIds[index];
    newIds[index] = newIds[newIndex];
    newIds[newIndex] = temp;

    try {
      const updatedProject = await api.reorderScenes(project.id, newIds);
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
    } catch (err: any) {
      alert(err.message || "Failed to reorder scenes");
    }
  };

  const handleRegenerateImage = async (sceneId: string, promptOverride?: string) => {
    try {
      const updatedScene = await api.generateSceneImage(project.id, sceneId, {
        force: true,
        prompt_override: promptOverride,
      });
      const updatedScenes = (project.scenes || []).map((s) =>
        s.id === sceneId ? updatedScene : s
      );
      pushHistorySnapshot(updatedScenes);
      onProjectUpdated({ ...project, scenes: updatedScenes });
    } catch (err: any) {
      alert(err.message || "Regeneration failed");
    }
  };

  const handleUploadImage = async (sceneId: string, file: File) => {
    try {
      const updatedScene = await api.uploadReplacementImage(project.id, sceneId, file);
      const updatedScenes = (project.scenes || []).map((s) =>
        s.id === sceneId ? updatedScene : s
      );
      pushHistorySnapshot(updatedScenes);
      onProjectUpdated({ ...project, scenes: updatedScenes });
    } catch (err: any) {
      alert(err.message || "Failed to upload image");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Action & Status Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Left: Master Timeline Rule Banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--primary)",
            }}
          >
            <span>⏱</span>
            <span>Master Timeline Rule Enforced (Caption Timestamps Authoritative)</span>
          </div>

          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {project.scenes?.length || 0} scenes • {totalDuration.toFixed(1)}s duration
          </span>
        </div>

        {/* Right: Undo / Redo & Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              style={{
                padding: "6px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                background: historyIndex > 0 ? "var(--bg-surface)" : "transparent",
                color: historyIndex > 0 ? "var(--text-primary)" : "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                cursor: historyIndex > 0 ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ⤺ Undo
            </button>

            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              style={{
                padding: "6px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                background:
                  historyIndex < history.length - 1 ? "var(--bg-surface)" : "transparent",
                color:
                  historyIndex < history.length - 1 ? "var(--text-primary)" : "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                cursor: historyIndex < history.length - 1 ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ⤻ Redo
            </button>
          </div>

          <div
            style={{
              height: "20px",
              width: "1px",
              background: "var(--border-subtle)",
              margin: "0 4px",
            }}
          />

          {/* Zoom Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Zoom:</span>
            <button
              onClick={() => setPixelsPerSecond((prev) => Math.max(30, prev - 15))}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              -
            </button>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                minWidth: "36px",
                textAlign: "center",
              }}
            >
              {pixelsPerSecond}px
            </span>
            <button
              onClick={() => setPixelsPerSecond((prev) => Math.min(140, prev + 15))}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              +
            </button>
          </div>

          <div
            style={{
              height: "20px",
              width: "1px",
              background: "var(--border-subtle)",
              margin: "0 4px",
            }}
          />

          {/* Export Video Action Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="btn-primary"
            title="Render Full HD MP4 Video with FFmpeg"
            style={{
              padding: "6px 14px",
              fontSize: "0.82rem",
            }}
          >
            <Film size={14} />
            <span>Export Video</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split: Cinema Preview (Left/Top) & Scene Inspector (Right/Top) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(360px, 1fr)",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left: In-Browser Cinema Preview Player */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <CinemaPreview
            project={project}
            currentTime={currentTime}
            isPlaying={isPlaying}
            totalDuration={totalDuration}
            onSeek={handleSeek}
            onTogglePlay={handleTogglePlay}
            onSelectScene={(id) => {
              setSelectedSceneId(id);
              setActiveTab("scene");
            }}
            audioRef={audioRef}
          />
        </div>

        {/* Right: Tabbed Inspector & Project Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Settings Navigation Tabs */}
          <div
            style={{
              display: "flex",
              background: "var(--bg-card-subtle)",
              padding: "4px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              gap: "4px",
            }}
          >
            {[
              { id: "scene", label: "Scene", icon: <Sliders size={14} /> },
              { id: "captions", label: "Captions", icon: <MessageSquare size={14} /> },
              { id: "audio", label: "Audio", icon: <Music size={14} /> },
              { id: "canvas", label: "Canvas", icon: <Layout size={14} /> },
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "7px 4px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    borderRadius: "var(--radius-sm)",
                    background: isActive ? "var(--accent-primary)" : "transparent",
                    color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === "scene" && (
            selectedScene ? (
              <SceneInspector
                project={project}
                scene={selectedScene}
                currentTime={currentTime}
                onUpdateScene={handleUpdateScene}
                onSplitScene={handleSplitScene}
                onDuplicateScene={handleDuplicateScene}
                onDeleteScene={handleDeleteScene}
                onMoveScene={handleMoveScene}
                onRegenerateImage={handleRegenerateImage}
                onUploadImage={handleUploadImage}
              />
            ) : (
              <div
                className="glass-panel"
                style={{
                  padding: "32px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                Select a scene block on the timeline to inspect and edit.
              </div>
            )
          )}

          {activeTab === "captions" && (
            <CaptionsSettingsPanel
              project={project}
              onProjectUpdated={onProjectUpdated}
            />
          )}

          {activeTab === "audio" && (
            <AudioSettingsPanel
              project={project}
              onProjectUpdated={onProjectUpdated}
            />
          )}

          {activeTab === "canvas" && (
            <CanvasSettingsPanel
              project={project}
              onProjectUpdated={onProjectUpdated}
            />
          )}
        </div>
      </div>

      {/* Bottom: 3-Track Interactive Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
              Interactive Visual Timeline
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              (Click ruler to scrub playhead, click blocks to select & jump)
            </span>
          </div>

          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors font-mono"
            title="View keyboard shortcuts"
          >
            <Keyboard size={13} />
            <span>Shortcuts (?)</span>
          </button>
        </div>

        <TimelineTracks
          project={project}
          currentTime={currentTime}
          totalDuration={totalDuration}
          pixelsPerSecond={pixelsPerSecond}
          selectedSceneId={selectedSceneId}
          onSelectScene={(id) => setSelectedSceneId(id)}
          onSeek={handleSeek}
        />
      </div>

      {/* Phase 7: Export Video Modal */}
      <ExportModal
        project={project}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Delete Scene Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetSceneId)}
        title="Delete Timeline Scene"
        message="Are you sure you want to delete this scene? Subsequent scenes will ripple back automatically to prevent timeline gaps."
        confirmText="Delete Scene"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDeleteScene}
        onCancel={() => setDeleteTargetSceneId(null)}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
