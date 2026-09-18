import React, { useState, useEffect, useRef } from "react";
import { Link } from "../../router/Router";
import { api } from "../../services/api";
import type { EntitlementResponse } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Project } from "../../types";

interface BulkImportModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProject: Project) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  project,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isAdmin } = useAuth();
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(null);
  const [checkingEntitlement, setCheckingEntitlement] = useState<boolean>(true);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    matched_count: number;
    unmatched_files: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setError(null);
      setSuccessResult(null);
      return;
    }

    let active = true;
    setCheckingEntitlement(true);

    api
      .getCurrentEntitlement()
      .then((res) => {
        if (active) setEntitlement(res);
      })
      .catch(() => {
        if (active) setEntitlement(null);
      })
      .finally(() => {
        if (active) setCheckingEntitlement(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isPro = isAdmin || Boolean(entitlement && entitlement.is_active);

  const handleFilesSelected = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const fileList = Array.from(incoming);
    setFiles(fileList);
    setError(null);
    setSuccessResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select image files or a ZIP archive to upload.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await api.bulkImportSceneImages(project.id, files);
      setSuccessResult({
        matched_count: res.matched_count,
        unmatched_files: res.unmatched_files,
      });
      if (res.project) {
        onSuccess(res.project);
      }
    } catch (err: any) {
      let msg = err.message || "Failed to process bulk image upload.";
      if (
        err.status === 502 ||
        err.statusCode === 502 ||
        msg.includes("502") ||
        msg.includes("Bad Gateway") ||
        msg.includes("Cannot connect")
      ) {
        msg = "The cloud server is starting up from idle sleep (Render free tier takes ~45s to wake). Please wait 30 seconds and try uploading again.";
      }
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  // Tolerant client-side preview of filename matching
  const guessSceneNum = (name: string): number | null => {
    const stem = name.replace(/\.[^/.]+$/, "").toLowerCase();
    const m = stem.match(/(?:scene|shot|sc)[-_ ]*0*(\d+)/);
    if (m) return parseInt(m[1], 10);
    const m2 = stem.match(/^0*(\d+)(?:[-_ .]|$)/);
    if (m2) return parseInt(m2[1], 10);
    const m3 = stem.match(/[-_ ]0*(\d+)$/);
    if (m3) return parseInt(m3[1], 10);
    const m4 = stem.match(/\b0*(\d+)\b/);
    if (m4) return parseInt(m4[1], 10);
    return null;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "#fef3c7",
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
                fontWeight: 700,
                fontSize: "18px",
              }}
            >
              📥
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                  Bulk Scene Image Import
                </h2>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    backgroundColor: "#f59e0b",
                    color: "#ffffff",
                  }}
                >
                  PRO
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                Drop multiple files or a ZIP archive to automatically align images to scenes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              backgroundColor: "transparent",
              border: "1px solid transparent",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.color = "#334155";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div
          style={{
            padding: "24px",
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {checkingEntitlement ? (
            <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <div style={{ width: "32px", height: "32px", border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "12px" }}></div>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 500 }}>Checking Pro entitlement...</p>
            </div>
          ) : !isPro ? (
            /* Pro Upgrade Banner */
            <div
              style={{
                padding: "32px 24px",
                textAlign: "center",
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #fef3c7",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.08)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                👑
              </div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Unlock Bulk Scene Alignment with Pro
              </h3>
              <p style={{ margin: "8px auto 0", fontSize: "12px", color: "#475569", maxWidth: "440px", lineHeight: 1.5 }}>
                Save hours by dropping a folder or ZIP of images. Scenora automatically maps each file to its exact scene, sanitizes color profiles for zero-crash rendering, and updates your video instantly.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  maxWidth: "380px",
                  margin: "20px auto",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#334155",
                }}
              >
                <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span> ZIP & Multi-file drag
                </div>
                <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span> Auto-scene detection
                </div>
                <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span> 100% FFmpeg-safe
                </div>
                <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span> Full HD MP4 render
                </div>
              </div>

              <Link
                to="/pricing"
                onClick={onClose}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 24px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "12px",
                  backgroundColor: "#f59e0b",
                  color: "#ffffff",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
                  transition: "all 0.15s ease",
                }}
              >
                ⚡ View Pro Plans & Upgrade
              </Link>
            </div>
          ) : (
            /* Upload Workflow for Pro Creators */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {error && (
                <div style={{ padding: "12px 16px", borderRadius: "12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "12px", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              {successResult && (
                <div style={{ padding: "16px", borderRadius: "14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#15803d" }}>
                    ✓ {successResult.matched_count} scenes aligned and updated!
                  </p>
                  <p style={{ margin: 0, color: "#475569" }}>
                    Your scene images have been processed with 100% FFmpeg rendering safety and are now live in your storyboard and timeline.
                  </p>
                  {successResult.unmatched_files.length > 0 && (
                    <p style={{ margin: "4px 0 0", color: "#b45309", fontWeight: 600 }}>
                      Note: {successResult.unmatched_files.length} files could not be mapped: {successResult.unmatched_files.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? "2px dashed #f59e0b" : "2px dashed #cbd5e1",
                  borderRadius: "16px",
                  padding: "36px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: isDragging ? "#fffbeb" : "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.avif,.zip"
                  style={{ display: "none" }}
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />

                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    backgroundColor: "#fef3c7",
                    border: "1px solid #fde68a",
                    color: "#d97706",
                    margin: "0 auto 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}
                >
                  📁
                </div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  Click to browse or drop images / ZIP archive
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Supports .png, .jpg, .webp, or a single .zip containing numbered scenes
                </p>
                <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                  Naming tip: <span style={{ fontFamily: "monospace", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>scene_01.png</span>, <span style={{ fontFamily: "monospace", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>1.jpg</span>, or <span style={{ fontFamily: "monospace", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>shot-2.webp</span>
                </p>
              </div>

              {/* Selected Files Preview List */}
              {files.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontWeight: 700, color: "#334155" }}>
                      Selected Files ({files.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      style={{ background: "none", border: "none", color: "#dc2626", textDecoration: "underline", fontSize: "11px", cursor: "pointer" }}
                    >
                      Clear Selection
                    </button>
                  </div>

                  <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
                    {files.map((file, idx) => {
                      const isZip = file.name.toLowerCase().endsWith(".zip");
                      const guess = isZip ? null : guessSceneNum(file.name);
                      const targetScene = guess && guess <= project.scenes.length
                        ? project.scenes[guess - 1]
                        : null;

                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #f1f5f9",
                            fontSize: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}>
                            <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "11px" }}>
                              {idx + 1}.
                            </span>
                            <span style={{ fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {file.name}
                            </span>
                            <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>

                          {isZip ? (
                            <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, backgroundColor: "#f3e8ff", color: "#7e22ce" }}>
                              ZIP Archive
                            </span>
                          ) : targetScene ? (
                            <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, backgroundColor: "#dcfce7", color: "#15803d" }}>
                              → Scene {guess}
                            </span>
                          ) : (
                            <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 500, backgroundColor: "#e2e8f0", color: "#475569" }}>
                              Auto-sequential
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#475569",
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {successResult ? "Done" : "Cancel"}
          </button>

          {isPro && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#ffffff",
                backgroundColor: uploading || files.length === 0 ? "#cbd5e1" : "#f59e0b",
                border: "none",
                cursor: uploading || files.length === 0 ? "not-allowed" : "pointer",
                boxShadow: uploading || files.length === 0 ? "none" : "0 4px 14px rgba(245, 158, 11, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
            >
              {uploading ? (
                <>
                  <div style={{ width: "14px", height: "14px", border: "2px solid #ffffff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                  <span>Sanitizing & Aligning...</span>
                </>
              ) : (
                <>
                  <span>📥 Align & Apply to Scenes</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
