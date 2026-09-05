import React, { useState, useRef } from "react";
import { Upload, X, AlertCircle, FileText } from "lucide-react";
import { api } from "../services/api";
import type { Project } from "../types";

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (restoredProject: Project) => void;
}

export const ImportBackupModal: React.FC<ImportBackupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith(".json")) {
        setError("Selected file must be a .json backup file");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile && !jsonText.trim()) {
      setError("Please select a JSON backup file or paste valid backup JSON");
      return;
    }

    try {
      setLoading(true);
      let payload: File | Record<string, any>;
      if (selectedFile) {
        payload = selectedFile;
      } else {
        try {
          payload = JSON.parse(jsonText);
        } catch {
          throw new Error("Invalid JSON format in text box");
        }
      }

      const restored = await api.importProjectBackup(payload);
      onSuccess(restored);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to restore backup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 space-y-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display" style={{ color: "var(--text-primary)" }}>Restore Project Backup</h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Import a previously saved JSON project backup</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Upload Backup File (.json)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors"
              style={{
                borderColor: "var(--border-default)",
                background: "var(--bg-card-subtle)",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileText size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              {selectedFile ? (
                <div className="text-xs font-mono" style={{ color: "var(--accent-primary)" }}>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              ) : (
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Click to browse for backup .json file
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-xs font-mono" style={{ color: "var(--text-muted)" }}>- OR -</div>

          {/* Paste JSON */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
              Paste Backup JSON Data
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                if (e.target.value) setSelectedFile(null);
              }}
              rows={4}
              placeholder='{"name": "My Project", "scenes": [...]}'
              className="w-full rounded-xl p-2.5 text-xs font-mono resize-none input-text"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: "6px 14px", fontSize: "0.82rem" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: "6px 16px", fontSize: "0.82rem" }}
            >
              {loading ? "Restoring..." : "Restore Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
