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
      setError(err.message || "Failed to process bulk image upload.");
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-lg shadow-sm">
              📥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  Bulk Scene Image Import
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-500 text-white shadow-xs">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Drop multiple files or a ZIP archive to automatically align images to scenes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/40">
          {checkingEntitlement ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-medium">Checking Pro entitlement...</p>
            </div>
          ) : !isPro ? (
            /* Pro Upgrade Banner */
            <div className="py-8 px-6 text-center bg-white rounded-2xl border border-amber-100 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-2xl shadow-inner mb-4">
                👑
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Unlock Bulk Scene Alignment with Pro
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                Save hours by dropping a folder or ZIP of images. Scenora automatically maps each file to its exact scene, sanitizes color profiles for zero-crash rendering, and updates your video instantly.
              </p>

              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto my-5 text-left text-xs text-slate-700">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> ZIP & Multi-file drag
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Auto-scene detection
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> 100% FFmpeg-safe
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Full HD MP4 render
                </div>
              </div>

              <Link
                to="/pricing"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                ⚡ View Pro Plans & Upgrade
              </Link>
            </div>
          ) : (
            /* Upload Workflow for Pro Creators */
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {successResult && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-700 text-sm">
                    <span>✓</span> {successResult.matched_count} scenes aligned and updated!
                  </p>
                  <p className="text-slate-600">
                    Your scene images have been processed with 100% FFmpeg rendering safety and are now live in your storyboard and timeline.
                  </p>
                  {successResult.unmatched_files.length > 0 && (
                    <p className="text-amber-700 font-medium pt-1">
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
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-amber-500 bg-amber-50/50 scale-[1.01]"
                    : "border-slate-300 hover:border-amber-400 bg-white hover:bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.avif,.zip"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />

                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center text-xl mb-3 shadow-xs">
                  📁
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Click to browse or drop images / ZIP archive
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports .png, .jpg, .webp, or a single .zip containing numbered scenes
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Naming tip: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">scene_01.png</span>, <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">1.jpg</span>, or <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">shot-2.webp</span>
                </p>
              </div>

              {/* Selected Files Preview List */}
              {files.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                    <span className="font-bold text-slate-700">
                      Selected Files ({files.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="text-red-600 hover:underline text-[11px]"
                    >
                      Clear Selection
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1">
                    {files.map((file, idx) => {
                      const isZip = file.name.toLowerCase().endsWith(".zip");
                      const guess = isZip ? null : guessSceneNum(file.name);
                      const targetScene = guess && guess <= project.scenes.length
                        ? project.scenes[guess - 1]
                        : null;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-slate-400 font-mono text-[11px]">
                              {idx + 1}.
                            </span>
                            <span className="font-medium text-slate-800 truncate">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>

                          {isZip ? (
                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700">
                              ZIP Archive
                            </span>
                          ) : targetScene ? (
                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              → Scene {guess}
                            </span>
                          ) : (
                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200 text-slate-600">
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
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {successResult ? "Done" : "Cancel"}
          </button>

          {isPro && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                uploading || files.length === 0
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 hover:scale-[1.02]"
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
