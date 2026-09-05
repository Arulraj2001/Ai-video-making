import React, { useState } from "react";
import {
  Folder,
  Trash2,
  UploadCloud,
  Film,
  Palette,
  ArrowRight,
  ArrowLeft,
  HardDrive,
  Check
} from "lucide-react";
import { SceneTable } from "./SceneTable";
import { TimelineEditor } from "./timeline/TimelineEditor";
import { VideoBibleEditor } from "./video-bible/VideoBibleEditor";
import { StoryboardView } from "./storyboard/StoryboardView";
import { ExportModal } from "./timeline/ExportModal";
import { ConfirmModal } from "./ConfirmModal";
import { formatDate } from "../utils/formatters";
import { api } from "../services/api";
import type { Project, VideoBible } from "../types";
import type { StudioStage } from "./Header";

interface WorkspaceProps {
  project: Project;
  activeStage: StudioStage;
  onChangeStage: (stage: StudioStage) => void;
  onDeleteProject: (id: string) => void;
  onOpenImport: () => void;
  onUpdateScene: (sceneId: string, update: { start?: number; end?: number; caption?: string }) => Promise<any>;
  onBibleUpdated?: (bible: VideoBible) => void;
  onProjectUpdated?: (project: Project | ((previous: Project) => Project)) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  project,
  activeStage,
  onChangeStage,
  onDeleteProject,
  onOpenImport,
  onUpdateScene,
  onBibleUpdated,
  onProjectUpdated,
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [cleaningTemp, setCleaningTemp] = useState(false);
  const [cleanTempSuccess, setCleanTempSuccess] = useState(false);

  const scenes = project.scenes || [];
  const hasScenes = scenes.length > 0;
  const characterCount = project.video_bible?.characters?.length || 0;
  const locationCount = project.video_bible?.locations?.length || 0;
  const bibleCount = characterCount + locationCount;
  const storyboardCount = scenes.filter((s) => Boolean(s.image_prompt)).length;
  const imagesReadyCount = scenes.filter((s) => Boolean(s.image_url)).length;
  const totalDuration = hasScenes ? scenes[scenes.length - 1].end : 0;

