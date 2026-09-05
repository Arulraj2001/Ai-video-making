import React, { useState, useEffect, useRef } from "react";
import type { Project, AudioSettings } from "../../../types/project";
import { api } from "../../../services/api";
import { Volume2, VolumeX, Music, Mic, Upload, Trash2, Check } from "lucide-react";

interface AudioSettingsPanelProps {
  project: Project;
  onProjectUpdated: (project: Project) => void;
}

export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({
  project,
  onProjectUpdated,
}) => {
  const current: AudioSettings = project.audio_settings || {
    narration_volume: 1.0,
    narration_muted: false,
    music_volume: 0.25,
    music_fade_in: 1.0,
    music_fade_out: 2.0,
    music_muted: false,
  };

  const [settings, setSettings] = useState<AudioSettings>(current);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project.audio_settings) {
      setSettings(project.audio_settings);
    }
  }, [project.audio_settings]);

  const saveSettings = async (newSettings: AudioSettings) => {
    setSettings(newSettings);
    setIsSaving(true);
    try {
      const updated = await api.updateProjectSettings(project.id, {
        audio_settings: newSettings,
      });
      onProjectUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1800);
    } catch (err: any) {
      console.error("Failed to save audio settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = <K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    saveSettings(updated);
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMusic(true);
    try {
      const updated = await api.uploadBackgroundMusic(project.id, file);
      onProjectUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1800);
    } catch (err: any) {
      alert(err.message || "Failed to upload background music");
    } finally {
      setIsUploadingMusic(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMusic = async () => {
    if (!window.confirm("Remove background music from project?")) return;
    setIsSaving(true);
    try {
      const updated = await api.deleteBackgroundMusic(project.id);
      onProjectUpdated(updated);
    } catch (err: any) {
      alert(err.message || "Failed to delete background music");
    } finally {
      setIsSaving(false);
    }
  };

  const bgm = project.audio_settings?.music_file;

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Music size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Audio Track Mixing & Music
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
              Independent narration and background music mixing with auto-loop & fade
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

      {/* Track 1: Voice / Narration Track */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "10px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(99, 102, 241, 0.2)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mic size={14} />
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Narration / Voiceover Track
            </span>
            {project.audio_file ? (
              <span className="badge badge-success text-[10px]">
                {project.audio_file.filename} ({(project.audio_file.file_size / 1024 / 1024).toFixed(1)} MB)
              </span>
            ) : (
              <span className="badge text-[10px]" style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>
                No voiceover uploaded
              </span>
            )}
          </div>

          <button
            onClick={() => handleChange("narration_muted", !settings.narration_muted)}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              border: settings.narration_muted ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.1)",
              background: settings.narration_muted ? "rgba(239, 68, 68, 0.2)" : "rgba(255,255,255,0.05)",
              color: settings.narration_muted ? "#ef4444" : "var(--text-secondary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
            }}
          >
            {settings.narration_muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span>{settings.narration_muted ? "Muted" : "Mute"}</span>
          </button>
        </div>

        {/* Narration Volume Slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Narration Volume</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary)" }}>
              {settings.narration_muted ? "0%" : `${Math.round(settings.narration_volume * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={settings.narration_muted ? 0 : settings.narration_volume}
            onChange={(e) => {
              if (settings.narration_muted) handleChange("narration_muted", false);
              handleChange("narration_volume", Number(e.target.value));
            }}
            style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Track 2: Background Music (BGM) */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "10px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Music size={14} />
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Background Music (BGM)
            </span>
            {bgm && (
              <span className="badge badge-info text-[10px]">
                {bgm.filename}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {bgm && (
              <>
                <button
                  onClick={() => handleChange("music_muted", !settings.music_muted)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: settings.music_muted ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.1)",
                    background: settings.music_muted ? "rgba(239, 68, 68, 0.2)" : "rgba(255,255,255,0.05)",
                    color: settings.music_muted ? "#ef4444" : "var(--text-secondary)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                  }}
                >
                  {settings.music_muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  <span>{settings.music_muted ? "Muted" : "Mute"}</span>
                </button>

                <button
                  onClick={handleDeleteMusic}
                  title="Remove Background Music"
                  style={{
                    padding: "5px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingMusic}
              className="btn-secondary"
              style={{ padding: "5px 12px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Upload size={12} />
              <span>{isUploadingMusic ? "Uploading..." : bgm ? "Replace Music" : "Upload Music"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp3,audio/mpeg,audio/wav,audio/aac,audio/m4a"
              style={{ display: "none" }}
              onChange={handleMusicUpload}
            />
          </div>
        </div>

        {/* BGM Volume & Fade Controls */}
        {bgm ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            {/* Music Volume */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>BGM Volume</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#c084fc" }}>
                  {settings.music_muted ? "0%" : `${Math.round(settings.music_volume * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={settings.music_muted ? 0 : settings.music_volume}
                onChange={(e) => {
                  if (settings.music_muted) handleChange("music_muted", false);
                  handleChange("music_volume", Number(e.target.value));
                }}
                style={{ width: "100%", accentColor: "#a855f7", cursor: "pointer" }}
              />
            </div>

            {/* Fade In */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Music Fade In</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {settings.music_fade_in.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.2}
                value={settings.music_fade_in}
                onChange={(e) => handleChange("music_fade_in", Number(e.target.value))}
                style={{ width: "100%", accentColor: "#a855f7", cursor: "pointer" }}
              />
            </div>

            {/* Fade Out */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Music Fade Out</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {settings.music_fade_out.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.2}
                value={settings.music_fade_out}
                onChange={(e) => handleChange("music_fade_out", Number(e.target.value))}
                style={{ width: "100%", accentColor: "#a855f7", cursor: "pointer" }}
              />
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px dashed rgba(255,255,255,0.15)",
              textAlign: "center",
              cursor: "pointer",
              background: "rgba(255,255,255,0.01)",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              No background music uploaded yet. Click to upload an MP3 or WAV track to play under voice narration.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
