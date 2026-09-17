import React, { useState, useEffect } from "react";
import type { Project, CanvasSettings } from "../../../types/project";
import { api } from "../../../services/api";
import { Monitor, Smartphone, Square, Check, Sparkles } from "lucide-react";

interface CanvasSettingsPanelProps {
  project: Project;
  onProjectUpdated: (project: Project) => void;
}

const CANVAS_PRESETS = [
  {
    aspect_ratio: "9:16",
    resolution: "1080x1920",
    label: "Vertical 9:16",
    desc: "TikTok, Shorts, IG Reels",
    icon: Smartphone,
  },
  {
    aspect_ratio: "16:9",
    resolution: "1920x1080",
    label: "Landscape 16:9",
    desc: "YouTube, Cinema, Desktop",
    icon: Monitor,
  },
  {
    aspect_ratio: "1:1",
    resolution: "1080x1080",
    label: "Square 1:1",
    desc: "Instagram Feed, Square Video",
    icon: Square,
  },
];

const CanvasSettingsPanelComponent: React.FC<CanvasSettingsPanelProps> = ({
  project,
  onProjectUpdated,
}) => {
  const current: CanvasSettings = project.canvas_settings || {
    aspect_ratio: "9:16",
    resolution: "1080x1920",
    fps: 30,
  };

  const [settings, setSettings] = useState<CanvasSettings>(current);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (project.canvas_settings) {
      setSettings(project.canvas_settings);
    }
  }, [project.canvas_settings]);

  const handleSelectPreset = async (aspect: string, res: string) => {
    const updated: CanvasSettings = {
      ...settings,
      aspect_ratio: aspect,
      resolution: res,
      fps: 30,
    };
    setSettings(updated);
    onProjectUpdated({ ...project, canvas_settings: updated });
    setIsSaving(true);
    try {
      const resProject = await api.updateProjectSettings(project.id, {
        canvas_settings: updated,
      });
      onProjectUpdated(resProject);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1800);
    } catch (err: any) {
      console.error("Failed to save canvas settings:", err);
      setSettings(current);
      onProjectUpdated(project);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMotionPreset = async (preset: "none" | "ken_burns") => {
    const updated: CanvasSettings = {
      ...settings,
      motion_preset: preset,
    };
    setSettings(updated);
    onProjectUpdated({ ...project, canvas_settings: updated });
    setIsSaving(true);
    try {
      const resProject = await api.updateProjectSettings(project.id, {
        canvas_settings: updated,
      });
      onProjectUpdated(resProject);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1800);
    } catch (err: any) {
      console.error("Failed to save motion preset:", err);
      setSettings(current);
      onProjectUpdated(project);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="canvas-settings-panel" className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Monitor size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Canvas & Export Resolution
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
              Determines the target video framing and FFmpeg rendering dimensions
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
        </div>
      </div>

      {/* Aspect Ratio Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
        {CANVAS_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected =
            settings.aspect_ratio === preset.aspect_ratio &&
            settings.resolution === preset.resolution;

          return (
            <div
              key={preset.resolution}
              id={`canvas-preset-${preset.aspect_ratio.replace(":", "-")}`}
              onClick={() => handleSelectPreset(preset.aspect_ratio, preset.resolution)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "16px",
                borderRadius: "10px",
                border: isSelected
                  ? "2px solid var(--primary)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: isSelected
                  ? "rgba(99, 102, 241, 0.12)"
                  : "rgba(255,255,255,0.02)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: isSelected ? "var(--primary)" : "rgba(255,255,255,0.05)",
                    color: isSelected ? "#fff" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} />
                </div>
                {isSelected && (
                  <span className="badge badge-success text-[10px]">Active</span>
                )}
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: isSelected ? "var(--primary)" : "var(--text-primary)" }}>
                  {preset.label}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {preset.desc}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {preset.resolution}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scene Motion — Ken Burns Setting */}
      <div
        id="canvas-ken-burns-card"
        style={{
          background: settings.motion_preset === "ken_burns"
            ? "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)"
            : "var(--bg-card-subtle)",
          border: settings.motion_preset === "ken_burns"
            ? "1px solid rgba(99,102,241,0.45)"
            : "1px solid var(--border-subtle)",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: settings.motion_preset === "ken_burns"
                ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                : "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: settings.motion_preset === "ken_burns" ? "#fff" : "var(--text-muted)",
              boxShadow: settings.motion_preset === "ken_burns" ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Ken Burns Scene Motion</span>
              {settings.motion_preset === "ken_burns" && (
                <span className="badge badge-success text-[10px]">Active in Stage 4</span>
              )}
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Subtle zoom &amp; pan on each scene for a cinematic feel (Live preview active in Stage 4 player)
            </div>
          </div>
        </div>

        <button
          id="canvas-kb-toggle"
          type="button"
          onClick={() => handleToggleMotionPreset(settings.motion_preset === "ken_burns" ? "none" : "ken_burns")}
          aria-pressed={settings.motion_preset === "ken_burns"}
          aria-label="Toggle Ken Burns scene motion"
          style={{
            flexShrink: 0,
            width: "52px",
            height: "28px",
            borderRadius: "14px",
            border: "none",
            cursor: "pointer",
            background: settings.motion_preset === "ken_burns"
              ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
              : "var(--border-strong, #CBD5E1)",
            position: "relative",
            transition: "background 0.25s ease",
            boxShadow: settings.motion_preset === "ken_burns" ? "0 0 12px rgba(99,102,241,0.45)" : "none",
            padding: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "3px",
              left: settings.motion_preset === "ken_burns" ? "27px" : "3px",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          />
        </button>
      </div>

      {/* Details Bar */}
      <div
        id="canvas-details-bar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Target Aspect: </span>
            <strong style={{ color: "var(--text-primary)" }}>{settings.aspect_ratio}</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Dimensions: </span>
            <strong style={{ color: "var(--text-primary)" }}>{settings.resolution}</strong>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="badge badge-info text-[10px]">
            H.264 High Profile
          </span>
          <span className="badge text-[10px]" style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
            30 FPS Constant
          </span>
        </div>
      </div>
    </div>
  );
};

export const CanvasSettingsPanel = React.memo(
  CanvasSettingsPanelComponent,
  (prev, next) =>
    prev.project.id === next.project.id &&
    JSON.stringify(prev.project.canvas_settings) ===
      JSON.stringify(next.project.canvas_settings)
);

