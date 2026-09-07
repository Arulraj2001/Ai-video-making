import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        style={{ backdropFilter: "blur(6px)" }}
      />

      {/* Modal Panel */}
      <div
        className={`relative z-10 w-full ${maxWidths} min-w-0 flex max-h-[min(92vh,880px)] my-auto flex-col overflow-hidden rounded-2xl transition-all`}
        style={{
          background: "var(--modal-bg, #FFFFFF)",
          border: "1px solid var(--modal-border, #E2E8F0)",
          boxShadow: "var(--modal-shadow, 0 25px 50px -12px rgba(0,0,0,0.25))",
          animation: "sbModalIn 0.18s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent 0%, #FF6B00 50%, transparent 100%)",
            borderRadius: "16px 16px 0 0",
            zIndex: 10,
          }}
        />

        {/* Header */}
        <div
          className="sb-modal-header flex min-w-0 items-start justify-between shrink-0"
          style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid var(--modal-header-border, #E2E8F0)",
          }}
        >
          <div className="flex-1 min-w-0">
            {title && (
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--modal-text-title, #0F172A)",
                  lineHeight: 1.3,
                  overflowWrap: "anywhere",
                }}
              >
                {title}
              </div>
            )}
            {description && (
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--modal-text-desc, #64748B)",
                  marginTop: "4px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              border: "1px solid var(--modal-border, #E2E8F0)",
              background: "var(--modal-close-bg, #F1F5F9)",
              color: "var(--modal-close-color, #64748B)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              flexShrink: 0,
              marginLeft: "12px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--modal-close-hover, #0F172A)";
              e.currentTarget.style.borderColor = "var(--modal-close-hover, #0F172A)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--modal-close-color, #64748B)";
              e.currentTarget.style.borderColor = "var(--modal-border, #E2E8F0)";
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div
          className="sb-modal-body min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ padding: "16px 20px" }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="sb-modal-footer shrink-0 flex flex-wrap items-center gap-3"
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--modal-header-border, #E2E8F0)",
              background: "var(--modal-footer-bg, #F8FAFC)",
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes sbModalIn {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: "left" | "right";
  title?: React.ReactNode;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  position = "right",
  title,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 ${
          position === "right" ? "right-0" : "left-0"
        } max-w-full flex pl-10`}
      >
        <div className="w-screen max-w-md bg-[var(--modal-bg)] border-l border-[var(--modal-border)] shadow-[var(--modal-shadow)] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[var(--modal-header-border)]">
            <h3 className="text-base font-bold text-[var(--modal-text-title)]">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 rounded-lg text-[var(--modal-close-color)] hover:text-[var(--modal-close-hover)]"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--color-border)] overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer select-none whitespace-nowrap ${
              isActive
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
