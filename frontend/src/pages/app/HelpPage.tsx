import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { BookOpen, Keyboard } from "lucide-react";

export const HelpPage: React.FC = () => {
  const shortcuts = [
    { key: "Space", desc: "Play / Pause timeline preview" },
    { key: "← / →", desc: "Step frame backward / forward (0.5s)" },
    { key: "Ctrl + Z", desc: "Undo timeline cut or duration edit" },
    { key: "Ctrl + Y", desc: "Redo timeline modification" },
    { key: "1 - 5", desc: "Jump directly to Pipeline Stage (1 to 5)" },
    { key: "Esc", desc: "Close open dialog or inspection modal" },
    { key: "?", desc: "Open keyboard shortcuts quick cheat sheet" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Studio Help & Shortcuts"
        subtitle="Quick reference documentation and editor keystrokes for ScenoraEdits Studio."
      />

      <div className="space-y-6">
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Keyboard size={18} className="text-[var(--color-primary)]" />
            <h3 className="text-base font-bold text-[var(--color-text)] font-display">
              Studio Keyboard Shortcuts
            </h3>
          </div>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            {shortcuts.map((sc, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-secondary)]">{sc.desc}</span>
                <kbd className="px-2.5 py-1 bg-[var(--color-card-subtle)] border border-[var(--color-border)] rounded-[var(--radius-sm)] font-mono font-bold text-[var(--color-text)] shadow-xs">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="default" className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-[var(--color-secondary)]" />
            <h3 className="text-base font-bold text-[var(--color-text)] font-display">
              Recommended Production Workflow
            </h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <li>
              <strong>Stage 1 (Script & Audio):</strong> Import your voiceover narration (.wav/.mp3) and Clipchamp timestamped captions (.json).
            </li>
            <li>
              <strong>Stage 2 (Video Bible):</strong> Define main characters and recurrent locations to establish strong visual consistency.
            </li>
            <li>
              <strong>Stage 3 (Storyboard):</strong> Choose your style preset (Cinematic, Anime, 3D, Stick Figure) and generate scene images.
            </li>
            <li>
              <strong>Stage 4 (Timeline):</strong> Review transitions, scrub the playhead, and preview synced audio in Cinema Preview.
            </li>
            <li>
              <strong>Stage 5 (Export):</strong> Choose your aspect ratio and export a broadcast-ready Full HD 1080p MP4.
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
};
