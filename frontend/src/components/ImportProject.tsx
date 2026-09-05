import React, { useState, useRef } from "react";
import { UploadCloud, Music, Sparkles, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { api } from "../services/api";
import type { Scene } from "../types";

interface ImportProjectProps {
  onSuccess: (project: any) => void;
  onCancel: () => void;
}

const SAMPLE_CAPTIONS = `00:00 - 00:05
Deep beneath the neon-soaked skyline of Neo-Veridia, ancient data vaults hum with forgotten memories.

00:05 - 00:11
Maya Vance, a cybernetic archivist in a worn leather trench coat, decodes an encrypted holographic transmission.

00:11 - 00:18
The holographic artifact flickers, revealing coordinate vectors pointing toward the orbital citadel.

00:18 - 00:24
With her cybernetic optic glowing cyan, she prepares her grav-bike for an ascent into the stratosphere.`;

export const ImportProject: React.FC<ImportProjectProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [rawCaptions, setRawCaptions] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Parsing & validation preview state
  const [previewScenes, setPreviewScenes] = useState<Scene[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasValidated, setHasValidated] = useState(false);
  const [isStale, setIsStale] = useState(false); // captions edited after last verify
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetAudio(file);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetAudio(e.target.files[0]);
    }
  };

  const validateAndSetAudio = (file: File) => {
    const validExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setGeneralError(`Unsupported audio format '${ext}'. Allowed: MP3, WAV, M4A, AAC, OGG.`);
      return;
    }
    setGeneralError(null);
    setAudioFile(file);
  };

  const handleParsePreview = async () => {
    if (!rawCaptions.trim()) {
      setValidationErrors(["Please paste Clipchamp captions first."]);
      setHasValidated(true);
      setIsStale(false);
      setPreviewScenes([]);
      return;
    }

    try {
      setValidating(true);
      setGeneralError(null);
      const res = await api.parseCaptions(rawCaptions);
      setHasValidated(true);
      setIsStale(false);
      if (res.valid) {
        setPreviewScenes(res.scenes);
        setValidationErrors([]);
      } else {
        setPreviewScenes([]);
        setValidationErrors(res.errors);
      }
    } catch (err: any) {
      setGeneralError(err.message || "Failed to validate captions");
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setGeneralError("Please enter a project name.");
      return;
    }
    if (!rawCaptions.trim()) {
      setGeneralError("Please paste or type Clipchamp captions.");
      return;
    }

    try {
      setSubmitting(true);
      setGeneralError(null);

      // 1. Create project with audio and captions via FormData
      const formData = new FormData();
      formData.append("name", name.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      if (audioFile) {
        formData.append("audio_file", audioFile);
      }
      formData.append("raw_captions", rawCaptions.trim());

      const project = await api.importProject(formData);

      onSuccess(project);
    } catch (err: any) {
      setGeneralError(err.message || "Failed to import project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
        <span className="badge badge-info text-xs">Stage 1 Ingestion</span>
      </div>

      <div className="studio-card p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
            Import Voiceover & Clipchamp Captions
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Upload your narration voice track and paste your Clipchamp timestamped captions to generate structured Master Timeline scenes.
          </p>
        </div>

        {generalError && (
          <div
            className="mb-6 p-4 rounded-xl border text-xs flex items-start gap-2.5"
            style={{
              background: "var(--accent-danger-subtle)",
              borderColor: "var(--accent-danger)",
              color: "var(--accent-danger-text)",
            }}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Project Name & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Project Name <span style={{ color: "var(--accent-danger)" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cyberpunk Detective Ep. 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-text"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Brief project notes or storyline..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-text"
              />
            </div>
          </div>

          {/* 2. Audio Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Narration / Voiceover Audio (MP3, WAV, M4A, AAC, OGG)
            </label>

            {/* Fixed-height audio zone — prevents layout jump when audio is added/removed */}
            <div style={{ minHeight: 88 }}>
            {!audioFile ? (
              <div
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDrop={handleAudioDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`dropzone cursor-pointer ${dragActive ? "active" : ""}`}
                style={{ minHeight: 88 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.m4a,.aac,.ogg"
                  onChange={handleAudioSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-md)",
                      background: "var(--accent-primary-subtle)",
                      color: "var(--accent-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <UploadCloud size={18} />
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    Drop audio file here, or click to browse
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Supports MP3, WAV, M4A, AAC, OGG up to 50MB
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{
                  minHeight: 88,
                  background: "var(--bg-card-subtle)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-md)",
                      background: "var(--accent-info-subtle)",
                      color: "var(--accent-info-text)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Music size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {audioFile.name}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAudioFile(null)}
                  className="btn-ghost text-xs py-1 px-2.5"
                  style={{ color: "var(--accent-danger-text)" }}
                >
                  Replace
                </button>
              </div>
            )}
            </div>{/* end fixed-height audio zone */}
          </div>

          {/* 3. Clipchamp Captions Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Clipchamp Timestamped Captions <span style={{ color: "var(--accent-danger)" }}>*</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRawCaptions(SAMPLE_CAPTIONS)}
                  className="text-[11px] font-medium transition-colors hover:underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Paste Sample Captions
                </button>
                <span style={{ color: "var(--border-subtle)" }}>•</span>
                <button
                  type="button"
                  onClick={handleParsePreview}
                  disabled={validating || !rawCaptions.trim()}
                  className="btn-secondary text-[11px] py-1 px-2"
                >
                  <Sparkles size={11} />
                  <span>{validating ? "Validating..." : "Verify Timestamps"}</span>
                </button>
              </div>
            </div>

            <textarea
              required
              rows={8}
              placeholder={`00:00 - 00:04\nFirst scene narration text goes here.\n\n00:04 - 00:09\nSecond scene narration text goes here.`}
              value={rawCaptions}
              onChange={(e) => {
                setRawCaptions(e.target.value);
                // Mark stale instead of destroying the panel — prevents layout jump
                if (hasValidated) setIsStale(true);
              }}
              className="textarea-custom"
            />
          </div>

          {/* Validation Feedback Banner */}
          {hasValidated && (
            <div>
              {validationErrors.length > 0 ? (
                <div
                  className="p-4 rounded-xl border space-y-2 text-xs"
                  style={{
                    background: "var(--accent-danger-subtle)",
                    borderColor: "var(--accent-danger)",
                    color: "var(--accent-danger-text)",
                  }}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={15} />
                    <span>Caption Formatting Errors Detected:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div
                  className="p-4 rounded-xl border space-y-3"
                  style={{
                    background: "var(--accent-success-subtle)",
                    borderColor: isStale ? "var(--accent-warning)" : "var(--accent-success)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: isStale ? "var(--accent-warning-text)" : "var(--accent-success-text)" }}>
                      <CheckCircle2 size={15} />
                      <span>Valid Clipchamp Timestamps • {previewScenes.length} Scenes Extracted</span>
                    </div>
                    {isStale
                      ? <span className="badge badge-warning text-[10px]">Edited — re-verify</span>
                      : <span className="badge badge-success text-[10px]">Ready to Ingest</span>
                    }
                  </div>

                  {/* Scene Preview Cards */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {previewScenes.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-2.5 rounded-lg border flex items-start gap-3 text-xs"
                        style={{
                          background: "var(--bg-surface)",
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        <span className="badge badge-neutral text-[10px] font-mono shrink-0">
                          {sc.id} • {sc.start}s - {sc.end}s
                        </span>
                        <span className="truncate" style={{ color: "var(--text-primary)" }}>
                          {sc.caption}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !name.trim() || !rawCaptions.trim()}
              className="btn-primary text-xs py-2 px-5"
            >
              <span>{submitting ? "Building Project Timeline..." : "Create Project & Master Timeline"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
