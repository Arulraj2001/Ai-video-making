import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-modal)",
        }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDestructive
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            <AlertTriangle size={20} />
          </div>

          <div className="flex-1 pr-4">
            <h3 className="text-base font-bold font-display" style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            style={{ padding: "6px 14px", fontSize: "0.82rem" }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={isDestructive ? "btn-danger" : "btn-primary"}
            style={{ padding: "6px 16px", fontSize: "0.82rem" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
