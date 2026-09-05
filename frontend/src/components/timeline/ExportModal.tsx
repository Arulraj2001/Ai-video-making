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
} from "lucide-react";
import type { Project } from "../../types/project";
import type { RenderJob } from "../../types/render";
import { api } from "../../services/api";

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
  const [activeJob, setActiveJob] = useState<RenderJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentJobs, setRecentJobs] = useState<RenderJob[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

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
        if (updated.status === "completed" || updated.status === "failed") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          fetchRecentJobs();
        }
      } catch (err: any) {
        console.error("Polling error:", err);
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
    try {
      const job = await api.startRender(project.id, {
        resolution: selectedResolution,
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
                      {opt.defaultBadge && (
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
                          Default
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
                  FRAMERATE
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  30 FPS
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  AUDIO CODEC
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  AAC (192 kbps)
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  TIMELINE
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {project.scenes?.length || 0} scenes • {totalDuration.toFixed(1)}s
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

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={activeJob.output_filename || "video.mp4"}
                  className="btn-primary"
                  style={{
                    padding: "10px 20px",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "none",
                    boxShadow: "0 8px 16px -4px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  <Download size={16} />
                  <span>Download MP4</span>
                </a>
              )}
            </div>

            {/* In-Modal Video Player Preview */}
            {downloadUrl && (
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
                    src={downloadUrl}
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

        {/* Recent Renders History (if any) */}
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
              }}
            >
              PREVIOUS EXPORTS
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentJobs.map((j) => (
                <div
                  key={j.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "var(--bg-card-subtle)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.82rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Film size={15} className="text-indigo-400" />
                    <span style={{ fontWeight: 600 }}>{j.resolution}</span>
                    <span style={{ color: "var(--text-muted)" }}>•</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {j.duration ? `${j.duration.toFixed(1)}s` : ""}
                    </span>
                  </div>

                  {j.status === "completed" && (
                    <a
                      href={api.getRenderDownloadUrl(project.id, j.id)}
                      download={j.output_filename || "video.mp4"}
                      style={{
                        color: "#34d399",
                        textDecoration: "none",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
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
