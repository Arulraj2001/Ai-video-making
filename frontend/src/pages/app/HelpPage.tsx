import React from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { BookOpen, Keyboard } from "lucide-react";

export const HelpPage: React.FC = () => {
  const shortcuts = [
    { key: "Space", desc: "Play / Pause timeline preview" },
    { key: "Ctrl + Z", desc: "Undo timeline cut or duration edit" },
    { key: "Ctrl + Y", desc: "Redo timeline modification" },
    { key: "S or C", desc: "Split scene at playhead position" },
    { key: "Ctrl + D", desc: "Duplicate currently selected scene" },
    { key: "Delete / Backspace", desc: "Delete currently selected scene" },
    { key: "← / →", desc: "Step playhead 1 second backward / forward" },
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
              Recommended 5-Stage Production Workflow
            </h3>
          </div>
          <ol className="list-decimal list-inside space-y-2.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <li>
              <strong>Stage 1 (Script &amp; Audio):</strong> Upload your narration audio (.mp3/.wav) or generate neural voiceover. Whisper segments natural breath pauses into timed scene slots (~2 min).
            </li>
            <li>
              <strong>Stage 2 (Video Bible™):</strong> Select an art style preset and define character identity seeds and wardrobe anchors to eliminate visual drift (~5 min).
            </li>
            <li>
              <strong>Stage 3 (Storyboard &amp; Images):</strong> Assign one image to each scene card — upload custom artwork or generate with AI using your own API key (~15 min).
            </li>
            <li>
              <strong>Stage 4 (Timeline Studio):</strong> Apply Ken Burns camera zoom/pan motion, pick kinetic subtitle typography, and balance automatic audio ducking (~10 min).
            </li>
            <li>
              <strong>Stage 5 (Export &amp; Deliver):</strong> Render multi-format masters (1080p MP4, 720p, WebM, MP3) with zero watermarks and full commercial rights (~3 min).
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
};
