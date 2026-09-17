import React, { useState, useRef, useEffect } from "react";
import {
  Edit3,
  Check,
  X,
  Clock,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  Plus,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { api } from "../services/api";
import type { Scene, AudioFile } from "../types";

interface SceneTableProps {
  scenes: Scene[];
  audioFile?: AudioFile | null;
  onUpdateScene: (sceneId: string, update: { start?: number; end?: number; caption?: string }) => Promise<any>;
  onDeleteScene?: (sceneId: string) => Promise<any>;
  onAddScene?: () => Promise<void> | void;
  onAutoAlign?: () => Promise<void> | void;
}

export const SceneTable: React.FC<SceneTableProps> = ({
  scenes,
  audioFile,
  onUpdateScene,
  onDeleteScene,
  onAddScene,
  onAutoAlign,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState<string>("");
  const [editEnd, setEditEnd] = useState<string>("");
  const [editCaption, setEditCaption] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAddingScene, setIsAddingScene] = useState(false);
  const [isAutoAligning, setIsAutoAligning] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingTargetEndRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (playingTargetEndRef.current !== null && audio.currentTime >= playingTargetEndRef.current) {
        audio.pause();
        playingTargetEndRef.current = null;
        setPlayingSceneId(null);
      }
    };

    const handleEnded = () => {
      playingTargetEndRef.current = null;
      setPlayingSceneId(null);
    };

    const handlePause = () => {
      setPlayingSceneId(null);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const handleTogglePlayScene = (scene: Scene) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingSceneId === scene.id) {
      audio.pause();
      setPlayingSceneId(null);
      playingTargetEndRef.current = null;
      return;
    }

    audio.currentTime = scene.start;
    playingTargetEndRef.current = scene.end;
    setPlayingSceneId(scene.id);
    audio.play().catch((err) => {
      console.warn("Audio playback error:", err);
      setPlayingSceneId(null);
    });
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!onDeleteScene) return;
    if (!confirm(`Are you sure you want to delete scene ${sceneId}?`)) return;
    try {
      setDeletingId(sceneId);
      setSaveError(null);
      await onDeleteScene(sceneId);
      setSaveToast(`Scene ${sceneId} deleted`);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to delete scene");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSceneClick = async () => {
    if (!onAddScene) return;
    try {
      setIsAddingScene(true);
      setSaveError(null);
      await onAddScene();
      setSaveToast("New scene appended to Master Timeline");
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to add scene");
    } finally {
      setIsAddingScene(false);
    }
  };

  const handleAutoAlignClick = async () => {
    if (!onAutoAlign) return;
    try {
      setIsAutoAligning(true);
      setSaveError(null);
      await onAutoAlign();
      setSaveToast("All scene timestamps auto-aligned seamlessly!");
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err: any) {
      setSaveError(err.message || "Failed to auto-align timeline");
    } finally {
      setIsAutoAligning(false);
    }
  };

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
      setSaveToast(`Scene ${sceneId} saved successfully!`);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update scene");
    } finally {
      setSaving(false);
    }
  };

  // Timeline diagnostics: calculate gaps and overlaps
  const issues = scenes.reduce<{ gaps: number; overlaps: number }>((acc, scene, index) => {
    if (index > 0) {
      const prevEnd = scenes[index - 1].end;
      const diff = scene.start - prevEnd;
      if (diff > 0.05) acc.gaps++;
      else if (diff < -0.05) acc.overlaps++;
    }
    return acc;
  }, { gaps: 0, overlaps: 0 });

  const totalTimelineIssues = issues.gaps + issues.overlaps;
  const totalDuration = scenes.reduce((max, s) => Math.max(max, s.end), 0);

  return (
    <div className="space-y-5">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display" style={{ color: "var(--text-primary)" }}>
                Scenes Timeline
              </h3>
              {scenes.length > 0 && (
                totalTimelineIssues > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                    style={{
                      background: "rgba(245, 158, 11, 0.12)",
                      borderColor: "rgba(245, 158, 11, 0.3)",
                      color: "#f59e0b",
                    }}
                    title={`${issues.gaps} gap(s), ${issues.overlaps} overlap(s) detected`}
                  >
                    <AlertTriangle size={11} />
                    {totalTimelineIssues} {totalTimelineIssues === 1 ? "Timing Issue" : "Timing Issues"}
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                    style={{
                      background: "rgba(34, 197, 94, 0.12)",
                      borderColor: "rgba(34, 197, 94, 0.3)",
                      color: "#22c55e",
                    }}
                  >
                    <CheckCircle2 size={11} />
                    Contiguous Timeline
                  </span>
                )
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {scenes.length} scenes · Total {totalDuration.toFixed(2)}s · Click any row to edit narration & time boundaries.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onAutoAlign && scenes.length > 1 && (
            <button
              type="button"
              onClick={handleAutoAlignClick}
              disabled={isAutoAligning}
              className={`text-xs py-1.5 px-3 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                totalTimelineIssues > 0
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 shadow-sm"
                  : "btn-secondary text-xs py-1.5 px-3"
              }`}
              title="Automatically remove any timing gaps or overlapping audio between scenes"
            >
              {isAutoAligning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Aligning...</span>
                </>
              ) : (
                <>
                  <Wand2 size={13} className={totalTimelineIssues > 0 ? "text-amber-400" : ""} />
                  <span>Auto-Align Timestamps</span>
                </>
              )}
            </button>
          )}

          {onAddScene && (
            <button
              type="button"
              onClick={handleAddSceneClick}
              disabled={isAddingScene}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="Append a new scene to the end of the Master Timeline"
            >
              {isAddingScene ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus size={13} />
                  <span>Add Scene</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Audio player if audio uploaded */}
      {audioFile && (
        <div
          className="py-3 px-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-card-subtle)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate max-w-xs" style={{ color: "var(--text-primary)" }}>
                Master Track: {audioFile.filename}
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {(audioFile.file_size / (1024 * 1024)).toFixed(2)} MB • {audioFile.content_type}
              </div>
            </div>
          </div>
          {audioFile.url && (
            <audio ref={audioRef} controls className="h-8 max-w-xs w-full" src={api.getMediaUrl(audioFile.url)}>
              Your browser does not support audio element.
            </audio>
          )}
        </div>
      )}

      {/* Save Toast Notification */}
      {saveToast && (
        <div
          className="p-3 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in"
          style={{
            background: "rgba(34, 197, 94, 0.12)",
            borderColor: "rgba(34, 197, 94, 0.3)",
            color: "#22c55e",
          }}
        >
          <CheckCircle2 size={14} className="shrink-0" />
          <span className="font-medium">{saveToast}</span>
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
      <div className="overflow-x-auto border-y" style={{ borderColor: "var(--border-subtle)" }}>
        <table className="timeline-table app-data-table">
          <thead>
            <tr>
              <th className="w-24">Scene</th>
              <th className="w-28">Start (s)</th>
              <th className="w-28">End (s)</th>
              <th className="w-28">Duration</th>
              <th>Caption Narration</th>
              <th className="w-36 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((scene, index) => {
              const isEditing = editingId === scene.id;
              const isPlayingThisScene = playingSceneId === scene.id;

              // Check gap or overlap with preceding scene
              let gapWarning: { type: "gap" | "overlap"; amount: number; prevId: string } | null = null;
              if (index > 0) {
                const prevEnd = scenes[index - 1].end;
                const diff = scene.start - prevEnd;
                if (diff > 0.05) {
                  gapWarning = { type: "gap", amount: diff, prevId: scenes[index - 1].id };
                } else if (diff < -0.05) {
                  gapWarning = { type: "overlap", amount: Math.abs(diff), prevId: scenes[index - 1].id };
                }
              }

              return (
                <React.Fragment key={scene.id}>
                  {/* Warning strip if gap or overlap exists between scenes */}
                  {gapWarning && (
                    <tr
                      key={`warn-${scene.id}`}
                      style={{
                        background: "rgba(245, 158, 11, 0.08)",
                        borderTop: "1px dashed rgba(245, 158, 11, 0.3)",
                        borderBottom: "1px dashed rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      <td colSpan={6} className="py-1 px-3 text-[11px] text-amber-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                            <span>
                              {gapWarning.type === "gap"
                                ? `Silence gap of ${gapWarning.amount.toFixed(2)}s between ${gapWarning.prevId} and ${scene.id}`
                                : `Overlap of ${gapWarning.amount.toFixed(2)}s between ${gapWarning.prevId} and ${scene.id}`}
                            </span>
                          </div>
                          {onAutoAlign && (
                            <button
                              type="button"
                              onClick={handleAutoAlignClick}
                              disabled={isAutoAligning}
                              className="text-[11px] font-semibold text-amber-400 hover:text-amber-200 underline flex items-center gap-1"
                            >
                              Auto-align timing
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  <tr
                    style={{
                      background: isEditing
                        ? "var(--accent-primary-subtle)"
                        : isPlayingThisScene
                        ? "rgba(255, 107, 0, 0.08)"
                        : undefined,
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <td>
                      <div className="flex items-center gap-1.5">
                        {isPlayingThisScene && (
                          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-ping shrink-0" />
                        )}
                        <span
                          className="font-mono font-bold px-2 py-0.5 rounded text-xs"
                          style={{
                            background: isPlayingThisScene ? "var(--color-primary-subtle)" : "var(--bg-card-subtle)",
                            color: "var(--accent-primary)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          {scene.id}
                        </span>
                      </div>
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
                        <div className="flex items-center justify-end gap-1">
                          {audioFile?.url && (
                            <button
                              type="button"
                              onClick={() => handleTogglePlayScene(scene)}
                              className={`btn-ghost text-xs py-1 px-2 flex items-center gap-1 ${
                                isPlayingThisScene ? "text-[var(--color-primary)] font-bold bg-[var(--color-primary-subtle)]" : ""
                              }`}
                              title={isPlayingThisScene ? "Pause narration" : `Listen to audio (${scene.start.toFixed(1)}s - ${scene.end.toFixed(1)}s)`}
                            >
                              {isPlayingThisScene ? <Pause size={12} className="text-[var(--color-primary)]" /> : <Play size={12} />}
                              <span className="hidden md:inline">{isPlayingThisScene ? "Playing" : "Listen"}</span>
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(scene)}
                            className="btn-ghost text-xs py-1 px-2"
                            title="Edit Timestamps or Caption"
                          >
                            <Edit3 size={12} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          {onDeleteScene && (
                            <button
                              type="button"
                              onClick={() => handleDeleteScene(scene.id)}
                              disabled={deletingId === scene.id}
                              className="btn-ghost text-xs py-1 px-1.5 text-[var(--color-error)] hover:bg-rose-500/10"
                              title="Delete scene"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer quick add button */}
      {onAddScene && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleAddSceneClick}
            disabled={isAddingScene}
            className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border border-dashed rounded-lg"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <Plus size={13} />
            <span>+ Append New Scene at End</span>
          </button>
        </div>
      )}
    </div>
  );
};
