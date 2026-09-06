import React, { useEffect } from "react";
import { X } from "lucide-react";
import { IconButton } from "./Button";

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
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity bg-[var(--color-modal-backdrop)] backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative z-10 w-full ${maxWidths} bg-[var(--color-modal)] border border-[var(--color-border)] rounded-[var(--radius-modal)] shadow-[var(--shadow-modal)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-0 zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--color-border-subtle)]">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-[var(--color-text)] font-display">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{description}</p>
            )}
          </div>
          <IconButton
            size="sm"
            variant="ghost"
            icon={<X size={16} />}
            aria-label="Close modal"
            onClick={onClose}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 bg-[var(--color-card-subtle)] border-t border-[var(--color-border-subtle)]">
            {footer}
          </div>
        )}
      </div>
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
        className="absolute inset-0 bg-[var(--color-modal-backdrop)] backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 ${
          position === "right" ? "right-0" : "left-0"
        } max-w-full flex pl-10`}
      >
        <div className="w-screen max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-[var(--shadow-modal)] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h3 className="text-base font-bold text-[var(--color-text)]">{title}</h3>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<X size={16} />}
              aria-label="Close drawer"
              onClick={onClose}
            />
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
