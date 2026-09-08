import React, { useState, useEffect, useRef, useCallback } from "react";
import { Film, MessageSquare, Music, Layout, Sliders, Keyboard, Tag, Plus } from "lucide-react";
import type { Project, Scene, SceneUpdateInput, SceneTemplateType, SceneBackground, SceneElement } from "../../types/project";
import { CinemaPreview } from "./CinemaPreview";
import { TimelineTracks } from "./TimelineTracks";
import { SceneInspector } from "./SceneInspector";
import { ExportModal } from "./ExportModal";
import { CaptionsSettingsPanel } from "./settings/CaptionsSettingsPanel";
import { AudioSettingsPanel } from "./settings/AudioSettingsPanel";
import { CanvasSettingsPanel } from "./settings/CanvasSettingsPanel";
import { SlideTemplateModal } from "./SlideTemplateModal";
import { OverlayElementsInspector } from "./OverlayElementsInspector";
import { ConfirmModal } from "../ConfirmModal";
import { KeyboardShortcutsModal } from "../KeyboardShortcutsModal";
import { api } from "../../services/api";

interface TimelineEditorProps {
  project: Project;
  onProjectUpdated: (updatedProject: Project | ((previous: Project) => Project)) => void;
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
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"scene" | "overlays" | "captions" | "audio" | "canvas">("scene");
  const [deleteTargetSceneId, setDeleteTargetSceneId] = useState<string | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Undo / Redo History Stack with synchronous Ref to eliminate stale closures
  const historyRef = useRef<Scene[][]>([]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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

  // Synchronize selectedSceneId whenever project.scenes updates or loads
  useEffect(() => {
    if (!project.scenes || project.scenes.length === 0) {
      if (selectedSceneId !== null) {
        setSelectedSceneId(null);
      }
      return;
    }
    const exists = project.scenes.some((s) => s.id === selectedSceneId);
    if (!exists) {
      setSelectedSceneId(project.scenes[0].id);
    }
  }, [project.scenes, selectedSceneId]);

  // Initialize history when project scenes first become available
  useEffect(() => {
    if (project.scenes && project.scenes.length > 0 && historyRef.current.length === 0) {
      historyRef.current = [JSON.parse(JSON.stringify(project.scenes))];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [project.scenes]);

  // Push new state snapshot to undo/redo history
  const pushHistorySnapshot = useCallback((newScenes: Scene[]) => {
    if (!newScenes || newScenes.length === 0) return;
    const snapshot = JSON.parse(JSON.stringify(newScenes));
    const current = historyRef.current[historyIndexRef.current];
    if (current && JSON.stringify(current) === JSON.stringify(snapshot)) {
      return;
    }
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(snapshot);
    if (nextHistory.length > 50) {
      nextHistory.shift();
    }
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Undo
  const handleUndo = useCallback(async () => {
    if (historyIndexRef.current > 0) {
      const targetIndex = historyIndexRef.current - 1;
      const targetScenes = historyRef.current[targetIndex];
      historyIndexRef.current = targetIndex;
      setCanUndo(targetIndex > 0);
      setCanRedo(targetIndex < historyRef.current.length - 1);

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
  }, [project.id, onProjectUpdated]);

  // Redo
  const handleRedo = useCallback(async () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const targetIndex = historyIndexRef.current + 1;
      const targetScenes = historyRef.current[targetIndex];
      historyIndexRef.current = targetIndex;
      setCanUndo(targetIndex > 0);
      setCanRedo(targetIndex < historyRef.current.length - 1);

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
  }, [project.id, onProjectUpdated]);

  // Synchronized Ref for keyboard and playback state to prevent 60fps event listener thrashing
  const playbackStateRef = useRef({
    currentTime,
    totalDuration,
    isPlaying,
    selectedSceneId,
    scenes: project.scenes || [],
  });

  useEffect(() => {
    playbackStateRef.current = {
      currentTime,
      totalDuration,
      isPlaying,
      selectedSceneId,
      scenes: project.scenes || [],
    };
  });

  // Playhead update loop with audio clock synchronization
  const updatePlayhead = (timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }
    const delta = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    setCurrentTime((prevTime) => {
      let nextTime = prevTime + delta;
      // Synchronize strictly with audio element when narration is playing to prevent clock drift
      if (
        audioRef.current &&
        !audioRef.current.paused &&
        audioRef.current.readyState >= 2
      ) {
        const audioClock = audioRef.current.currentTime;
        if (Math.abs(audioClock - nextTime) > 0.04) {
          nextTime = audioClock;
        }
      }
      if (nextTime >= playbackStateRef.current.totalDuration) {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        return playbackStateRef.current.totalDuration;
      }
      return nextTime;
    });

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  };

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prevPlaying) => {
      const willPlay = !prevPlaying;
      if (willPlay) {
        let startTime = playbackStateRef.current.currentTime;
        if (startTime >= playbackStateRef.current.totalDuration - 0.05) {
          startTime = 0;
          setCurrentTime(0);
        }
        lastTimestampRef.current = null;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
        if (audioRef.current) {
          audioRef.current.currentTime = startTime;
          audioRef.current.play().catch((err) => {
            console.warn("Autoplay audio handled:", err);
          });
        }
      } else {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
      return willPlay;
    });
  }, []);

  const handleSeek = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(playbackStateRef.current.totalDuration, time));
    setCurrentTime(clamped);
    lastTimestampRef.current = null;
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  }, []);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // --- Scene Operations ---

  const handleUpdateSceneById = async (
    sceneId: string,
    updates: Partial<Scene>,
    ripple: boolean = true
  ) => {
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
        image_fit: updates.image_fit,
        image_position: updates.image_position,
        image_zoom: updates.image_zoom,
        image_crop: updates.image_crop,
        brightness: updates.brightness,
        contrast: updates.contrast,
        saturation: updates.saturation,
        color_filter: updates.color_filter,
        template_type: updates.template_type,
        background: updates.background,
        elements: updates.elements,
      };
      const updatedProject = await api.updateSceneTimeline(
        project.id,
        sceneId,
        cleanUpdate,
        ripple
      );
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
    } catch (err: any) {
      alert(err.message || "Failed to update scene timeline");
    }
  };

  const handleUpdateScene = async (
    updates: Partial<Scene>,
    ripple: boolean = true
  ) => {
    if (!selectedScene) return;
    await handleUpdateSceneById(selectedScene.id, updates, ripple);
  };

  const handleApplySlideTemplate = async (
    templateType: SceneTemplateType,
    background: SceneBackground,
    caption?: string
  ) => {
    if (!selectedScene) return;
    await handleUpdateScene({
      template_type: templateType,
      background,
      caption: caption || selectedScene.caption,
      image_status: "completed",
    });
  };

  const handleAddSlide = async (
    templateType: SceneTemplateType,
    background: SceneBackground,
    captionText: string,
    duration: number = 5.0
  ) => {
    try {
      const prevIds = new Set((project.scenes || []).map((s) => s.id));
      const updatedProject = await api.addSlide(project.id, {
        caption: captionText,
        duration: duration || 5.0,
        template_type: templateType,
        background,
        elements: [],
      });
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
      const newlyCreated = updatedProject.scenes.find((s) => !prevIds.has(s.id));
      if (newlyCreated) {
        setSelectedSceneId(newlyCreated.id);
        handleSeek(newlyCreated.start);
      }
    } catch (err: any) {
      alert("Failed to add slide: " + (err.message || "Unknown error"));
    }
  };

  const handleUpdateElements = async (elements: SceneElement[]) => {
    if (!selectedScene) return;
    await handleUpdateScene({
      elements,
    }, false);
  };

  const handleUpdateSceneElements = async (sceneId: string, elements: SceneElement[]) => {
    await handleUpdateSceneById(sceneId, { elements }, false);
  };

  const handleSplitScene = async (sceneId: string, splitTime: number) => {
    try {
      const prevIds = new Set((project.scenes || []).map((s) => s.id));
      const updatedProject = await api.splitScene(project.id, sceneId, splitTime);
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
      // Automatically select the newly created split scene
      const newlyCreated = updatedProject.scenes.find((s) => !prevIds.has(s.id));
      if (newlyCreated) {
        setSelectedSceneId(newlyCreated.id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to split scene");
    }
  };

  const handleDuplicateScene = async (sceneId: string) => {
    try {
      const prevIds = new Set((project.scenes || []).map((s) => s.id));
      const updatedProject = await api.duplicateScene(project.id, sceneId);
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
      // Automatically select the duplicated scene
      const newlyCreated = updatedProject.scenes.find((s) => !prevIds.has(s.id));
      if (newlyCreated) {
        setSelectedSceneId(newlyCreated.id);
      }
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
    const scenes = project.scenes || [];
    const deleteIdx = scenes.findIndex((s) => s.id === sceneId);
    try {
      const updatedProject = await api.deleteTimelineScene(project.id, sceneId, true);
      pushHistorySnapshot(updatedProject.scenes);
      onProjectUpdated(updatedProject);
      if (updatedProject.scenes.length > 0) {
        const fallbackIdx = Math.min(deleteIdx >= 0 ? deleteIdx : 0, updatedProject.scenes.length - 1);
        setSelectedSceneId(updatedProject.scenes[fallbackIdx].id);
      } else {
        setSelectedSceneId(null);
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
      const movedScene = updatedProject.scenes.find((s) => s.id === sceneId);
      if (movedScene) {
        handleSeek(movedScene.start);
      }
    } catch (err: any) {
      alert(err.message || "Failed to reorder scenes");
    }
  };

  const handleRegenerateImage = async (sceneId: string, promptOverride?: string) => {
    try {
      if (promptOverride !== undefined) {
        await api.updateSceneTimeline(project.id, sceneId, { image_prompt: promptOverride }, false);
      }
      const updatedScene = await api.generateSceneImage(project.id, sceneId, {
        force: true,
        prompt_override: promptOverride,
      });
      onProjectUpdated((previous) => {
        const updatedScenes = (previous.scenes || []).map((scene) =>
          scene.id === sceneId ? updatedScene : scene
        );
        return { ...previous, scenes: updatedScenes };
      });
    } catch (err: any) {
      alert(err.message || "Regeneration failed");
    }
  };

  const handleUploadImage = async (sceneId: string, file: File) => {
    try {
      const updatedScene = await api.uploadReplacementImage(project.id, sceneId, file);
      onProjectUpdated((previous) => {
        const updatedScenes = (previous.scenes || []).map((scene) =>
          scene.id === sceneId ? updatedScene : scene
        );
        return { ...previous, scenes: updatedScenes };
      });
    } catch (err: any) {
      alert(err.message || "Failed to upload image");
    }
  };

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

      const { currentTime: curTime, totalDuration: totDur, selectedSceneId: selId, scenes } = playbackStateRef.current;

      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
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
        handleSeek(Math.max(0, curTime - step));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        handleSeek(Math.min(totDur, curTime + step));
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        // Duplicate selected scene (Ctrl+D / Cmd+D)
        if (selId) {
          e.preventDefault();
          handleDuplicateScene(selId);
        }
      } else if ((e.code === "KeyS" || e.code === "KeyC") && !e.ctrlKey && !e.metaKey) {
        // Split current active scene at playhead (S or C key)
        const activeScene = scenes.find(
          (s) => curTime >= s.start && curTime <= s.end
        );
        if (
          activeScene &&
          curTime > activeScene.start + 0.2 &&
          curTime < activeScene.end - 0.2
        ) {
          e.preventDefault();
          handleSplitScene(activeScene.id, Number(curTime.toFixed(3)));
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selId && scenes.length > 1) {
          e.preventDefault();
          setDeleteTargetSceneId(selId);
        }
      } else if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, handleTogglePlay, handleSeek, handleSplitScene, handleDuplicateScene]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Action & Status Toolbar */}
      <div
        className="glass-panel timeline-toolbar-container"
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
              id="timeline-undo-btn"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              style={{
                padding: "6px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                background: canUndo ? "var(--bg-surface)" : "transparent",
                color: canUndo ? "var(--text-primary)" : "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                cursor: canUndo ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                opacity: canUndo ? 1 : 0.45,
                transition: "all 0.15s ease",
              }}
            >
              ⤺ Undo
            </button>

            <button
              id="timeline-redo-btn"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              style={{
                padding: "6px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                background: canRedo ? "var(--bg-surface)" : "transparent",
                color: canRedo ? "var(--text-primary)" : "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                cursor: canRedo ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                opacity: canRedo ? 1 : 0.45,
                transition: "all 0.15s ease",
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
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Zoom:</span>
            <button
              id="timeline-zoom-out-btn"
              onClick={() => setPixelsPerSecond((prev) => Math.max(30, prev - 15))}
              disabled={pixelsPerSecond <= 30}
              title="Zoom Out (-15px)"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: pixelsPerSecond <= 30 ? "var(--text-muted)" : "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 9px",
                cursor: pixelsPerSecond <= 30 ? "not-allowed" : "pointer",
                fontSize: "0.82rem",
                fontWeight: 700,
              }}
            >
              -
            </button>
            <span
              id="timeline-zoom-readout"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                minWidth: "40px",
                textAlign: "center",
              }}
            >
              {pixelsPerSecond}px
            </span>
            <button
              id="timeline-zoom-in-btn"
              onClick={() => setPixelsPerSecond((prev) => Math.min(150, prev + 15))}
              disabled={pixelsPerSecond >= 150}
              title="Zoom In (+15px)"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: pixelsPerSecond >= 150 ? "var(--text-muted)" : "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 9px",
                cursor: pixelsPerSecond >= 150 ? "not-allowed" : "pointer",
                fontSize: "0.82rem",
                fontWeight: 700,
              }}
            >
              +
            </button>
          </div>

          {/* Add Slide Template Action */}
          <button
            id="timeline-add-slide-btn"
            onClick={() => setIsSlideModalOpen(true)}
            className="btn-secondary"
            title="Add blank or template slide (PowerPoint style)"
            style={{
              padding: "6px 12px",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={14} />
            <span>+ Add Slide</span>
          </button>

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
            id="timeline-export-btn"
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
        className="timeline-workspace-split"
        style={{
          display: "grid",
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
            onUploadImage={handleUploadImage}
            audioRef={audioRef}
            selectedSceneId={selectedScene?.id}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElements={handleUpdateSceneElements}
          />
        </div>

        {/* Right: Tabbed Inspector & Project Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Settings Navigation Tabs */}
          <div
            id="timeline-tabs-nav"
            role="tablist"
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
              { id: "overlays", label: "Overlays", icon: <Tag size={14} /> },
              { id: "captions", label: "Captions", icon: <MessageSquare size={14} /> },
              { id: "audio", label: "Audio", icon: <Music size={14} /> },
              { id: "canvas", label: "Canvas", icon: <Layout size={14} /> },
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  id={`timeline-tab-${t.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`timeline-panel-${t.id}`}
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

          {/* Overlays Tab Content */}
          <div
            id="timeline-panel-overlays"
            role="tabpanel"
            aria-labelledby="timeline-tab-overlays"
            style={{ display: activeTab === "overlays" ? "block" : "none" }}
          >
            {selectedScene ? (
              <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      Slide Overlays & Templates
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                      Scene {selectedScene.id} ({selectedScene.start.toFixed(1)}s - {selectedScene.end.toFixed(1)}s)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSlideModalOpen(true)}
                    className="btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "5px 10px", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <Layout size={13} />
                    <span>Slide Templates</span>
                  </button>
                </div>

                <OverlayElementsInspector
                  scene={selectedScene}
                  onUpdateElements={handleUpdateElements}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                />
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: "30px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Select a scene on the timeline to configure overlay elements.
              </div>
            )}
          </div>

          {/* Tab Content */}
            <div
              id="timeline-panel-scene"
              role="tabpanel"
              aria-labelledby="timeline-tab-scene"
              style={{ display: activeTab === "scene" ? "block" : "none" }}
            >
              {selectedScene ? (
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
              )}
            </div>

            <div
              id="timeline-panel-captions"
              role="tabpanel"
              aria-labelledby="timeline-tab-captions"
              style={{ display: activeTab === "captions" ? "block" : "none" }}
            >
              <CaptionsSettingsPanel
                project={project}
                onProjectUpdated={onProjectUpdated}
              />
            </div>

            <div
              id="timeline-panel-audio"
              role="tabpanel"
              aria-labelledby="timeline-tab-audio"
              style={{ display: activeTab === "audio" ? "block" : "none" }}
            >
              <AudioSettingsPanel
                project={project}
                onProjectUpdated={onProjectUpdated}
              />
            </div>

            <div
              id="timeline-panel-canvas"
              role="tabpanel"
              aria-labelledby="timeline-tab-canvas"
              style={{ display: activeTab === "canvas" ? "block" : "none" }}
            >
              <CanvasSettingsPanel
                project={project}
                onProjectUpdated={onProjectUpdated}
              />
            </div>
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
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 700, margin: 0 }}>
              Interactive Visual Timeline
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              (Click ruler to scrub playhead, click blocks to select & jump)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Quick Undo / Redo */}
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                id="timeline-bottom-undo-btn"
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                style={{
                  padding: "4px 9px",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  background: canUndo ? "var(--bg-surface)" : "transparent",
                  color: canUndo ? "var(--text-primary)" : "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  cursor: canUndo ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  opacity: canUndo ? 1 : 0.4,
                }}
              >
                ⤺ Undo
              </button>
              <button
                id="timeline-bottom-redo-btn"
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                style={{
                  padding: "4px 9px",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  background: canRedo ? "var(--bg-surface)" : "transparent",
                  color: canRedo ? "var(--text-primary)" : "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  cursor: canRedo ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  opacity: canRedo ? 1 : 0.4,
                }}
              >
                ⤻ Redo
              </button>
            </div>

            {/* Quick Zoom */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Zoom:</span>
              <button
                id="timeline-bottom-zoom-out-btn"
                onClick={() => setPixelsPerSecond((prev) => Math.max(30, prev - 15))}
                disabled={pixelsPerSecond <= 30}
                title="Zoom Out"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  color: pixelsPerSecond <= 30 ? "var(--text-muted)" : "var(--text-secondary)",
                  borderRadius: "var(--radius-sm)",
                  padding: "2px 7px",
                  cursor: pixelsPerSecond <= 30 ? "not-allowed" : "pointer",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                }}
              >
                -
              </button>
              <span
                id="timeline-bottom-zoom-readout"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  minWidth: "34px",
                  textAlign: "center",
                }}
              >
                {pixelsPerSecond}px
              </span>
              <button
                id="timeline-bottom-zoom-in-btn"
                onClick={() => setPixelsPerSecond((prev) => Math.min(150, prev + 15))}
                disabled={pixelsPerSecond >= 150}
                title="Zoom In"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  color: pixelsPerSecond >= 150 ? "var(--text-muted)" : "var(--text-secondary)",
                  borderRadius: "var(--radius-sm)",
                  padding: "2px 7px",
                  cursor: pixelsPerSecond >= 150 ? "not-allowed" : "pointer",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                }}
              >
                +
              </button>
            </div>

            <button
              id="timeline-shortcuts-btn"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors font-mono"
              title="View keyboard shortcuts"
            >
              <Keyboard size={13} />
              <span>Shortcuts (?)</span>
            </button>
          </div>
        </div>

        <TimelineTracks
          project={project}
          currentTime={currentTime}
          totalDuration={totalDuration}
          pixelsPerSecond={pixelsPerSecond}
          selectedSceneId={selectedSceneId}
          onSelectScene={(id) => setSelectedSceneId(id)}
          onSeek={handleSeek}
          onUpdateSceneTimes={async (sceneId, newStart, newEnd, ripple) => {
            await handleUpdateSceneById(sceneId, { start: newStart, end: newEnd }, ripple);
          }}
          onUploadImage={handleUploadImage}
          onOpenSlideModal={() => setIsSlideModalOpen(true)}
          onDuplicateScene={handleDuplicateScene}
          onSplitScene={handleSplitScene}
        />
      </div>

      {/* Slide Template Chooser Modal */}
      <SlideTemplateModal
        isOpen={isSlideModalOpen}
        onClose={() => setIsSlideModalOpen(false)}
        activeScene={selectedScene || undefined}
        onApplyToCurrentScene={handleApplySlideTemplate}
        onAddNewSlide={handleAddSlide}
      />

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
