import React, { useState, useEffect } from "react";
import type { Project, CaptionSettings } from "../../../types/project";
import { api } from "../../../services/api";
import { Check, Type, Eye, ShieldCheck } from "lucide-react";

interface CaptionsSettingsPanelProps {
  project: Project;
  onProjectUpdated: (project: Project) => void;
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Modern Sans)" },
  { value: "Roboto", label: "Roboto (Clean Standard)" },
  { value: "Outfit", label: "Outfit (Geometric Display)" },
  { value: "Montserrat", label: "Montserrat (Punchy Sans)" },
  { value: "Oswald", label: "Oswald (Tall & Condensed)" },
  { value: "Cinzel", label: "Cinzel (Cinematic Serif)" },
  { value: "Arial", label: "Arial (Universal)" },
];

const COLOR_SWATCHES = [
  { label: "White", value: "#FFFFFF" },
  { label: "Cyber Yellow", value: "#FFE600" },
  { label: "Electric Cyan", value: "#00E5FF" },
  { label: "Neon Lime", value: "#39FF14" },
  { label: "Vibrant Coral", value: "#FF5252" },
  { label: "Hot Pink", value: "#FF4081" },
];

const CaptionsSettingsPanelComponent: React.FC<CaptionsSettingsPanelProps> = ({
  project,
  onProjectUpdated,
}) => {
  const current: CaptionSettings = project.caption_settings || {
    enabled: true,
    font_family: "Inter",
    font_size: 42,
    position: "bottom",
    alignment: "center",
    background: "semi-transparent",
    outline_shadow: "subtle",
    safe_area: true,
    color: "#FFFFFF",
  };

  const [settings, setSettings] = useState<CaptionSettings>(current);
  const [localFontSize, setLocalFontSize] = useState<number>(current.font_size || 42);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (project.caption_settings) {
      setSettings(project.caption_settings);
      setLocalFontSize(project.caption_settings.font_size || 42);
    }
  }, [project.caption_settings]);

  const saveSettings = async (newSettings: CaptionSettings) => {
    setSettings(newSettings);
    setIsSaving(true);
    try {
      const updated = await api.updateProjectSettings(project.id, {
        caption_settings: newSettings,
      });
      onProjectUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1800);
    } catch (err: any) {
      console.error("Failed to save caption settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = <K extends keyof CaptionSettings>(
    key: K,
    value: CaptionSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    saveSettings(updated);
  };

  return (
    <div id="captions-settings-panel" className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header & Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Type size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Caption & Subtitle Styling
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
              Burned into exported MP4 with customizable fonts, colors, and safe areas
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isSaving && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Saving...</span>}
          {saveSuccess && (
            <span style={{ fontSize: "0.75rem", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
              <Check size={14} /> Saved
            </span>
          )}
          <label htmlFor="captions-enabled-toggle" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: settings.enabled ? "var(--primary)" : "var(--text-muted)" }}>
            <input
              id="captions-enabled-toggle"
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleChange("enabled", e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
            />
            <span>{settings.enabled ? "Captions Enabled" : "Captions Disabled"}</span>
          </label>
        </div>
      </div>

      {/* Real-time Subtitle Visual Preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <Eye size={13} />
          <span>Live Styling Preview</span>
        </div>
        <div
          id="captions-live-preview"
          style={{
            position: "relative",
            width: "100%",
            height: "110px",
            background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
            borderRadius: "10px",
            border: "1px dashed rgba(255,255,255,0.15)",
            overflow: "hidden",
            display: "flex",
            alignItems:
              settings.position === "top"
                ? "flex-start"
                : settings.position === "center"
                ? "center"
                : "flex-end",
            justifyContent:
              settings.alignment === "left"
                ? "flex-start"
                : settings.alignment === "right"
                ? "flex-end"
                : "center",
            padding: settings.safe_area ? "16px 20px" : "8px 12px",
          }}
        >
          {settings.enabled ? (
            <div
              style={{
                fontFamily: settings.font_family,
                fontSize: `${Math.max(12, Math.min(22, Math.round(localFontSize / 2.6)))}px`,
                color: settings.color,
                fontWeight: 700,
                textAlign: settings.alignment as any,
                padding: settings.background === "none" ? "2px 6px" : "6px 14px",
                borderRadius: "6px",
                background:
                  settings.background === "solid"
                    ? "rgba(0, 0, 0, 0.95)"
                    : settings.background === "semi-transparent"
                    ? "rgba(0, 0, 0, 0.65)"
                    : "transparent",
                backdropFilter: settings.background === "none" ? "none" : "blur(4px)",
                textShadow:
                  settings.outline_shadow === "strong"
                    ? "0 2px 8px #000, 0 0 4px #000"
                    : settings.outline_shadow === "subtle"
                    ? "0 1px 4px rgba(0,0,0,0.8)"
                    : "none",
                maxWidth: "90%",
                lineHeight: 1.3,
                transition: "all 0.15s ease",
              }}
            >
              "The rain-slicked pavement reflected the neon signage."
            </div>
          ) : (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", margin: "auto" }}>
              Captions currently disabled for export
            </span>
          )}
        </div>
      </div>

      {/* Control Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {/* Font Family */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="captions-font-family-select" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Font Family
          </label>
          <select
            id="captions-font-family-select"
            value={settings.font_family}
            onChange={(e) => handleChange("font_family", e.target.value)}
            disabled={!settings.enabled}
            className="select-custom"
            style={{ fontSize: "0.85rem", padding: "8px 12px" }}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor="captions-font-size-slider" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Font Size
            </label>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary)" }}>
              {localFontSize} pt
            </span>
          </div>
          <input
            id="captions-font-size-slider"
            type="range"
            min={24}
            max={72}
            step={2}
            value={localFontSize}
            onChange={(e) => setLocalFontSize(Number(e.target.value))}
            onPointerUp={() => handleChange("font_size", localFontSize)}
            onKeyUp={() => handleChange("font_size", localFontSize)}
            disabled={!settings.enabled}
            style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
          />
        </div>

        {/* Position */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Vertical Position
          </label>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["bottom", "center", "top"] as const).map((pos) => (
              <button
                key={pos}
                id={`captions-pos-${pos}`}
                onClick={() => handleChange("position", pos)}
                disabled={!settings.enabled}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  borderRadius: "6px",
                  border: settings.position === pos ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.1)",
                  background: settings.position === pos ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.04)",
                  color: settings.position === pos ? "var(--primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Text Alignment
          </label>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["left", "center", "right"] as const).map((align) => (
              <button
                key={align}
                id={`captions-align-${align}`}
                onClick={() => handleChange("alignment", align)}
                disabled={!settings.enabled}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  borderRadius: "6px",
                  border: settings.alignment === align ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.1)",
                  background: settings.alignment === align ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.04)",
                  color: settings.alignment === align ? "var(--primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {align}
              </button>
            ))}
          </div>
        </div>

        {/* Background Style */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Background Box
          </label>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["semi-transparent", "solid", "none"] as const).map((bg) => (
              <button
                key={bg}
                id={`captions-bg-${bg}`}
                onClick={() => handleChange("background", bg)}
                disabled={!settings.enabled}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: settings.background === bg ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.1)",
                  background: settings.background === bg ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.04)",
                  color: settings.background === bg ? "var(--primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {bg === "semi-transparent" ? "Translucent" : bg === "solid" ? "Solid" : "None"}
              </button>
            ))}
          </div>
        </div>

        {/* Outline / Shadow */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Outline / Shadow
          </label>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["none", "subtle", "strong"] as const).map((sh) => (
              <button
                key={sh}
                id={`captions-shadow-${sh}`}
                onClick={() => handleChange("outline_shadow", sh)}
                disabled={!settings.enabled}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  borderRadius: "6px",
                  border: settings.outline_shadow === sh ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.1)",
                  background: settings.outline_shadow === sh ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.04)",
                  color: settings.outline_shadow === sh ? "var(--primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {sh}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color Swatches & Safe Area Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Color swatches */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Color:</span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c.value}
                id={`captions-color-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => handleChange("color", c.value)}
                disabled={!settings.enabled}
                title={c.label}
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: c.value,
                  border: settings.color.toUpperCase() === c.value.toUpperCase() ? "2px solid #fff" : "1px solid rgba(0,0,0,0.5)",
                  boxShadow: settings.color.toUpperCase() === c.value.toUpperCase() ? "0 0 6px var(--primary)" : "none",
                  cursor: "pointer",
                }}
              />
            ))}
            <input
              id="captions-color-picker"
              type="color"
              value={settings.color}
              onChange={(e) => handleChange("color", e.target.value)}
              disabled={!settings.enabled}
              style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", padding: 0 }}
              title="Custom Hex Color"
            />
          </div>
        </div>

        {/* Safe-area positioning toggle */}
        <label htmlFor="captions-safe-area-toggle" style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          <ShieldCheck size={16} color={settings.safe_area ? "#10b981" : "var(--text-muted)"} />
          <input
            id="captions-safe-area-toggle"
            type="checkbox"
            checked={settings.safe_area}
            onChange={(e) => handleChange("safe_area", e.target.checked)}
            disabled={!settings.enabled}
            style={{ width: "14px", height: "14px", accentColor: "var(--primary)", cursor: "pointer" }}
          />
          <span>Safe-Area Margin Guard (8%)</span>
        </label>
      </div>
    </div>
  );
};

export const CaptionsSettingsPanel = React.memo(
  CaptionsSettingsPanelComponent,
  (prev, next) =>
    prev.project.id === next.project.id &&
    JSON.stringify(prev.project.caption_settings) ===
      JSON.stringify(next.project.caption_settings)
);

