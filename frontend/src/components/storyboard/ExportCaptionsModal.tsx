import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

interface ExportCaptionsModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

type CaptionFormat = "timed_txt" | "srt" | "clean_txt";

export const ExportCaptionsModal: React.FC<ExportCaptionsModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
}) => {
  const [format, setFormat] = useState<CaptionFormat>("timed_txt");
  const [content, setContent] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [sceneCount, setSceneCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    let active = true;
    setLoading(true);
    setError(null);

    api
      .exportTimelineCaptions(projectId, format)
      .then((res) => {
        if (!active) return;
        setContent(res.content);
        setFilename(res.filename);
        setSceneCount(res.scene_count);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load captions export.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, projectId, format]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${projectName}_captions.${format === "srt" ? "srt" : "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">
              📄
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Export Captions & Narration Timing
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact spoken dialogue and timestamps across {sceneCount} scenes
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

        {/* Format Selector Pills */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => setFormat("timed_txt")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              format === "timed_txt"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            ⏱️ Timed Text
          </button>
          <button
            type="button"
            onClick={() => setFormat("srt")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              format === "srt"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            🎬 SRT Subtitles
          </button>
          <button
            type="button"
            onClick={() => setFormat("clean_txt")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              format === "clean_txt"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            📝 Clean Script Text
          </button>
        </div>

        {/* Content Preview Box */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
          {error && (
            <div className="p-3 mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-medium">Formatting narration captions...</p>
            </div>
          ) : (
            <div className="relative">
              <textarea
                readOnly
                value={content}
                rows={14}
                className="w-full font-mono text-xs text-slate-800 bg-white p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner resize-none select-all"
                style={{ lineHeight: "1.6" }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {filename}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !content}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
            >
              {copied ? "✓ Copied!" : "📋 Copy All"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !content}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              ⬇️ Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
