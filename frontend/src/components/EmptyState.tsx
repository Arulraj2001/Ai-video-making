import React from "react";
import { UploadCloud, FolderPlus, Film, Sparkles, ArrowRight, BookOpen, Sliders } from "lucide-react";

interface EmptyStateProps {
  onOpenImport: () => void;
  onCreateProject: () => void;
  onOpenRestore?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenImport,
  onCreateProject,
  onOpenRestore,
}) => {
  return (
    <div className="studio-card p-10 text-center max-w-2xl mx-auto my-12 shadow-card">
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-xl)",
          background: "var(--accent-primary-subtle)",
          color: "var(--accent-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <Film size={32} />
      </div>

      <span className="badge badge-info mb-3">ScenoraEdits Studio</span>
      <h2 className="text-2xl font-bold mb-2 font-display" style={{ color: "var(--text-primary)" }}>
        Welcome to ScenoraEdits
      </h2>
      <p className="text-sm max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        No video projects found in this workspace. Create a new project or import your voiceover narration and timestamped captions to launch the automated 5-stage production studio.
      </p>

      {/* Feature summary blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-8">
        <div className="p-3.5 rounded-xl border" style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-md)",
              background: "var(--accent-primary-subtle)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <Sparkles size={14} />
          </div>
          <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>1. Audio & Captions</div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Upload voiceover audio & paste Clipchamp timestamps.
          </div>
        </div>

        <div className="p-3.5 rounded-xl border" style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-md)",
              background: "var(--accent-warning-subtle)",
              color: "var(--accent-warning-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <BookOpen size={14} />
          </div>
          <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>2. Video Bible</div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Define character & scene visual consistency.
          </div>
        </div>

        <div className="p-3.5 rounded-xl border" style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-md)",
              background: "var(--accent-success-subtle)",
              color: "var(--accent-success-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <Sliders size={14} />
          </div>
          <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>3. Timeline & Render</div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Master transitions, BGM ducking, and export 1080p MP4.
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button onClick={onOpenImport} className="btn-primary text-sm py-2.5 px-5 w-full sm:w-auto">
          <UploadCloud size={16} />
          <span>Import Voiceover & Captions</span>
          <ArrowRight size={14} />
        </button>

        <button onClick={onCreateProject} className="btn-secondary text-sm py-2.5 px-4 w-full sm:w-auto">
          <FolderPlus size={15} />
          <span>Create Blank Project</span>
        </button>

        {onOpenRestore && (
          <button onClick={onOpenRestore} className="btn-secondary text-sm py-2.5 px-4 w-full sm:w-auto">
            <span>Restore Backup (.json)</span>
          </button>
        )}
      </div>
    </div>
  );
};
