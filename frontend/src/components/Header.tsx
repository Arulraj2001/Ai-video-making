import React from "react";
import {
  Plus,
  UploadCloud,
  RefreshCw,
  Sun,
  Moon,
  Keyboard,
  Download,
  BookOpen,
  Clapperboard,
  Film,
  FileText,
  Sliders,
  ChevronDown
} from "lucide-react";
import type { Project } from "../types";
import { ScenoraLogo } from "./brand/ScenoraLogo";

export type StudioStage = "script" | "bible" | "storyboard" | "timeline" | "export";

interface HeaderProps {
  activeProject: Project | null;
  projects?: Project[];
  onSelectProject?: (id: string) => void;
  isHealthy: boolean | null;
  checkingHealth: boolean;
  onNewProject: () => void;
  onOpenImport: () => void;
  onRefreshHealth: () => void;
  activeStage?: StudioStage;
  onChangeStage?: (stage: StudioStage) => void;
  onOpenShortcuts?: () => void;
  onOpenRestore?: () => void;
  onExportProject?: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProject,
  projects = [],
  onSelectProject,
  isHealthy,
  checkingHealth,
  onNewProject,
  onOpenImport,
  onRefreshHealth,
  activeStage = "script",
  onChangeStage,
  onOpenShortcuts,
  onOpenRestore,
  onExportProject,
  theme,
  onToggleTheme,
}) => {
  const sceneCount = activeProject?.scenes?.length || 0;
  const bibleCount = (activeProject?.video_bible?.characters?.length || 0) + (activeProject?.video_bible?.locations?.length || 0);
  const imagesReadyCount = activeProject?.scenes?.filter((s) => Boolean(s.image_url)).length || 0;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--bg-header)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Project Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <ScenoraLogo subBrand="studio" size="sm" />

          <div className="flex flex-col">
            {/* Project Picker dropdown */}
            {activeProject ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                {projects.length > 1 && onSelectProject ? (
                  <div className="relative inline-flex items-center">
                    <select
                      value={activeProject.id}
                      onChange={(e) => onSelectProject(e.target.value)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-secondary)",
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        paddingRight: "16px",
                        cursor: "pointer",
                        outline: "none",
                        maxWidth: "160px",
                      }}
                      className="truncate"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id} style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={11} style={{ position: "absolute", right: 0, pointerEvents: "none", color: "var(--text-muted)" }} />
                  </div>
                ) : (
                  <span className="text-xs font-semibold truncate max-w-[160px]" style={{ color: "var(--text-secondary)" }}>
                    {activeProject.name}
                  </span>
                )}
                <span className="badge badge-neutral text-[10px] py-0 px-1.5 font-mono">
                  {sceneCount} sc
                </span>
              </div>
            ) : (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Studio Dashboard
              </span>
            )}
          </div>
        </div>

        {/* Center: Pipeline Stepper (Visible when project is open) */}
        {activeProject && onChangeStage ? (
          <nav className="pipeline-stepper-container hidden md:flex" aria-label="Studio Pipeline Navigation">
            <button
              onClick={() => onChangeStage("script")}
              className={`pipeline-step-btn ${activeStage === "script" ? "active" : ""} ${sceneCount > 0 ? "completed" : ""}`}
              title="Step 1: Ingest Voiceover Audio & Clipchamp Captions"
            >
              <span className="pipeline-step-num">1</span>
              <FileText size={13} />
              <span>Audio & Script</span>
            </button>

            <button
              onClick={() => onChangeStage("bible")}
              className={`pipeline-step-btn ${activeStage === "bible" ? "active" : ""} ${bibleCount > 0 ? "completed" : ""}`}
              title="Step 2: Define Visual Bible Consistency"
            >
              <span className="pipeline-step-num">2</span>
              <BookOpen size={13} />
              <span>Video Bible</span>
              {bibleCount > 0 && (
                <span className="badge badge-neutral text-[10px] py-0 px-1 font-mono">
                  {bibleCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeStage("storyboard")}
              className={`pipeline-step-btn ${activeStage === "storyboard" ? "active" : ""} ${imagesReadyCount > 0 ? "completed" : ""}`}
              title="Step 3: Generate Scene Prompts & Images"
            >
              <span className="pipeline-step-num">3</span>
              <Clapperboard size={13} />
              <span>Storyboard</span>
              {imagesReadyCount > 0 && (
                <span className="badge badge-success text-[10px] py-0 px-1 font-mono">
                  {imagesReadyCount}/{sceneCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeStage("timeline")}
              className={`pipeline-step-btn ${activeStage === "timeline" ? "active" : ""}`}
              title="Step 4: Multi-Track Timeline Mastering & Cinema Preview"
            >
              <span className="pipeline-step-num">4</span>
              <Sliders size={13} />
              <span>Timeline Studio</span>
            </button>

            <button
              onClick={() => onChangeStage("export")}
              className={`pipeline-step-btn ${activeStage === "export" ? "active" : ""}`}
              title="Step 5: Full HD MP4 Rendering & Delivery"
            >
              <span className="pipeline-step-num">5</span>
              <Film size={13} />
              <span>Export & Deliver</span>
            </button>
          </nav>
        ) : null}

        {/* Right: Studio Utilities & System Status */}
        <div className="flex items-center gap-2">
          {/* Autosave status indicator */}
          {activeProject && (
            <div
              className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
              style={{
                background: "var(--bg-card-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
              title="Automatic background saving is enabled"
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent-success)",
                }}
              />
              <span className="font-medium text-[11px]">Autosaved</span>
            </div>
          )}

          {/* Backup Export / Restore Quick Actions */}
          {activeProject && onExportProject && (
            <button
              onClick={onExportProject}
              className="btn-ghost p-1.5"
              title="Download Project Backup (.json)"
              aria-label="Backup Export"
            >
              <Download size={15} />
            </button>
          )}

          {onOpenRestore && (
            <button
              onClick={onOpenRestore}
              className="btn-ghost p-1.5"
              title="Restore Project from Backup (.json)"
              aria-label="Restore Backup"
            >
              <UploadCloud size={15} />
            </button>
          )}

          {/* Keyboard Shortcuts Trigger */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="btn-ghost p-1.5"
              title="Keyboard Shortcuts (?)"
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard size={15} />
            </button>
          )}

          {/* Theme Toggle (Light / Soft Dark) */}
          <button
            onClick={onToggleTheme}
            className="btn-ghost p-1.5"
            title={`Switch to ${theme === "light" ? "Dark Slate" : "Clean Light"} Theme`}
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Health Status Dot */}
          <button
            onClick={onRefreshHealth}
            title={isHealthy ? "Backend Online" : "Backend Offline — Click to retry"}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer"
            style={{
              background: "var(--bg-card-subtle)",
              borderColor: "var(--border-subtle)",
            }}
          >
            {checkingHealth ? (
              <RefreshCw size={12} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            ) : isHealthy ? (
              <>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--accent-success)",
                  }}
                  className="animate-pulse"
                />
                <span className="hidden xl:inline text-[11px] font-medium" style={{ color: "var(--accent-success-text)" }}>
                  Online
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--accent-danger)",
                  }}
                />
                <span className="hidden xl:inline text-[11px] font-medium" style={{ color: "var(--accent-danger-text)" }}>
                  Offline
                </span>
              </>
            )}
          </button>

          {/* Import Project button */}
          <button
            onClick={onOpenImport}
            className="btn-secondary text-xs py-1.5 px-2.5"
            title="Import Project with audio and captions"
            aria-label="Import Project"
          >
            <UploadCloud size={14} />
            <span className="hidden md:inline">Import</span>
          </button>

          {/* New Blank Project button */}
          <button
            onClick={onNewProject}
            className="btn-primary text-xs py-1.5 px-3"
            title="Create new project"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
