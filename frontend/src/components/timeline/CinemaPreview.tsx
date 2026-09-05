import React, { useRef, useEffect, useState } from "react";
import type { Project, Scene } from "../../types/project";
import { api } from "../../services/api";

interface CinemaPreviewProps {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  totalDuration: number;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onSelectScene?: (sceneId: string) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const CinemaPreview: React.FC<CinemaPreviewProps> = ({
  project,
  currentTime,
  isPlaying,
  totalDuration,
  onSeek,
  onTogglePlay,
  onSelectScene,
  audioRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Find currently active scene according to authoritative timestamps
  const scenes = project.scenes || [];
  const activeSceneIndex = scenes.findIndex(
    (s) => currentTime >= s.start && currentTime < s.end
  );
  const activeScene: Scene | undefined =
    activeSceneIndex !== -1
      ? scenes[activeSceneIndex]
      : scenes.length > 0 && currentTime >= scenes[scenes.length - 1].end
      ? scenes[scenes.length - 1]
      : scenes[0];

  // Check if upcoming scene transition should crossfade
  const nextScene: Scene | undefined =
    activeSceneIndex !== -1 && activeSceneIndex < scenes.length - 1
      ? scenes[activeSceneIndex + 1]
      : undefined;

  const transitionDuration = activeScene?.transition_duration || 0.5;
  const isTransitioning =
    activeScene &&
    activeScene.transition &&
    activeScene.transition !== "none" &&
    nextScene &&
    currentTime >= activeScene.end - transitionDuration;

  // Format time (00:04.2)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}.${tenths}`;
  };

  // Ref for background music playback
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmUrl = project.audio_settings?.music_file?.url
    ? api.getMediaUrl(project.audio_settings.music_file.url)
    : null;

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Failed to enter fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Failed to exit fullscreen:", err);
      });
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Update narration audio volume
  useEffect(() => {
    if (audioRef.current) {
      const narMuted = project.audio_settings?.narration_muted || isMuted;
      const narVol = project.audio_settings?.narration_volume ?? 1.0;
      audioRef.current.volume = narMuted ? 0 : Math.max(0, Math.min(1, volume * narVol));
    }
  }, [volume, isMuted, audioRef, project.audio_settings?.narration_volume, project.audio_settings?.narration_muted]);

  // Update BGM audio volume and synchronization
  useEffect(() => {
    if (bgmAudioRef.current) {
      const musicMuted = project.audio_settings?.music_muted || isMuted;
      const musicVol = project.audio_settings?.music_volume ?? 0.25;
      bgmAudioRef.current.volume = musicMuted ? 0 : Math.max(0, Math.min(1, volume * musicVol));
      if (isPlaying) {
        if (bgmAudioRef.current.paused) {
          bgmAudioRef.current.play().catch(() => {});
        }
      } else {
        bgmAudioRef.current.pause();
      }
    }
  }, [isPlaying, volume, isMuted, project.audio_settings?.music_volume, project.audio_settings?.music_muted]);

  // Sync BGM time when user seeks
  useEffect(() => {
    if (bgmAudioRef.current && Math.abs(bgmAudioRef.current.currentTime - currentTime) > 0.3) {
      bgmAudioRef.current.currentTime = currentTime % (bgmAudioRef.current.duration || 1000);
    }
  }, [currentTime]);

  // Calculate motion style timing
  const sceneProgress =
    activeScene && activeScene.duration > 0
      ? Math.max(0, Math.min(1, (currentTime - activeScene.start) / activeScene.duration))
      : 0;

  // Compute transform based on motion
  const getMotionTransform = (motion?: string, progress: number = 0) => {
    switch (motion) {
      case "slow zoom in":
        return `scale(${1 + progress * 0.18})`;
      case "slow zoom out":
        return `scale(${1.18 - progress * 0.18})`;
      case "pan left":
        return `scale(1.12) translateX(${(0.5 - progress) * 8}%)`;
      case "pan right":
        return `scale(1.12) translateX(${(progress - 0.5) * 8}%)`;
      case "pan up":
        return `scale(1.12) translateY(${(0.5 - progress) * 8}%)`;
      case "pan down":
        return `scale(1.12) translateY(${(progress - 0.5) * 8}%)`;
      default:
        return "scale(1)";
    }
  };

  const audioUrl = project.audio_file
    ? api.getMediaUrl(project.audio_file.url || `/media/${project.id}/audio/${project.audio_file.filename}`)
    : null;

  return (
    <div
      ref={containerRef}
      className="cinema-preview-container glass-panel"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#03060a",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Hidden Narration Audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          style={{ display: "none" }}
        />
      )}

      {/* Hidden BGM Audio element */}
      {bgmUrl && (
        <audio
          ref={bgmAudioRef}
          src={bgmUrl}
          loop
          preload="auto"
          style={{ display: "none" }}
        />
      )}

      {/* Main Dynamic Stage Enclosure */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "460px",
          overflow: "hidden",
          background: "#08080c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Canvas Screen */}
        <div
          style={{
            position: "relative",
            height: "100%",
            aspectRatio:
              project.canvas_settings?.aspect_ratio === "9:16"
                ? "9 / 16"
                : project.canvas_settings?.aspect_ratio === "1:1"
                ? "1 / 1"
                : "16 / 9",
            maxWidth: "100%",
            overflow: "hidden",
            background: "#000",
            boxShadow: "0 0 35px rgba(0,0,0,0.8)",
          }}
        >
          {/* Active Scene Image Stage */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {activeScene ? (
              activeScene.image_url ? (
                <img
                  key={activeScene.id}
                  src={api.getMediaUrl(activeScene.image_url)}
                  alt={activeScene.caption || "Scene image"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: (activeScene.image_fit || "cover") as any,
                    objectPosition: activeScene.image_position || "center",
                    transform: `${getMotionTransform(activeScene.motion, sceneProgress)} scale(${activeScene.image_zoom || 1.0})`,
                    transition: isPlaying ? "none" : "transform 0.2s ease-out",
                    willChange: "transform",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    color: "var(--text-muted)",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)",
                      fontSize: "24px",
                    }}
                  >
                    🎬
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                      {activeScene.image_status === "generating"
                        ? "Generating Scene Visual..."
                        : "No Image Generated Yet"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Scene ID: {activeScene.id} ({activeScene.start}s - {activeScene.end}s)
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No scenes on timeline
              </div>
            )}

            {/* Crossfade Transition Overlay (if active) */}
            {isTransitioning && nextScene?.image_url && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: (currentTime - (activeScene!.end - transitionDuration)) / transitionDuration,
                  pointerEvents: "none",
                  transition: "opacity 0.05s linear",
                }}
              >
                <img
                  src={api.getMediaUrl(nextScene.image_url)}
                  alt="Transition preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: (nextScene.image_fit || "cover") as any,
                    objectPosition: nextScene.image_position || "center",
                  }}
                />
              </div>
            )}

            {/* Fade to black Transition Overlay */}
            {isTransitioning && activeScene?.transition === "fade" && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "#000",
                  opacity:
                    Math.sin(
                      ((currentTime - (activeScene.end - transitionDuration)) /
                        transitionDuration) *
                        Math.PI
                    ) * 0.85,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Cinematic Subtitle Badge (Phase 8 Styling) */}
            {project.caption_settings?.enabled !== false && activeScene?.caption && (
              <div
                style={{
                  position: "absolute",
                  ...(project.caption_settings?.position === "top"
                    ? { top: project.caption_settings?.safe_area !== false ? "12%" : "4%" }
                    : project.caption_settings?.position === "center"
                    ? { top: "50%", transform: "translateY(-50%)" }
                    : { bottom: project.caption_settings?.safe_area !== false ? "12%" : "4%" }),
                  left: project.caption_settings?.safe_area !== false ? "8%" : "4%",
                  right: project.caption_settings?.safe_area !== false ? "8%" : "4%",
                  display: "flex",
                  justifyContent:
                    project.caption_settings?.alignment === "left"
                      ? "flex-start"
                      : project.caption_settings?.alignment === "right"
                      ? "flex-end"
                      : "center",
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: project.caption_settings?.font_family || "Inter",
                    fontSize: `${Math.max(12, Math.min(22, Math.round((project.caption_settings?.font_size || 42) / 2.6)))}px`,
                    color: project.caption_settings?.color || "#ffffff",
                    fontWeight: 700,
                    textAlign: (project.caption_settings?.alignment || "center") as any,
                    padding:
                      project.caption_settings?.background === "none"
                        ? "2px 6px"
                        : "6px 14px",
                    borderRadius: "8px",
                    background:
                      project.caption_settings?.background === "solid"
                        ? "rgba(0, 0, 0, 0.95)"
                        : project.caption_settings?.background === "semi-transparent"
                        ? "rgba(0, 0, 0, 0.65)"
                        : "transparent",
                    backdropFilter:
                      project.caption_settings?.background === "none"
                        ? "none"
                        : "blur(6px)",
                    border:
                      project.caption_settings?.background === "none"
                        ? "none"
                        : "1px solid rgba(255,255,255,0.12)",
                    textShadow:
                      project.caption_settings?.outline_shadow === "strong"
                        ? "0 2px 8px #000, 0 0 4px #000"
                        : project.caption_settings?.outline_shadow === "subtle"
                        ? "0 1px 4px rgba(0,0,0,0.8)"
                        : "none",
                    lineHeight: 1.35,
                    maxWidth: "92%",
                    boxShadow:
                      project.caption_settings?.background === "none"
                        ? "none"
                        : "0 4px 16px rgba(0,0,0,0.5)",
                  }}
                >
                  {activeScene.caption}
                </div>
              </div>
            )}
          </div>

          {/* Top HUD: Current Scene Details & Camera Motion Badge */}
          {activeScene && (
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "16px",
                right: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                zIndex: 25,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(0,0,0,0.65)",
                  backdropFilter: "blur(6px)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "0.78rem",
                }}
              >
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                  SCENE {activeSceneIndex !== -1 ? activeSceneIndex + 1 : 1}/{scenes.length}
                </span>
                <span style={{ color: "var(--text-muted)" }}>•</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {activeScene.duration.toFixed(1)}s
                </span>
              </div>

              {activeScene.motion && activeScene.motion !== "none" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(99, 102, 241, 0.2)",
                    backdropFilter: "blur(6px)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    color: "var(--primary)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  <span>🎥</span>
                  <span>{activeScene.motion}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Glassmorphic Transport Controls */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Scrubber Progress Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.05}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            style={{
              flex: 1,
              height: "5px",
              borderRadius: "3px",
              accentColor: "var(--accent-primary)",
              cursor: "pointer",
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              minWidth: "115px",
              textAlign: "right",
            }}
          >
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>/</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Buttons and Volume Control */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Playback buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 2))}
              title="Rewind 2 seconds"
              style={{
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              ⏪ -2s
            </button>

            <button
              onClick={onTogglePlay}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              className="btn-primary"
              style={{
                padding: "7px 18px",
                fontSize: "0.9rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>

            <button
              onClick={() => onSeek(Math.min(totalDuration, currentTime + 2))}
              title="Forward 2 seconds"
              style={{
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              +2s ⏩
            </button>

            <button
              onClick={() => onSeek(0)}
              title="Return to start"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "6px 8px",
                fontSize: "0.85rem",
              }}
            >
              ⏮ Start
            </button>
          </div>

          {/* Right: Audio and View controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Audio Volume */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute" : "Mute"}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: isMuted ? "var(--accent-rose)" : "var(--text-secondary)",
                }}
              >
                {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                style={{
                  width: "60px",
                  height: "4px",
                  accentColor: "var(--primary)",
                  cursor: "pointer",
                }}
              />
            </div>

            {/* Jump to active scene in inspector */}
            {activeScene && onSelectScene && (
              <button
                onClick={() => onSelectScene(activeScene.id)}
                style={{
                  background: "rgba(99, 102, 241, 0.12)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "var(--primary)",
                  borderRadius: "var(--radius-sm)",
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                Inspect Scene
              </button>
            )}

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              style={{
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {isFullscreen ? "⤓ Exit" : "⤢ Fullscreen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
