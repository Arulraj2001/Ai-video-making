import React, { useState } from "react";
import { Edit3, Check, X, Clock, Layers, AlertCircle, Music } from "lucide-react";
import { api } from "../services/api";
import type { Scene, AudioFile } from "../types";

interface SceneTableProps {
  scenes: Scene[];
  audioFile?: AudioFile | null;
  onUpdateScene: (sceneId: string, update: { start?: number; end?: number; caption?: string }) => Promise<any>;
}

export const SceneTable: React.FC<SceneTableProps> = ({
  scenes,
  audioFile,
  onUpdateScene,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState<string>("");
  const [editEnd, setEditEnd] = useState<string>("");
  const [editCaption, setEditCaption] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (scene: Scene) => {
    setEditingId(scene.id);
    setEditStart(scene.start.toString());
    setEditEnd(scene.end.toString());
    setEditCaption(scene.caption);
    setSaveError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSaveError(null);
  };

  const handleSave = async (sceneId: string) => {
    const s = parseFloat(editStart);
    const e = parseFloat(editEnd);

    if (isNaN(s) || s < 0) {
      setSaveError("Start time must be a valid positive number.");
      return;
    }
    if (isNaN(e) || e <= s) {
      setSaveError("End time must be strictly greater than start time.");
      return;
    }
    if (!editCaption.trim()) {
      setSaveError("Caption text cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      await onUpdateScene(sceneId, {
        start: s,
        end: e,
        caption: editCaption.trim(),
      });
      setEditingId(null);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update scene");
    } finally {
      setSaving(false);
    }
  };

  const totalDuration = scenes.reduce((max, s) => Math.max(max, s.end), 0);

  return (
    <div className="studio-card p-5 sm:p-6 space-y-5">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              background: "var(--accent-primary-subtle)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display" style={{ color: "var(--text-primary)" }}>
                Master Timeline Scene Grid
              </h3>
              <span className="badge badge-info text-[10px] font-mono">{scenes.length} Scenes</span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Narration text locked to caption time intervals. Click any row to fine-tune timestamps or text.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5"
            style={{
              background: "var(--bg-card-subtle)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <Clock size={13} style={{ color: "var(--accent-primary)" }} />
            <span>Total Duration: <strong>{totalDuration.toFixed(2)}s</strong></span>
          </div>
        </div>
      </div>

      {/* Audio player if audio uploaded */}
      {audioFile && (
        <div
          className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            background: "var(--bg-card-subtle)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                background: "var(--accent-info-subtle)",
                color: "var(--accent-info-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Music size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate max-w-xs" style={{ color: "var(--text-primary)" }}>
                {audioFile.filename}
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {(audioFile.file_size / (1024 * 1024)).toFixed(2)} MB • {audioFile.content_type}
              </div>
            </div>
          </div>
          {audioFile.url && (
            <audio controls className="h-8 max-w-xs w-full" src={api.getMediaUrl(audioFile.url)}>
              Your browser does not support audio element.
            </audio>
          )}
        </div>
      )}

      {/* Save Error banner */}
      {saveError && (
        <div
          className="p-3 rounded-lg border text-xs flex items-center gap-2"
          style={{
            background: "var(--accent-danger-subtle)",
            borderColor: "var(--accent-danger)",
            color: "var(--accent-danger-text)",
          }}
        >
          <AlertCircle size={14} className="shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Scenes Table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
        <table className="timeline-table">
          <thead>
            <tr>
              <th className="w-24">Scene</th>
              <th className="w-28">Start (s)</th>
              <th className="w-28">End (s)</th>
              <th className="w-28">Duration</th>
              <th>Caption Narration</th>
              <th className="w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((scene) => {
              const isEditing = editingId === scene.id;

              return (
                <tr
                  key={scene.id}
                  style={{
                    background: isEditing ? "var(--accent-primary-subtle)" : undefined,
                  }}
                >
                  <td>
                    <span
                      className="font-mono font-bold px-2 py-0.5 rounded text-xs"
                      style={{
                        background: "var(--bg-card-subtle)",
                        color: "var(--accent-primary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {scene.id}
                    </span>
                  </td>

                  {/* Start time */}
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                        className="input-text text-xs py-1 px-2 font-mono w-24"
                      />
                    ) : (
                      <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                        {scene.start.toFixed(2)}s
                      </span>
                    )}
                  </td>

                  {/* End time */}
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                        className="input-text text-xs py-1 px-2 font-mono w-24"
                      />
                    ) : (
                      <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                        {scene.end.toFixed(2)}s
                      </span>
                    )}
                  </td>

                  {/* Duration */}
                  <td>
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      <Clock size={11} style={{ color: "var(--accent-primary)" }} />
                      {isEditing
                        ? (
                            (parseFloat(editEnd) || 0) - (parseFloat(editStart) || 0) > 0
                              ? ((parseFloat(editEnd) || 0) - (parseFloat(editStart) || 0)).toFixed(2)
                              : "0.00"
                          )
                        : (scene.end - scene.start).toFixed(2)}
                      s
                    </span>
                  </td>

                  {/* Caption Narration */}
                  <td>
                    {isEditing ? (
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        rows={2}
                        className="textarea-custom text-xs py-1 px-2"
                      />
                    ) : (
                      <span className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                        {scene.caption}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSave(scene.id)}
                          disabled={saving}
                          className="btn-primary text-xs py-1 px-2"
                          title="Save Changes"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="btn-secondary text-xs py-1 px-2"
                          title="Cancel Edit"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(scene)}
                        className="btn-ghost text-xs py-1 px-2"
                        title="Edit Timestamps or Caption"
                      >
                        <Edit3 size={13} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
