import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import type { ProjectCreateInput } from "../types";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: ProjectCreateInput) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await onSubmit({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <FolderPlus size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display" style={{ color: "var(--text-primary)" }}>Create Video Project</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                Name your project. Next, you'll import your voiceover audio and Clipchamp captions to generate your timeline.
              </p>
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
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Neon Horizon Documentary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-text"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary or creative notes for this video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea-custom"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary text-xs"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
