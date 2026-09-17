import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

interface ExportPromptsModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

type PromptFormat = "midjourney" | "comfyui" | "csv";

export const ExportPromptsModal: React.FC<ExportPromptsModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
}) => {
  const [format, setFormat] = useState<PromptFormat>("midjourney");
  const [content, setContent] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [promptCount, setPromptCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    let active = true;
    setLoading(true);
    setError(null);

    api
      .exportSystemPrompts(projectId, format)
      .then((res) => {
        if (!active) return;
        setContent(res.content);
        setFilename(res.filename);
        setPromptCount(res.prompt_count);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load visual prompts export.");
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
    const mime = format === "csv" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${projectName}_prompts.${format === "csv" ? "csv" : "txt"}`;
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
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100/70 border border-purple-200/60 flex items-center justify-center text-purple-700 font-bold text-lg shadow-sm">
              🎨
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Export System Visual Prompts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Formatted for Midjourney, Leonardo, ComfyUI, or spreadsheet generation ({promptCount} scenes)
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
            onClick={() => setFormat("midjourney")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              format === "midjourney"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            🚀 Midjourney (/imagine)
          </button>
          <button
            type="button"
            onClick={() => setFormat("comfyui")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              format === "comfyui"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            ⚡ ComfyUI / Leonardo List
          </button>
          <button
            type="button"
            onClick={() => setFormat("csv")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              format === "csv"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            📊 CSV Spreadsheet
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
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-medium">Synthesizing visual prompts...</p>
            </div>
          ) : (
            <div className="relative">
              <textarea
                readOnly
                value={content}
                rows={14}
                className="w-full font-mono text-xs text-slate-800 bg-white p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-inner resize-none select-all"
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
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              ⬇️ Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
