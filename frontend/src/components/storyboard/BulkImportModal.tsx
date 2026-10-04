import React, { useState, useEffect, useRef } from "react";
import { Link } from "../../router/Router";
import { api } from "../../services/api";
import type { EntitlementResponse } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Project } from "../../types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import {
  FolderDown,
  Sparkles,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  FileArchive,
  Image as ImageIcon,
  Trash2,
  Crown,
} from "lucide-react";

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

  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
        <FolderDown size={18} />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-base text-[var(--color-text)]">Bulk Scene Image Import</span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[var(--color-primary)] text-white">
          PRO
        </span>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" size="sm" onClick={onClose}>
        {successResult ? "Done" : "Cancel"}
      </Button>

      {isPro && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          isLoading={uploading}
          leftIcon={<FolderDown size={14} />}
        >
          {uploading ? "Sanitizing & Aligning..." : "Align & Apply to Scenes"}
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description="Drop multiple files or a ZIP archive to automatically align images to scenes"
      size="lg"
      footer={modalFooter}
    >
      <div className="flex flex-col gap-4 py-1">
        {checkingEntitlement ? (
          <div className="py-12 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">Checking Pro entitlement...</p>
          </div>
        ) : !isPro ? (
          /* Pro Upgrade Banner */
          <div className="p-6 text-center bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto mb-3 flex items-center justify-center text-xl">
              <Crown size={24} />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text)] mb-1">
              Unlock Bulk Scene Alignment with Pro
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed mb-4">
              Save hours by dropping a folder or ZIP of images. Scenora automatically maps each file to its exact scene, sanitizes color profiles for zero-crash rendering, and updates your video instantly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm mx-auto mb-5 text-left text-xs text-[var(--color-text-secondary)]">
              <div className="p-2.5 rounded-lg bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] flex items-center gap-2">
                <span className="text-[var(--color-success)] font-bold">✓</span> ZIP & Multi-file drag
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] flex items-center gap-2">
                <span className="text-[var(--color-success)] font-bold">✓</span> Auto-scene detection
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] flex items-center gap-2">
                <span className="text-[var(--color-success)] font-bold">✓</span> 100% FFmpeg-safe
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] flex items-center gap-2">
                <span className="text-[var(--color-success)] font-bold">✓</span> Full HD MP4 render
              </div>
            </div>

            <Link
              to="/pricing"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[var(--color-primary)] text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              <Sparkles size={14} />
              <span>View Pro Plans & Upgrade</span>
            </Link>
          </div>
        ) : (
          /* Upload Workflow for Pro Creators */
          <div className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-success)]">
                  <CheckCircle2 size={16} />
                  <span>{successResult.matched_count} scenes aligned and updated!</span>
                </div>
                <p className="text-[var(--color-text-secondary)]">
                  Your scene images have been processed with 100% FFmpeg rendering safety and are now live in your storyboard and timeline.
                </p>
                {successResult.unmatched_files.length > 0 && (
                  <p className="text-amber-400 font-semibold mt-1">
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
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-card)]"
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

              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] mx-auto mb-3 flex items-center justify-center">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-bold text-[var(--color-text)] mb-1">
                Click to browse or drop images / ZIP archive
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">
                Supports .png, .jpg, .webp, or a single .zip containing numbered scenes
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Naming tip:{" "}
                <code className="font-mono bg-[var(--color-card-subtle)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">
                  scene_01.png
                </code>
                ,{" "}
                <code className="font-mono bg-[var(--color-card-subtle)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">
                  1.jpg
                </code>
                , or{" "}
                <code className="font-mono bg-[var(--color-card-subtle)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">
                  shot-2.webp
                </code>
              </p>
            </div>

            {/* Selected Files Preview List */}
            {files.length > 0 && (
              <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--color-border-subtle)]">
                  <span className="font-bold text-[var(--color-text)]">
                    Selected Files ({files.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-xs text-rose-500 hover:underline cursor-pointer bg-transparent border-none p-0 flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    <span>Clear Selection</span>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pt-1">
                  {files.map((file, idx) => {
                    const isZip = file.name.toLowerCase().endsWith(".zip");
                    const guess = isZip ? null : guessSceneNum(file.name);
                    const targetScene = guess && guess <= project.scenes.length
                      ? project.scenes[guess - 1]
                      : null;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap pr-2">
                          <span className="text-[var(--color-text-muted)] font-mono text-[11px]">
                            {idx + 1}.
                          </span>
                          {isZip ? (
                            <FileArchive size={14} className="text-purple-400 shrink-0" />
                          ) : (
                            <ImageIcon size={14} className="text-[var(--color-text-muted)] shrink-0" />
                          )}
                          <span className="font-semibold text-[var(--color-text)] truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>

                        {isZip ? (
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            ZIP Archive
                          </span>
                        ) : targetScene ? (
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            → Scene {guess}
                          </span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--color-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
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
    </Modal>
  );
};
