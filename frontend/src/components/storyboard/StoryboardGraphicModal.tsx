import React from "react";
import { Layers, Check, RefreshCw, Type, Quote, BarChart2, ListOrdered, LayoutGrid } from "lucide-react";
import { Modal } from "../ui/Modal";
import type { Scene } from "../../types";

interface StoryboardGraphicModalProps {
  scene: Scene | null;
  isOpen: boolean;
  onClose: () => void;
  graphicTemplateType: "title_card" | "quote_card" | "stats_card" | "step_card" | "split_layout";
  onChangeTemplateType: (type: "title_card" | "quote_card" | "stats_card" | "step_card" | "split_layout") => void;
  headline: string;
  onChangeHeadline: (text: string) => void;
  subtext: string;
  onChangeSubtext: (text: string) => void;
  accentColor: string;
  onChangeAccentColor: (color: string) => void;
  onApplyTemplate: () => void;
  applying: boolean;
}

export const StoryboardGraphicModal: React.FC<StoryboardGraphicModalProps> = ({
  scene,
  isOpen,
  onClose,
  graphicTemplateType,
  onChangeTemplateType,
  headline,
  onChangeHeadline,
  subtext,
  onChangeSubtext,
  accentColor,
  onChangeAccentColor,
  onApplyTemplate,
  applying,
}) => {
  if (!scene) return null;

  const templateStyles: Array<{
    id: "title_card" | "quote_card" | "stats_card" | "step_card" | "split_layout";
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: "title_card", label: "Title / Key Point", icon: <Type size={13} /> },
    { id: "quote_card", label: "Quote Card", icon: <Quote size={13} /> },
    { id: "stats_card", label: "Stat / Metric", icon: <BarChart2 size={13} /> },
    { id: "step_card", label: "Step Number", icon: <ListOrdered size={13} /> },
    { id: "split_layout", label: "Split Overview", icon: <LayoutGrid size={13} /> },
  ];

  const colorPresets = [
    "#FF6B00", // Brand Orange
    "#8B5CF6", // Purple
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#EC4899", // Pink
    "#F59E0B", // Amber
    "#64748B", // Slate
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2.5">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "var(--sb-accent-glow)",
              color: "var(--sb-accent)",
              flexShrink: 0,
            }}
          >
            <Layers size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--modal-text-title)", letterSpacing: "-0.02em" }}>
                Generate Graphic Card
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: "var(--sb-accent)",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: 800,
                  fontFamily: "monospace",
                }}
              >
                SCENE {scene.id}
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--modal-text-desc)", marginTop: "2px", margin: 0 }}>
              Synthesize a sharp vector graphic frame for key takeaways, quotes, or metric callouts.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="sb-btn-secondary"
            style={{ padding: "7px 14px", fontSize: "11.5px" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApplyTemplate}
            disabled={applying || !headline.trim()}
            className="sb-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              fontSize: "11.5px",
              borderRadius: "9px",
            }}
          >
            {applying ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Rendering Graphic Card...</span>
              </>
            ) : (
              <>
                <Check size={12} />
                <span>Render & Apply</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Style Selector */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "10.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--sb-text-muted)",
              marginBottom: "6px",
            }}
          >
            Graphic Style Template
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {templateStyles.map((t) => {
              const isSelected = graphicTemplateType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTemplateType(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "7px 9px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    background: isSelected ? "var(--sb-accent-glow)" : "var(--sb-bg)",
                    border: `1px solid ${isSelected ? "var(--sb-accent)" : "var(--sb-border)"}`,
                    color: isSelected ? "var(--sb-accent)" : "var(--sb-text-secondary)",
                  }}
                >
                  <span style={{ color: isSelected ? "var(--sb-accent)" : "var(--sb-text-muted)" }}>{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Headline Input */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "10.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--sb-text-muted)",
              marginBottom: "5px",
            }}
          >
            Headline Text <span style={{ color: "var(--sb-accent)" }}>*</span>
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => onChangeHeadline(e.target.value)}
            placeholder="e.g. The 3 Core Pillars of Visual Retention"
            style={{
              width: "100%",
              padding: "8px 11px",
              fontSize: "12px",
              borderRadius: "8px",
              background: "var(--sb-bg)",
              border: "1px solid var(--sb-border)",
              color: "var(--sb-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--sb-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--sb-border)")}
          />
        </div>

        {/* Subtext Input */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "10.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--sb-text-muted)",
              marginBottom: "5px",
            }}
          >
            Subtext / Caption (Optional)
          </label>
          <input
            type="text"
            value={subtext}
            onChange={(e) => onChangeSubtext(e.target.value)}
            placeholder="e.g. Key Takeaway · Video Bible Section 2"
            style={{
              width: "100%",
              padding: "8px 11px",
              fontSize: "12px",
              borderRadius: "8px",
              background: "var(--sb-bg)",
              border: "1px solid var(--sb-border)",
              color: "var(--sb-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--sb-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--sb-border)")}
          />
        </div>

        {/* Accent Color Swatches */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "10.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--sb-text-muted)",
              marginBottom: "6px",
            }}
          >
            Card Accent Color
          </label>
          <div className="flex items-center gap-2">
            {colorPresets.map((c) => {
              const isSelected = accentColor.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChangeAccentColor(c)}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: c,
                    border: `2px solid ${isSelected ? "var(--sb-text-primary)" : "transparent"}`,
                    boxShadow: isSelected ? `0 0 8px ${c}` : "none",
                    cursor: "pointer",
                    transform: isSelected ? "scale(1.15)" : "scale(1)",
                    transition: "all 0.15s ease",
                  }}
                  title={`Select color: ${c}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