  const handleCleanTemp = async () => {
    setCleaningTemp(true);
    try {
      await api.cleanProjectTemp(project.id);
      setCleanTempSuccess(true);
      setTimeout(() => setCleanTempSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to clean temp files: " + (err.message || "Unknown error"));
    } finally {
      setCleaningTemp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Project Header Ribbon */}
      <div
        className="studio-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{
          borderLeft: "4px solid var(--accent-primary)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "var(--radius-md)",
              background: "var(--accent-primary-subtle)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Folder size={22} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
                {project.name}
              </h1>

              <span className="badge badge-info text-[10px]">Active Project</span>

              {hasScenes && (
                <span className="badge badge-neutral text-[10px] font-mono">
                  {scenes.length} Scenes • {totalDuration.toFixed(1)}s
                </span>
              )}

              {project.video_bible?.overall_style?.visual_style && (
                <span className="badge badge-warning text-[10px]">
                  <Palette size={10} />
                  {project.video_bible.overall_style.visual_style}
                </span>
              )}

              {storyboardCount > 0 && (
                <span className="badge badge-info text-[10px] font-mono">
                  {storyboardCount}/{scenes.length} Prompts Ready
                </span>
              )}

              {imagesReadyCount > 0 && (
                <span className="badge badge-success text-[10px] font-mono">
                  {imagesReadyCount}/{scenes.length} Images Ready
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <span>ID: <code className="font-mono">{project.id}</code></span>
              <span>•</span>
              <span>Created {formatDate(project.created_at)}</span>
              {project.description && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-sm">{project.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Ribbon Quick Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {hasScenes && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="btn-primary text-xs py-1.5 px-3"
              title="Render Video (Full HD MP4)"
            >
              <Film size={14} />
              <span>Export Video</span>
            </button>
          )}

          <button
            onClick={handleCleanTemp}
            disabled={cleaningTemp}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Clean orphaned render scratch files"
          >
            {cleanTempSuccess ? (
              <>
                <Check size={14} style={{ color: "var(--accent-success)" }} />
                <span>Cleaned</span>
              </>
            ) : (
              <>
                <HardDrive size={14} />
                <span>{cleaningTemp ? "Cleaning..." : "Clean Temp"}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsDeleteProjectModalOpen(true)}
            className="btn-ghost text-xs py-1.5 px-2.5"
            style={{ color: "var(--accent-danger-text)" }}
            title="Delete Project"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Mobile / Compact Stepper (visible on smaller screens) */}
      <div className="flex md:hidden pipeline-stepper-container overflow-x-auto pb-1">
        <button
          onClick={() => onChangeStage("script")}
          className={`pipeline-step-btn ${activeStage === "script" ? "active" : ""}`}
        >
          <span className="pipeline-step-num">1</span>
          <span>Script</span>
        </button>
        <button
          onClick={() => onChangeStage("bible")}
          className={`pipeline-step-btn ${activeStage === "bible" ? "active" : ""}`}
        >
          <span className="pipeline-step-num">2</span>
          <span>Bible</span>
        </button>
        <button
          onClick={() => onChangeStage("storyboard")}
          className={`pipeline-step-btn ${activeStage === "storyboard" ? "active" : ""}`}
        >
          <span className="pipeline-step-num">3</span>
          <span>Storyboard</span>
        </button>
        <button
          onClick={() => onChangeStage("timeline")}
          className={`pipeline-step-btn ${activeStage === "timeline" ? "active" : ""}`}
        >
          <span className="pipeline-step-num">4</span>
          <span>Timeline</span>
        </button>
        <button
          onClick={() => onChangeStage("export")}
          className={`pipeline-step-btn ${activeStage === "export" ? "active" : ""}`}
        >
          <span className="pipeline-step-num">5</span>
          <span>Export</span>
        </button>
      </div>

      {/* =========================================================================
          STAGE 1: AUDIO & SCRIPT
          ========================================================================= */}
      {activeStage === "script" && (
        <div className="space-y-6">
          {hasScenes ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-display" style={{ color: "var(--text-primary)" }}>
                    Stage 1: Narration & Captions Table
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Verify timing, start/end timestamps, and narration text parsed from Clipchamp captions.
                  </p>
                </div>

                <button
                  onClick={onOpenImport}
                  className="btn-secondary text-xs py-1.5 px-3"
                  title="Re-import or replace audio and captions"
                >
                  <UploadCloud size={13} />
                  <span>Re-import Captions</span>
                </button>
              </div>

              <SceneTable
                scenes={project.scenes}
                audioFile={project.audio_file}
                onUpdateScene={onUpdateScene}
              />

              {/* Stage 1 Guided Navigation Bar */}
              <div className="bottom-nav-bar">
                <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  <span className="badge badge-success mr-2 text-[10px]">✓ {scenes.length} Scenes Loaded</span>
                  Ready to configure visual consistency for characters and scenes.
                </div>

                <button
                  onClick={() => onChangeStage("bible")}
                  className="btn-primary text-xs py-2 px-4"
                >
                  <span>Proceed to Stage 2: Video Bible</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="studio-card p-10 text-center max-w-xl mx-auto my-8">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "var(--radius-xl)",
                  background: "var(--accent-primary-subtle)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <UploadCloud size={28} />
              </div>
              <h3 className="text-lg font-bold font-display mb-1" style={{ color: "var(--text-primary)" }}>
                No Audio or Captions Ingested Yet
              </h3>
              <p className="text-xs mb-6 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
                Import your voiceover narration file (MP3/WAV) and paste Clipchamp timestamped captions to generate the Master Timeline.
              </p>
              <button onClick={onOpenImport} className="btn-primary text-xs py-2 px-5 mx-auto">
                <UploadCloud size={15} />
                <span>Import Audio & Captions Now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          STAGE 2: VIDEO BIBLE CONSISTENCY ENGINE
          ========================================================================= */}
      {activeStage === "bible" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-display" style={{ color: "var(--text-primary)" }}>
                Stage 2: Video Bible Consistency Engine
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Configure characters, locations, key objects, and artistic style to maintain visual continuity across all AI images.
              </p>
            </div>
          </div>

          <VideoBibleEditor
            projectId={project.id}
            initialBible={project.video_bible}
            onBibleUpdated={(updatedBible) => {
              if (onBibleUpdated) onBibleUpdated(updatedBible);
            }}
          />

          {/* Stage 2 Guided Navigation Bar */}
          <div className="bottom-nav-bar">
            <button
              onClick={() => onChangeStage("script")}
              className="btn-secondary text-xs py-2 px-3"
            >
              <ArrowLeft size={14} />
              <span>← Back to Audio & Script</span>
            </button>

            <div className="hidden sm:block text-xs" style={{ color: "var(--text-muted)" }}>
              {bibleCount > 0 ? (
                <span className="badge badge-success text-[10px]">
                  ✓ {bibleCount} Bible Assets Active
                </span>
              ) : (
                <span>Add characters or style to inject visual descriptors into storyboard prompts.</span>
              )}
            </div>

            <button
              onClick={() => onChangeStage("storyboard")}
              className="btn-primary text-xs py-2 px-4"
            >
              <span>Proceed to Stage 3: Storyboard</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 3: VISUAL STORYBOARD & AI GENERATION
          ========================================================================= */}
      {activeStage === "storyboard" && (
        <div className="space-y-6">
          <StoryboardView
            project={project}
            onProjectUpdated={(updated) => {
              if (onProjectUpdated) onProjectUpdated(updated);
            }}
            onSwitchToBible={() => onChangeStage("bible")}
          />

          {/* Stage 3 Guided Navigation Bar */}
          <div className="bottom-nav-bar">
            <button
              onClick={() => onChangeStage("bible")}
              className="btn-secondary text-xs py-2 px-3"
            >
              <ArrowLeft size={14} />
              <span>← Back to Video Bible</span>
            </button>

            <div className="hidden sm:block text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {imagesReadyCount === scenes.length && scenes.length > 0 ? (
                <span className="badge badge-success text-[10px]">
                  ✓ All {scenes.length} Scene Images Ready
                </span>
              ) : (
                <span>Images Ready: {imagesReadyCount} of {scenes.length}</span>
              )}
            </div>

            <button
              onClick={() => onChangeStage("timeline")}
              className="btn-primary text-xs py-2 px-4"
            >
              <span>Proceed to Stage 4: Timeline Studio</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 4: TIMELINE STUDIO & MASTERING
          ========================================================================= */}
      {activeStage === "timeline" && (
        <div className="space-y-6">
          {hasScenes ? (
            <div className="space-y-6">
              <TimelineEditor
                project={project}
                onProjectUpdated={(updated) => {
                  if (onProjectUpdated) onProjectUpdated(updated);
                }}
              />

              {/* Stage 4 Guided Navigation Bar */}
              <div className="bottom-nav-bar">
                <button
                  onClick={() => onChangeStage("storyboard")}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  <ArrowLeft size={14} />
                  <span>← Back to Storyboard</span>
                </button>

                <div className="hidden sm:block text-xs" style={{ color: "var(--text-muted)" }}>
                  Pacing, BGM mixing, and subtitles mastered. Ready for Full HD video render.
                </div>

                <button
                  onClick={() => onChangeStage("export")}
                  className="btn-primary text-xs py-2 px-4"
                >
                  <span>Proceed to Stage 5: Export & Deliver</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="studio-card p-10 text-center max-w-xl mx-auto my-8">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                No scenes available to edit on timeline. Please import captions in Stage 1 first.
              </p>
              <button onClick={() => onChangeStage("script")} className="btn-primary text-xs py-2 px-4 mt-4 mx-auto">
                Go to Stage 1: Audio & Script
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          STAGE 5: EXPORT & DELIVERY HUB
          ========================================================================= */}
      {activeStage === "export" && (
        <div className="space-y-6">
          <div className="studio-card p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-lg)",
                  background: "var(--accent-primary-subtle)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Film size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
                  Stage 5: Export & Delivery Studio
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Render your completed project into an ultra-crisp Full HD MP4 video with FFmpeg.
                </p>
              </div>
            </div>

            {/* Project readiness checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="p-3 rounded-lg border" style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}>
                <span className="text-[11px] font-semibold block uppercase" style={{ color: "var(--text-muted)" }}>Timeline</span>
                <span className="text-xs font-bold" style={{ color: hasScenes ? "var(--accent-success-text)" : "var(--accent-danger-text)" }}>
                  {hasScenes ? `✓ ${scenes.length} Scenes (${totalDuration.toFixed(1)}s)` : "✗ No scenes"}
                </span>
              </div>

              <div className="p-3 rounded-lg border" style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}>
                <span className="text-[11px] font-semibold block uppercase" style={{ color: "var(--text-muted)" }}>Visual Frames</span>
                <span className="text-xs font-bold" style={{ color: imagesReadyCount > 0 ? "var(--accent-success-text)" : "var(--accent-warning-text)" }}>
                  {imagesReadyCount}/{scenes.length} Images Ready
                </span>
              </div>

              <div className="p-3 rounded-lg border" style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}>
                <span className="text-[11px] font-semibold block uppercase" style={{ color: "var(--text-muted)" }}>Audio Mix</span>
                <span className="text-xs font-bold" style={{ color: project.audio_file ? "var(--accent-success-text)" : "var(--text-muted)" }}>
                  {project.audio_file ? "✓ Narration Active" : "No Audio"}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-xl border text-center mb-6" style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}>
              <h3 className="text-base font-bold font-display mb-2" style={{ color: "var(--text-primary)" }}>
                Ready to Render Full HD MP4
              </h3>
              <p className="text-xs mb-5 max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
                Select from 16:9 Landscape (YouTube) or 9:16 Portrait (Shorts / TikTok) presets, configure audio ducking balance, and render with real-time progress.
              </p>

              <button
                onClick={() => setIsExportModalOpen(true)}
                disabled={!hasScenes}
                className="btn-primary text-sm py-2.5 px-6 mx-auto shadow-md"
              >
                <Film size={16} />
                <span>Configure & Start Video Render</span>
              </button>
            </div>
          </div>

          {/* Stage 5 Guided Navigation Bar */}
          <div className="bottom-nav-bar max-w-3xl mx-auto">
            <button
              onClick={() => onChangeStage("timeline")}
              className="btn-secondary text-xs py-2 px-3"
            >
              <ArrowLeft size={14} />
              <span>← Back to Timeline Studio</span>
            </button>

            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              End of Production Pipeline
            </span>

            <button
              onClick={() => onChangeStage("script")}
              className="btn-ghost text-xs py-2 px-3"
            >
              <span>Return to Stage 1 (Script) ↺</span>
            </button>
          </div>
        </div>
      )}

      {/* Video Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
      />

      {/* Delete Project Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteProjectModalOpen}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${project.name}"? All scenes, audio narration, and generated images will be permanently removed from disk.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setIsDeleteProjectModalOpen(false);
          onDeleteProject(project.id);
        }}
        onCancel={() => setIsDeleteProjectModalOpen(false)}
      />
    </div>
  );
};
