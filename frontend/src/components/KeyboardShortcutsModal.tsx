import React, { useEffect } from "react";
import { Keyboard, X } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: "Playback & Navigation" | "Editing" | "General";
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ["Space"], description: "Play / Pause video preview", category: "Playback & Navigation" },
  { keys: ["←", "→"], description: "Seek playhead backward / forward 1s", category: "Playback & Navigation" },
  { keys: ["Shift", "+", "← / →"], description: "Seek playhead backward / forward 5s", category: "Playback & Navigation" },
  { keys: ["S"], description: "Split active scene at current playhead time", category: "Editing" },
  { keys: ["Delete"], description: "Delete selected scene (prompts confirmation)", category: "Editing" },
  { keys: ["Backspace"], description: "Alternative to Delete key", category: "Editing" },
  { keys: ["Esc"], description: "Close modal / dismiss inspector", category: "General" },
  { keys: ["?"], description: "Open keyboard shortcuts reference", category: "General" },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 space-y-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Keyboard size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display" style={{ color: "var(--text-primary)" }}>
                Keyboard Shortcuts
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Quick editor controls for rapid workflows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div key={cat} className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono" style={{ color: "var(--accent-primary)" }}>
                {cat}
              </h4>
              <div className="space-y-1.5">
                {SHORTCUTS.filter((s) => s.category === cat).map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl text-xs transition-colors"
                    style={{
                      background: "var(--bg-card-subtle)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>{s.description}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded-md font-mono text-[10px] shadow-sm font-semibold"
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: "6px 16px", fontSize: "0.82rem" }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
