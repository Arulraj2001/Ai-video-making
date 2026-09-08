import React, { useState, useEffect, useRef } from "react";
import {
  Film,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Smartphone,
  Monitor,
  Square,
  RefreshCw,
  X,
  Play,
  Trash2,
  Loader2,
  Zap,
} from "lucide-react";

import type { Project } from "../../types/project";
import type { RenderJob } from "../../types/render";
import { api } from "../../services/api";

const DOWNLOAD_FORMATS = [
  { id: "mp4", label: "MP4 (1080p)", desc: "Original Full HD Video", ext: "mp4" },
  { id: "720p", label: "720p (HD)", desc: "Compressed HD for Fast Sharing", ext: "mp4" },
  { id: "mp3", label: "MP3 (Audio)", desc: "Extracted Audio-Only Mix", ext: "mp3" },
  { id: "webm", label: "WebM (VP9)", desc: "Web High-Efficiency Video", ext: "webm" },
  { id: "gif", label: "GIF (Loop)", desc: "6s Animated Loop Preview", ext: "gif" },
];

interface ExportModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

type ResolutionOption = "1080x1920" | "1920x1080" | "1080x1080";

const RESOLUTION_CONFIGS: {
  id: ResolutionOption;
  label: string;
  ratio: string;
  desc: string;
  icon: React.ReactNode;
  defaultBadge?: boolean;
}[] = [
  {
    id: "1080x1920",
    label: "Vertical",
    ratio: "9:16",
    desc: "1080x1920 • TikTok, Shorts, Reels",
    icon: <Smartphone size={20} />,
    defaultBadge: true,
  },
  {
    id: "1920x1080",
    label: "Landscape",
    ratio: "16:9",
    desc: "1920x1080 • YouTube, Full HD Cinema",
    icon: <Monitor size={20} />,
  },
  {
    id: "1080x1080",
    label: "Square",
    ratio: "1:1",
    desc: "1080x1080 • Instagram, Feed Posts",
    icon: <Square size={20} />,
  },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [selectedResolution, setSelectedResolution] =
    useState<ResolutionOption>("1080x1920");
  const [kenBurnsEnabled, setKenBurnsEnabled] = useState(false);
  const [activeJob, setActiveJob] = useState<RenderJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentJobs, setRecentJobs] = useState<RenderJob[]>([]);
  const [activePreviewJobId, setActivePreviewJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [activePreviewJobUrl, setActivePreviewJobUrl] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    if (activeJob?.status === "completed") {
      api.getAuthenticatedRenderDownloadUrl(project.id, activeJob.id, "mp4", "inline").then((url) => {
        if (isMounted) setPreviewVideoUrl(url);
      });
    } else {
      setPreviewVideoUrl(null);
    }
    return () => {
      isMounted = false;
    };
  }, [activeJob?.id, activeJob?.status, project.id]);

  useEffect(() => {
    let isMounted = true;
    if (activePreviewJobId) {
      api.getAuthenticatedRenderDownloadUrl(project.id, activePreviewJobId, "mp4", "inline").then((url) => {
        if (isMounted) setActivePreviewJobUrl(url);
      });
    } else {
      setActivePreviewJobUrl(null);
    }
    return () => {
      isMounted = false;
    };
  }, [activePreviewJobId, project.id]);

  const handleDownloadFormat = async (jobId: string, formatId: string, outputFilename?: string | null) => {
    const key = `${jobId}-${formatId}`;
    setDownloadingFormat(key);
    try {
      const ext = formatId === "mp3" ? "mp3" : formatId === "webm" ? "webm" : formatId === "gif" ? "gif" : "mp4";
      const cleanBase = (outputFilename || "video").replace(/\.[^/.]+$/, "");
      const filename = `${cleanBase}_${formatId}.${ext}`;
      await api.downloadRenderFile(project.id, jobId, formatId, filename);
    } catch (err: any) {
      alert(err.message || "Failed to download render file.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  const totalDuration =
    project.scenes && project.scenes.length > 0
      ? Math.max(...project.scenes.map((s) => s.end))
      : 0;

  // Load existing renders for this project
  const fetchRecentJobs = async () => {
    try {
      const res = await api.listRenderJobs(project.id);
      setRecentJobs(res.jobs || []);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (project.canvas_settings?.resolution) {
        setSelectedResolution(project.canvas_settings.resolution as ResolutionOption);
      }
      fetchRecentJobs();
      setErrorMsg(null);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, project.id, project.canvas_settings?.resolution]);

  // Polling loop for active job
  useEffect(() => {
    if (!activeJob || activeJob.status === "completed" || activeJob.status === "failed") {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const updated = await api.getRenderStatus(project.id, activeJob.id);
        setActiveJob(updated);
        consecutiveErrorsRef.current = 0;
        if (updated.status === "completed" || updated.status === "failed") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          fetchRecentJobs();
        }
      } catch (err: any) {
        console.warn("Polling error:", err);
        const isNotFound =
          err?.status === 404 ||
          err?.statusCode === 404 ||
          (typeof err?.message === "string" && (
            err.message.toLowerCase().includes("not found") ||
            err.message.includes("404")
          ));

        if (isNotFound) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setActiveJob(null);
          setErrorMsg("The render job was not found on the server (it may have expired or cleared during a server restart). You can start a new render now.");
          fetchRecentJobs();
          return;
        }

        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 4) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setErrorMsg("Connection lost while checking render status. Please check your connection or refresh the page.");
        }
      }
    }, 1200);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [activeJob?.id, activeJob?.status, project.id]);

  const handleStartRender = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    consecutiveErrorsRef.current = 0;
    try {
      const job = await api.startRender(project.id, {
        resolution: selectedResolution,
        motion_preset: kenBurnsEnabled ? "ken_burns" : "none",
      });
      setActiveJob(job);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start render job.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryRender = async (jobId?: string) => {
    const targetJobId = jobId || activeJob?.id;
    if (!targetJobId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    consecutiveErrorsRef.current = 0;
    try {
      const job = await api.retryRender(project.id, targetJobId);
      setActiveJob(job);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to retry render.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewRender = () => {
    setActiveJob(null);
    setErrorMsg(null);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this export?")) return;
    setDeletingJobId(jobId);
    try {
      await api.deleteRenderJob(project.id, jobId);
      if (activeJob?.id === jobId) {
        setActiveJob(null);
      }
      if (activePreviewJobId === jobId) {
        setActivePreviewJobId(null);
      }
      await fetchRecentJobs();
    } catch (err: any) {
      alert(err.message || "Failed to delete export");
    } finally {
      setDeletingJobId(null);
    }
  };

  if (!isOpen) return null;

  const downloadUrl = activeJob?.output_url
    ? api.getRenderDownloadUrl(project.id, activeJob.id)
    : null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(3, 7, 18, 0.82)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && (!activeJob || activeJob.status !== "processing")) {
          onClose();
        }
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "20px",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          color: "var(--text-primary)",
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 8px 16px -4px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Film size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                Export Video
              </h2>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Render Full HD MP4 with H.264, 30 FPS, and synchronized AAC audio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={activeJob?.status === "processing"}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: activeJob?.status === "processing" ? "not-allowed" : "pointer",
              color: "var(--text-muted)",
              transition: "all 0.2s ease",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* --- STATE 1: SELECTION & CONFIGURATION --- */}
        {!activeJob && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Resolution Selector Cards */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "10px" }}>
                SELECT OUTPUT FORMAT
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                {RESOLUTION_CONFIGS.map((opt) => {
                  const isSelected = selectedResolution === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedResolution(opt.id)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: isSelected
                          ? "2px solid var(--accent-primary)"
                          : "1px solid var(--border-subtle)",
                        background: isSelected
                          ? "var(--accent-primary-subtle)"
                          : "var(--bg-card-subtle)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "8px",
                        textAlign: "left",
                        position: "relative",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {(project.canvas_settings?.resolution === opt.id || (!project.canvas_settings?.resolution && opt.defaultBadge)) && (
                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: "var(--accent-primary-subtle)",
                            color: "var(--accent-primary)",
                            border: "1px solid var(--accent-primary)",
                          }}
                        >
                          {project.canvas_settings?.resolution === opt.id ? "Canvas Choice" : "Default"}
                        </span>
                      )}

                      <div
                        style={{
                          color: isSelected ? "var(--accent-primary)" : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {opt.icon}
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {opt.label}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                        {opt.desc}
                      </div>

                      <div
                        style={{
                          fontSize: "0.74rem",
                          fontFamily: "monospace",
                          color: isSelected ? "var(--accent-primary)" : "var(--text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        Ratio: {opt.ratio}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scene Motion Toggle — Ken Burns */}
            <div
              style={{
                background: kenBurnsEnabled
                  ? "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)"
                  : "var(--bg-card-subtle)",
                border: kenBurnsEnabled
                  ? "1px solid rgba(99,102,241,0.45)"
                  : "1px solid var(--border-subtle)",
                borderRadius: "14px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                transition: "all 0.25s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: kenBurnsEnabled
                      ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                      : "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: kenBurnsEnabled ? "#fff" : "var(--text-muted)",
                    transition: "all 0.25s ease",
                    boxShadow: kenBurnsEnabled ? "0 4px 12px -2px rgba(99,102,241,0.5)" : "none",
                  }}
                >
                  <Zap size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Scene Motion
                    {kenBurnsEnabled && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: "rgba(99,102,241,0.2)",
                          color: "#a5b4fc",
                          border: "1px solid rgba(99,102,241,0.4)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        KEN BURNS
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.77rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Subtle zoom &amp; pan on each scene for a cinematic feel
                  </div>
                </div>
              </div>

              {/* Toggle pill */}
              <button
                id="ken-burns-toggle"
                type="button"
                onClick={() => setKenBurnsEnabled((v) => !v)}
                aria-pressed={kenBurnsEnabled}
                aria-label="Toggle Ken Burns scene motion"
                style={{
                  flexShrink: 0,
                  width: "52px",
                  height: "28px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: "pointer",
                  background: kenBurnsEnabled
                    ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                    : "rgba(255,255,255,0.1)",
                  position: "relative",
                  transition: "background 0.25s ease",
                  boxShadow: kenBurnsEnabled ? "0 0 12px rgba(99,102,241,0.45)" : "none",
                  padding: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: kenBurnsEnabled ? "27px" : "3px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s ease",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                />
              </button>
            </div>

            {/* Video & Audio Specifications Summary */}
            <div
              style={{
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "14px",
                padding: "16px 20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "14px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  VIDEO CODEC
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  H.264 (libx264)
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  TIMELINE
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {project.scenes?.length || 0} scenes ({totalDuration.toFixed(1)}s)
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  FRAMERATE
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {project.canvas_settings?.fps || 30} FPS
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  AUDIO TRACKS
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {project.audio_file ? "Voice" : "No Voice"}
                  {project.audio_settings?.music_file ? " + BGM" : ""}
                  {project.audio_settings?.ducking_enabled !== false && project.audio_file && project.audio_settings?.music_file ? " (Ducked)" : ""}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  SUBTITLES
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: project.caption_settings?.enabled !== false ? "#10b981" : "var(--text-muted)" }}>
                  {project.caption_settings?.enabled !== false ? `Burned (${project.caption_settings?.font_family || "Inter"})` : "Disabled"}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  color: "#f87171",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: "10px 20px", fontSize: "0.88rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartRender}
                disabled={isSubmitting || !project.scenes || project.scenes.length === 0}
                className="btn-primary"
                style={{
                  padding: "10px 24px",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Render Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* --- STATE 2: ACTIVE JOB PROGRESS --- */}
        {activeJob && activeJob.status !== "completed" && activeJob.status !== "failed" && (
          <div
            style={{
              padding: "24px",
              background: "var(--bg-card-subtle)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#818cf8",
                  }}
                >
                  Rendering in progress
                </span>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    margin: "4px 0 0 0",
                    color: "#fff",
                  }}
                >
                  {activeJob.stage || "Preparing..."}
                </h3>
              </div>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  color: "#818cf8",
                }}
              >
                {activeJob.progress}%
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                height: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: "5px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(5, activeJob.progress)}%`,
                  background: "linear-gradient(90deg, #6366f1 0%, #ec4899 100%)",
                  borderRadius: "5px",
                  transition: "width 0.4s ease",
                  boxShadow: "0 0 12px rgba(99, 102, 241, 0.6)",
                }}
              />
            </div>

            {/* Stage Checklist */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "10px",
                fontSize: "0.8rem",
              }}
            >
              {[
                { name: "Preparing...", min: 0 },
                { name: "Generating timeline...", min: 15 },
                { name: "Rendering...", min: 55 },
                { name: "Finalizing...", min: 85 },
              ].map((stg) => {
                const isCurrent = activeJob.stage === stg.name;
                const isPassed = activeJob.progress > stg.min;
                return (
                  <div
                    key={stg.name}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: isCurrent
                        ? "rgba(99, 102, 241, 0.15)"
                        : "rgba(255, 255, 255, 0.02)",
                      border: isCurrent
                        ? "1px solid rgba(99, 102, 241, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: isCurrent
                        ? "#a5b4fc"
                        : isPassed
                        ? "var(--text-secondary)"
                        : "var(--text-muted)",
                      fontWeight: isCurrent ? 700 : 500,
                    }}
                  >
                    {isCurrent ? (
                      <RefreshCw size={12} className="animate-spin text-indigo-400" />
                    ) : isPassed ? (
                      <CheckCircle2 size={12} className="text-emerald-400" />
                    ) : (
                      <Clock size={12} />
                    )}
                    <span>{stg.name}</span>
                  </div>
                );
              })}
            </div>

            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Running asynchronously on the backend. This render will continue safely even if you navigate away.
            </p>
          </div>
        )}

        {/* --- STATE 3: COMPLETED WITH DOWNLOAD & PREVIEW --- */}
        {activeJob && activeJob.status === "completed" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {/* Success Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "16px",
                padding: "18px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34d399",
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#fff" }}>
                    Render Complete!
                  </h3>
                  <span style={{ fontSize: "0.82rem", color: "#a7f3d0" }}>
                    {activeJob.resolution} • {activeJob.duration?.toFixed(1)}s •{" "}
                    {activeJob.file_size ? `${(activeJob.file_size / (1024 * 1024)).toFixed(1)} MB` : ""}
                  </span>
                </div>
              </div>

              {/* Multi-Format Downloads Bar */}
              {downloadUrl && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
                    {DOWNLOAD_FORMATS.map((fmt) => {
                      const isDownloading = downloadingFormat === `${activeJob.id}-${fmt.id}`;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => handleDownloadFormat(activeJob.id, fmt.id, activeJob.output_filename)}
                          disabled={isDownloading}
                          title={fmt.desc}
                          className={fmt.id === "mp4" ? "btn-primary" : "btn-secondary"}
                          style={{
                            padding: "8px 14px",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            cursor: isDownloading ? "wait" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            borderRadius: "8px",
                            background: fmt.id === "mp4" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "rgba(255, 255, 255, 0.08)",
                            boxShadow: fmt.id === "mp4" ? "0 8px 16px -4px rgba(16, 185, 129, 0.4)" : "none",
                            opacity: isDownloading ? 0.75 : 1,
                            transition: "all 0.15s ease",
                          }}
                        >
                          {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                          <span>{isDownloading ? "Downloading..." : fmt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* In-Modal Video Player Preview */}
            {(previewVideoUrl || downloadUrl) && (
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  VIDEO PREVIEW
                </label>
                <div
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <video
                    controls
                    playsInline
                    key={previewVideoUrl || downloadUrl || ""}
                    src={previewVideoUrl || downloadUrl || ""}
                    style={{
                      maxHeight: "360px",
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={handleResetForNewRender}
                className="btn-secondary"
                style={{ fontSize: "0.82rem", padding: "8px 14px" }}
              >
                Render Another Resolution
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{ fontSize: "0.88rem", padding: "8px 20px" }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* --- STATE 4: FAILED --- */}
        {activeJob && activeJob.status === "failed" && (
          <div
            style={{
              padding: "24px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <AlertCircle size={26} className="text-red-400 flex-shrink-0" />
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 4px 0", color: "#fff" }}>
                  Render Failed
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#fca5a5", lineHeight: 1.4 }}>
                  {activeJob.error || "An unexpected error occurred during FFmpeg execution."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={handleResetForNewRender}
                className="btn-secondary"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Change Settings
              </button>
              <button
                type="button"
                onClick={() => handleRetryRender(activeJob.id)}
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  fontSize: "0.85rem",
                  padding: "8px 18px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                }}
              >
                <RefreshCw size={14} className={isSubmitting ? "animate-spin" : ""} />
                <span>{isSubmitting ? "Retrying..." : "Retry Render"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Recent Renders History (Previous Exports) */}
        {!activeJob && recentJobs.length > 0 && (
          <div>
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "8px",
                letterSpacing: "0.04em",
              }}
            >
              PREVIOUS EXPORTS ({recentJobs.length})
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentJobs.map((j) => (
                <div
                  key={j.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "var(--bg-card-subtle)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.82rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          background: j.status === "completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: j.status === "completed" ? "#34d399" : "var(--primary)",
                        }}
                      >
                        <Film size={16} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{j.resolution}</span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 600,
                              background:
                                j.status === "completed"
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : j.status === "processing"
                                  ? "rgba(99, 102, 241, 0.15)"
                                  : "rgba(239, 68, 68, 0.15)",
                              color:
                                j.status === "completed"
                                  ? "#34d399"
                                  : j.status === "processing"
                                  ? "#818cf8"
                                  : "#f87171",
                            }}
                          >
                            {j.status.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                          {j.duration ? `${j.duration.toFixed(1)}s` : ""}
                          {j.file_size ? ` • ${(j.file_size / (1024 * 1024)).toFixed(1)} MB` : ""}
                          {j.created_at ? ` • ${new Date(j.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Preview Toggle & Delete */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {j.status === "completed" && (
                        <button
                          type="button"
                          onClick={() => setActivePreviewJobId(activePreviewJobId === j.id ? null : j.id)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-subtle)",
                            background: activePreviewJobId === j.id ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
                            color: activePreviewJobId === j.id ? "var(--primary)" : "var(--text-secondary)",
                            fontSize: "0.76rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Play size={12} />
                          <span>{activePreviewJobId === j.id ? "Hide Preview" : "Preview"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteJob(j.id)}
                        disabled={deletingJobId === j.id}
                        title="Delete Export"
                        style={{
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          background: "rgba(239, 68, 68, 0.06)",
                          color: "#f87171",
                          fontSize: "0.76rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Multi-Format Download Buttons for completed export */}
                  {j.status === "completed" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        paddingTop: "8px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Download Formats:
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {DOWNLOAD_FORMATS.map((fmt) => {
                          const isDownloading = downloadingFormat === `${j.id}-${fmt.id}`;
                          return (
                            <button
                              key={fmt.id}
                              type="button"
                              onClick={() => handleDownloadFormat(j.id, fmt.id, j.output_filename)}
                              disabled={isDownloading}
                              title={fmt.desc}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                background: fmt.id === "mp4" ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
                                border: fmt.id === "mp4" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                                color: fmt.id === "mp4" ? "#34d399" : "var(--text-secondary)",
                                fontSize: "0.74rem",
                                fontWeight: 600,
                                cursor: isDownloading ? "wait" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                transition: "all 0.15s ease",
                                opacity: isDownloading ? 0.75 : 1,
                              }}
                            >
                              {isDownloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                              <span>{isDownloading ? "Saving..." : fmt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inline Video Player Preview when toggled */}
                  {activePreviewJobId === j.id && j.status === "completed" && (
                    <div
                      style={{
                        marginTop: "8px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        background: "#000",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        maxHeight: "260px",
                      }}
                    >
                      <video
                        controls
                        autoPlay
                        playsInline
                        key={activePreviewJobUrl || j.id}
                        src={activePreviewJobUrl || api.getRenderDownloadUrl(project.id, j.id, "mp4")}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "260px",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
