import React, { useState, useEffect, useRef } from "react";
import type { Project, AudioSettings } from "../../../types/project";
import { api } from "../../../services/api";
import { Volume2, VolumeX, Music, Mic, Upload, Trash2, Check, Radio } from "lucide-react";

interface AudioSettingsPanelProps {
  project: Project;
  onProjectUpdated: (project: Project) => void;
}

const AudioSettingsPanelComponent: React.FC<AudioSettingsPanelProps> = ({
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
    ducking_enabled: true,
  };

  const [settings, setSettings] = useState<AudioSettings>(current);
  const [localNarrationVol, setLocalNarrationVol] = useState<number>(current.narration_volume ?? 1.0);
  const [localMusicVol, setLocalMusicVol] = useState<number>(current.music_volume ?? 0.25);
  const [localMusicFadeIn, setLocalMusicFadeIn] = useState<number>(current.music_fade_in ?? 1.0);
  const [localMusicFadeOut, setLocalMusicFadeOut] = useState<number>(current.music_fade_out ?? 2.0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isDeletingVoice, setIsDeletingVoice] = useState(false);
  const [isDraggingVoice, setIsDraggingVoice] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [isDeletingMusic, setIsDeletingMusic] = useState(false);
  const [isDraggingMusic, setIsDraggingMusic] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const settingsRef = useRef<AudioSettings>(current);
  const saveRequestRef = useRef(0);

  const voiceFileInputRef = useRef<HTMLInputElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project.audio_settings) {
      const merged = {
        ducking_enabled: true,
        ...project.audio_settings,
      };
      setSettings(merged);
      setLocalNarrationVol(merged.narration_volume ?? 1.0);
      setLocalMusicVol(merged.music_volume ?? 0.25);
      setLocalMusicFadeIn(merged.music_fade_in ?? 1.0);
      setLocalMusicFadeOut(merged.music_fade_out ?? 2.0);
      settingsRef.current = merged;
    }
  }, [project.audio_settings]);

  const saveSettings = async (newSettings: AudioSettings) => {
    const requestId = ++saveRequestRef.current;
    setSettings(newSettings);
    settingsRef.current = newSettings;
    onProjectUpdated({ ...project, audio_settings: newSettings });
    setIsSaving(true);
    try {
      const updated = await api.updateProjectSettings(project.id, {
        audio_settings: newSettings,
      });
      if (requestId === saveRequestRef.current) onProjectUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1800);
    } catch (err: any) {
      console.error("Failed to save audio settings:", err);
      if (requestId === saveRequestRef.current) {
        settingsRef.current = current;
        setSettings(current);
        onProjectUpdated(project);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = <K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ) => {
    const updated = { ...settingsRef.current, [key]: value };
    saveSettings(updated);
  };

  // Voiceover Upload
  const handleVoiceFile = async (file: File) => {
    if (!file) return;
    setIsUploadingVoice(true);
    try {
      const updated = await api.uploadAudio(project.id, file);
      onProjectUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1800);
    } catch (err: any) {
      alert(err.message || "Failed to upload voiceover audio");
    } finally {
      setIsUploadingVoice(false);
      if (voiceFileInputRef.current) voiceFileInputRef.current.value = "";
    }
  };

  const handleVoiceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVoiceFile(file);
  };

  const handleVoiceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVoice(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("audio/") || file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i))) {
      handleVoiceFile(file);
    }
  };

  const handleDeleteVoice = async () => {
    if (!window.confirm("Remove narration / voiceover track from this project?")) return;
    setIsDeletingVoice(true);
    try {
      const updated = await api.deleteAudio(project.id);
      onProjectUpdated(updated);
    } catch (err: any) {
      alert(err.message || "Failed to delete voiceover audio");
    } finally {
      setIsDeletingVoice(false);
    }
  };

  // Background Music Upload
  const handleMusicFile = async (file: File) => {
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
      if (musicFileInputRef.current) musicFileInputRef.current.value = "";
    }
  };

  const handleMusicInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleMusicFile(file);
  };

  const handleMusicDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMusic(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("audio/") || file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i))) {
      handleMusicFile(file);
    }
  };

  const handleDeleteMusic = async () => {
    if (!window.confirm("Remove background music from project?")) return;
    setIsDeletingMusic(true);
    try {
      const updated = await api.deleteBackgroundMusic(project.id);
      onProjectUpdated(updated);
    } catch (err: any) {
      alert(err.message || "Failed to delete background music");
    } finally {
      setIsDeletingMusic(false);
    }
  };

  const bgm = project.audio_settings?.music_file;

  return (
    <div id="audio-settings-panel" className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
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
              Independent narration, background music, auto-ducking & master volumes
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

      {/* Hidden file inputs */}
      <input
        id="narration-file-input"
        ref={voiceFileInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/aac,audio/m4a,audio/ogg"
        style={{ display: "none" }}
        onChange={handleVoiceInputChange}
      />
      <input
        id="bgm-file-input"
        ref={musicFileInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/aac,audio/m4a,audio/ogg"
        style={{ display: "none" }}
        onChange={handleMusicInputChange}
      />

      {/* Track 1: Voice / Narration Track */}
      <div
        id="narration-track-section"
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(99, 102, 241, 0.2)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mic size={14} />
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Narration / Voiceover Track
            </span>
            {project.audio_file ? (
              <span className="badge badge-success text-[10px]" title={project.audio_file.filename}>
                {project.audio_file.filename.length > 24 ? project.audio_file.filename.slice(0, 21) + "..." : project.audio_file.filename} ({(project.audio_file.file_size / 1024 / 1024).toFixed(1)} MB)
              </span>
            ) : (
              <span className="badge text-[10px]" style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>
                No voiceover uploaded
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {project.audio_file && (
              <>
                <button
                  id="narration-mute-btn"
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

                <button
                  id="narration-delete-btn"
                  onClick={handleDeleteVoice}
                  disabled={isDeletingVoice}
                  title="Remove Voiceover"
                  style={{
                    padding: "5px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}

            <button
              id="narration-upload-btn"
              onClick={() => voiceFileInputRef.current?.click()}
              disabled={isUploadingVoice}
              className="btn-secondary"
              style={{ padding: "5px 12px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Upload size={12} />
              <span>{isUploadingVoice ? "Uploading..." : project.audio_file ? "Replace Audio" : "Upload Voiceover"}</span>
            </button>
          </div>
        </div>

        {/* Voiceover Volume Slider or Drag & Drop Zone */}
        {project.audio_file ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="narration-volume-slider" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Narration Volume</label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--primary)" }}>
                {settings.narration_muted ? "0%" : `${Math.round(localNarrationVol * 100)}%`}
              </span>
            </div>
            <input
              id="narration-volume-slider"
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={settings.narration_muted ? 0 : localNarrationVol}
              onChange={(e) => {
                if (settings.narration_muted) handleChange("narration_muted", false);
                setLocalNarrationVol(Number(e.target.value));
              }}
              onPointerUp={() => handleChange("narration_volume", localNarrationVol)}
              onKeyUp={() => handleChange("narration_volume", localNarrationVol)}
              style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
            />
          </div>
        ) : (
          <div
            id="narration-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingVoice(true);
            }}
            onDragLeave={() => setIsDraggingVoice(false)}
            onDrop={handleVoiceDrop}
            onClick={() => voiceFileInputRef.current?.click()}
            style={{
              padding: "18px",
              borderRadius: "8px",
              border: `1px dashed ${isDraggingVoice ? "var(--primary)" : "rgba(255,255,255,0.15)"}`,
              textAlign: "center",
              cursor: "pointer",
              background: isDraggingVoice ? "rgba(99, 102, 241, 0.08)" : "rgba(255,255,255,0.01)",
              transition: "all 0.15s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Upload size={18} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Drag & drop voiceover audio file (.mp3, .wav, .m4a), or click to upload
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Voiceover is timed across your scenes for seamless playback and export
            </span>
          </div>
        )}
      </div>

      {/* Track 2: Background Music (BGM) */}
      <div
        id="bgm-track-section"
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Music size={14} />
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Background Music (BGM)
            </span>
            {bgm ? (
              <span className="badge badge-info text-[10px]" title={bgm.filename}>
                {bgm.filename.length > 24 ? bgm.filename.slice(0, 21) + "..." : bgm.filename}
              </span>
            ) : (
              <span className="badge text-[10px]" style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>
                No BGM active
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {bgm && (
              <>
                <button
                  id="music-mute-btn"
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
                  id="music-delete-btn"
                  onClick={handleDeleteMusic}
                  disabled={isDeletingMusic}
                  title="Remove Background Music"
                  style={{
                    padding: "5px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}

            <button
              id="music-upload-btn"
              onClick={() => musicFileInputRef.current?.click()}
              disabled={isUploadingMusic}
              className="btn-secondary"
              style={{ padding: "5px 12px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Upload size={12} />
              <span>{isUploadingMusic ? "Uploading..." : bgm ? "Replace Music" : "Upload Music"}</span>
            </button>
          </div>
        </div>

        {/* BGM Volume & Fade Controls */}
        {bgm ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              {/* Music Volume */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="music-volume-slider" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>BGM Master Volume</label>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#c084fc" }}>
                    {settings.music_muted ? "0%" : `${Math.round(localMusicVol * 100)}%`}
                  </span>
                </div>
                <input
                  id="music-volume-slider"
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={settings.music_muted ? 0 : localMusicVol}
                  onChange={(e) => {
                    if (settings.music_muted) handleChange("music_muted", false);
                    setLocalMusicVol(Number(e.target.value));
                  }}
                  onPointerUp={() => handleChange("music_volume", localMusicVol)}
                  onKeyUp={() => handleChange("music_volume", localMusicVol)}
                  style={{ width: "100%", accentColor: "#a855f7", cursor: "pointer" }}
                />
              </div>

              {/* Fade In */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="music-fade-in-slider" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Music Fade In</label>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {localMusicFadeIn.toFixed(1)}s
                  </span>
                </div>
                <input
                  id="music-fade-in-slider"
                  type="range"
                  min={0}
                  max={5}
                  step={0.2}
                  value={localMusicFadeIn}
                  onChange={(e) => setLocalMusicFadeIn(Number(e.target.value))}
                  onPointerUp={() => handleChange("music_fade_in", localMusicFadeIn)}
                  onKeyUp={() => handleChange("music_fade_in", localMusicFadeIn)}
                  style={{ width: "100%", accentColor: "#a855f7", cursor: "pointer" }}
                />
              </div>

              {/* Fade Out */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="music-fade-out-slider" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Music Fade Out</label>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {localMusicFadeOut.toFixed(1)}s
                  </span>
                </div>
                <input
                  id="music-fade-out-slider"
                  type="range"
                  min={0}
                  max={5}
                  step={0.2}
                  value={localMusicFadeOut}
                  onChange={(e) => setLocalMusicFadeOut(Number(e.target.value))}
                  onPointerUp={() => handleChange("music_fade_out", localMusicFadeOut)}
                  onKeyUp={() => handleChange("music_fade_out", localMusicFadeOut)}
                  style={{ width: "100%", accentColor: "#a855f7", cursor: "pointer" }}
                />
              </div>
            </div>

            {/* Auto-Ducking Switch Card */}
            <div
              style={{
                background: "rgba(168, 85, 247, 0.06)",
                border: "1px solid rgba(168, 85, 247, 0.2)",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Radio size={14} style={{ color: "#c084fc" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Auto-Duck Music Under Voiceover
                  </span>
                  <span className="badge text-[10px]" style={{ background: "rgba(168, 85, 247, 0.2)", color: "#e9d5ff" }}>
                    Broadcast Quality
                  </span>
                </div>
                <span style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
                  Smoothly attenuates background music by ~70% when narration speaks, and dynamically recovers during speech pauses. Applied in preview & exported MP4.
                </span>
              </div>

              <label htmlFor="audio-ducking-toggle" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  id="audio-ducking-toggle"
                  type="checkbox"
                  checked={settings.ducking_enabled !== false}
                  onChange={(e) => handleChange("ducking_enabled", e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#a855f7",
                    cursor: "pointer",
                  }}
                />
              </label>
            </div>
          </div>
        ) : (
          <div
            id="music-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingMusic(true);
            }}
            onDragLeave={() => setIsDraggingMusic(false)}
            onDrop={handleMusicDrop}
            onClick={() => musicFileInputRef.current?.click()}
            style={{
              padding: "18px",
              borderRadius: "8px",
              border: `1px dashed ${isDraggingMusic ? "#a855f7" : "rgba(255,255,255,0.15)"}`,
              textAlign: "center",
              cursor: "pointer",
              background: isDraggingMusic ? "rgba(168, 85, 247, 0.08)" : "rgba(255,255,255,0.01)",
              transition: "all 0.15s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Music size={18} style={{ color: "#c084fc" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              No background music uploaded yet. Drag & drop an MP3/WAV here, or click to browse.
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Music auto-loops and seamlessly ducks underneath voiceover narration
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const AudioSettingsPanel = React.memo(
  AudioSettingsPanelComponent,
  (prev, next) =>
    prev.project.id === next.project.id &&
    JSON.stringify(prev.project.audio_settings) ===
      JSON.stringify(next.project.audio_settings) &&
    prev.project.audio_file?.filename === next.project.audio_file?.filename
);


