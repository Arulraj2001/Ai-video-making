import React, { useState } from "react";
import {
  CheckCircle2,
  Download,
  Upload,
  Keyboard,
  Save,
  Check,
  Sparkles,
  FileCheck2,
  HardDrive
} from "lucide-react";
import { api } from "../services/api";
import type { Project } from "../types";

interface ProjectStatusBarProps {
  project: Project;
  onRefresh: () => void;
  onOpenShortcuts: () => void;
  onOpenImportBackup: () => void;
}

export const ProjectStatusBar: React.FC<ProjectStatusBarProps> = ({
  project,
  onRefresh,
  onOpenShortcuts,
  onOpenImportBackup,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cleaningTemp, setCleaningTemp] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  const scenes = project.scenes || [];
  const totalScenes = scenes.length;
  const completedImages = scenes.filter((s) => s.image_status === "completed" && s.image_url).length;
  const failedImages = scenes.filter((s) => s.image_status === "failed").length;
  const storyboardedScenes = scenes.filter((s) => Boolean(s.image_prompt)).length;
  const hasBible = Boolean(
    project.video_bible?.characters?.length ||
    project.video_bible?.locations?.length ||
    project.video_bible?.overall_style?.visual_style
  );

  // Manual save trigger (provides immediate confirmation feedback)
  const handleManualSave = async () => {
    try {
      setIsSaving(true);
      // Touch/sync settings to guarantee disk persistence
      await api.updateProjectSettings(project.id, {});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefresh();
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Export JSON backup download
  const handleExportBackup = async () => {
    try {
      const data = await api.exportProjectBackup(project.id);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_backup.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  // Clean temporary files
  const handleCleanTemp = async () => {
    try {
      setCleaningTemp(true);
      setCleanupMessage(null);
      const res = await api.cleanProjectTemp(project.id);
      setCleanupMessage(`Cleaned ${res.cleaned_dirs} temp folders (${res.freed_mb} MB freed)`);
      setTimeout(() => setCleanupMessage(null), 4000);
    } catch (err: any) {
      setCleanupMessage(`Cleanup failed: ${err.message}`);
      setTimeout(() => setCleanupMessage(null), 4000);
    } finally {
      setCleaningTemp(false);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/90 p-3.5 space-y-3 shadow-lg">
      {/* Top Row: Pipeline Steps & Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        {/* Pipeline Step Indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 lg:pb-0 font-mono text-[11px]">
          {/* Step 1: Captions */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
              totalScenes > 0
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500"
            }`}
            title="Timestamped captions & audio loaded"
          >
            <CheckCircle2 size={12} className={totalScenes > 0 ? "text-emerald-400" : "text-zinc-600"} />
            <span>1. Captions ({totalScenes})</span>
          </div>

          <span className="text-zinc-600">→</span>

          {/* Step 2: Video Bible */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
              hasBible
                ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500"
            }`}
            title="Video Bible consistency rules & entities"
          >
            <CheckCircle2 size={12} className={hasBible ? "text-purple-400" : "text-zinc-600"} />
            <span>2. Bible</span>
          </div>

          <span className="text-zinc-600">→</span>

          {/* Step 3: Storyboard */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
              storyboardedScenes > 0
                ? "bg-sky-500/10 border-sky-500/30 text-sky-300"
                : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500"
            }`}
            title="Visual prompts generated"
          >
            <Sparkles size={12} className={storyboardedScenes > 0 ? "text-sky-400" : "text-zinc-600"} />
            <span>3. Storyboard ({storyboardedScenes}/{totalScenes})</span>
          </div>

          <span className="text-zinc-600">→</span>

          {/* Step 4: Images */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
              completedImages === totalScenes && totalScenes > 0
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : completedImages > 0
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500"
            }`}
            title="Scene images generated"
          >
            <CheckCircle2 size={12} className={completedImages === totalScenes && totalScenes > 0 ? "text-emerald-400" : "text-amber-400"} />
            <span>4. Images ({completedImages}/{totalScenes})</span>
            {failedImages > 0 && (
              <span className="px-1 py-0.2 bg-rose-500/20 text-rose-400 rounded text-[9px]">
                {failedImages} failed
              </span>
            )}
          </div>

          <span className="text-zinc-600">→</span>

          {/* Step 5: Master Timeline */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
              totalScenes > 0
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500"
            }`}
            title="Master Timeline & Cinema Preview"
          >
            <FileCheck2 size={12} className={totalScenes > 0 ? "text-indigo-400" : "text-zinc-600"} />
            <span>5. Timeline</span>
          </div>
        </div>

        {/* Right Side: Autosave state & Tools */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Autosave badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-[11px] text-zinc-300 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Autosaved</span>
          </div>

          {/* Manual Save Button */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              saveSuccess
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200"
            }`}
            title="Explicitly save project to storage disk"
          >
            {saveSuccess ? <Check size={12} className="text-emerald-400" /> : <Save size={12} />}
            <span>{isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}</span>
          </button>

          {/* Backup Export */}
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors"
            title="Download full project JSON backup"
          >
            <Download size={12} />
            <span>Backup (JSON)</span>
          </button>

          {/* Backup Import */}
          <button
            onClick={onOpenImportBackup}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors"
            title="Restore project from a JSON backup file"
          >
            <Upload size={12} />
            <span>Restore</span>
          </button>

          {/* Clean Temp */}
          <button
            onClick={handleCleanTemp}
            disabled={cleaningTemp}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 text-[11px] transition-colors"
            title="Clean intermediate render cache and temporary files"
          >
            <HardDrive size={12} />
            <span>{cleaningTemp ? "Cleaning..." : "Clean Temp"}</span>
          </button>

          {/* Keyboard shortcuts */}
          <button
            onClick={onOpenShortcuts}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-400 hover:text-white text-[11px] transition-colors"
            title="View keyboard shortcuts reference (?)"
          >
            <Keyboard size={12} />
            <span>Keys (?)</span>
          </button>
        </div>
      </div>

      {/* Optional Feedback Alert for Temp Cleanup */}
      {cleanupMessage && (
        <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-[11px] flex items-center justify-between animate-in fade-in duration-150">
          <span>{cleanupMessage}</span>
          <button onClick={() => setCleanupMessage(null)} className="hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
