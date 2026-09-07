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
  onUploadImage?: (sceneId: string, file: File) => Promise<void>;
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
  onUploadImage,
  audioRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isCanvasUploading, setIsCanvasUploading] = useState(false);

  // Find currently active scene according to authoritative timestamps
  const scenes = project.scenes || [];
  const activeSceneIndex = scenes.findIndex((s, idx) => {
    const isLast = idx === scenes.length - 1;
    return currentTime >= s.start && (isLast ? currentTime <= s.end + 0.001 : currentTime < s.end);
  });
  const safeActiveIndex =
    activeSceneIndex !== -1
      ? activeSceneIndex
      : scenes.length > 0
      ? currentTime >= scenes[scenes.length - 1].end
        ? scenes.length - 1
        : scenes.findIndex((s) => s.end > currentTime) !== -1
        ? scenes.findIndex((s) => s.end > currentTime)
        : 0
      : -1;
  const activeScene: Scene | undefined =
    safeActiveIndex !== -1 ? scenes[safeActiveIndex] : undefined;

  // Check if upcoming scene transition should crossfade
  const nextScene: Scene | undefined =
    safeActiveIndex !== -1 && safeActiveIndex < scenes.length - 1
      ? scenes[safeActiveIndex + 1]
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

  // Update BGM audio volume and synchronization with auto-ducking
  useEffect(() => {
    if (bgmAudioRef.current) {
      const musicMuted = project.audio_settings?.music_muted || isMuted;
      const baseMusicVol = project.audio_settings?.music_volume ?? 0.25;
      // Auto-ducking: attenuate music when voiceover exists and ducking is enabled
      const isVoiceActive = Boolean(project.audio_file && !project.audio_settings?.narration_muted);
      const duckMultiplier = (project.audio_settings?.ducking_enabled !== false && isVoiceActive) ? 0.35 : 1.0;
      bgmAudioRef.current.volume = musicMuted ? 0 : Math.max(0, Math.min(1, volume * baseMusicVol * duckMultiplier));
      if (isPlaying) {
        if (bgmAudioRef.current.paused) {
          bgmAudioRef.current.play().catch(() => {});
        }
      } else {
        bgmAudioRef.current.pause();
      }
    }
  }, [
    isPlaying,
    volume,
    isMuted,
    project.audio_settings?.music_volume,
    project.audio_settings?.music_muted,
    project.audio_settings?.ducking_enabled,
    project.audio_settings?.narration_muted,
    project.audio_file,
  ]);

  // Sync BGM time when user seeks
  useEffect(() => {
    if (bgmAudioRef.current && bgmAudioRef.current.duration) {
      const targetTime = currentTime % bgmAudioRef.current.duration;
      if (Math.abs(bgmAudioRef.current.currentTime - targetTime) > 0.4) {
        bgmAudioRef.current.currentTime = targetTime;
      }
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

  // Compute CSS visual filter based on brightness, contrast, saturation, and color filter preset
  const getCssFilter = (scene?: Scene | null) => {
    if (!scene) return "none";
    const b = scene.brightness || 0.0;
    const c = scene.contrast ?? 1.0;
    const s = scene.saturation ?? 1.0;
    const filterPreset = scene.color_filter || "none";

    const filters: string[] = [];
    const cssBrightness = Math.max(0, 1 + b);
    if (Math.abs(cssBrightness - 1) > 0.01) {
      filters.push(`brightness(${cssBrightness.toFixed(2)})`);
    }
    if (Math.abs(c - 1) > 0.01) {
      filters.push(`contrast(${c.toFixed(2)})`);
    }
    if (Math.abs(s - 1) > 0.01) {
      filters.push(`saturate(${s.toFixed(2)})`);
    }

    if (filterPreset === "noir") {
      filters.push("grayscale(100%) contrast(120%)");
    } else if (filterPreset === "warm") {
      filters.push("sepia(30%) saturate(120%) hue-rotate(-15deg)");
    } else if (filterPreset === "cyberpunk") {
      filters.push("saturate(140%) hue-rotate(180deg) contrast(110%)");
    } else if (filterPreset === "cinematic") {
      filters.push("contrast(115%) saturate(110%) sepia(10%)");
    } else if (filterPreset === "vivid") {
      filters.push("saturate(140%) contrast(110%)");
    }

    return filters.length > 0 ? filters.join(" ") : "none";
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCanvas(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCanvas(false);
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCanvas(false);
    if (!activeScene || !onUploadImage) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIsCanvasUploading(true);
      try {
        await onUploadImage(activeScene.id, file);
      } catch (err: any) {
        alert(err.message || "Failed to upload replacement image");
      } finally {
        setIsCanvasUploading(false);
      }
    }
  };

  const audioUrl = project.audio_file
    ? api.getMediaUrl(project.audio_file.url || `/media/${project.id}/audio/${project.audio_file.filename}`)
    : null;

  return (
    <div
      id="cinema-preview-container"
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
          id="cinema-narration-audio"
          key={audioUrl}
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          style={{ display: "none" }}
          onEnded={() => {
            if (currentTime >= totalDuration - 0.3) {
              onTogglePlay();
            }
          }}
        />
      )}

      {/* Hidden BGM Audio element */}
      {bgmUrl && (
        <audio
          id="cinema-bgm-audio"
          key={bgmUrl}
          ref={bgmAudioRef}
          src={bgmUrl}
          loop
          preload="auto"
          style={{ display: "none" }}
        />
      )}

      {/* Main Dynamic Stage Enclosure */}
      <div
        id="cinema-stage-enclosure"
        className="cinema-stage-enclosure"
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
          id="cinema-canvas-screen"
          onClick={onTogglePlay}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
          title={isPlaying ? "Click to Pause (Space)" : "Click to Play (Space)"}
          style={{
            position: "relative",
            height: "100%",
            maxHeight: "100%",
            margin: "auto",
            aspectRatio:
              project.canvas_settings?.aspect_ratio === "9:16" || project.canvas_settings?.resolution === "1080x1920"
                ? "9 / 16"
                : project.canvas_settings?.aspect_ratio === "1:1" || project.canvas_settings?.resolution === "1080x1080"
                ? "1 / 1"
                : "16 / 9",
            maxWidth: "100%",
            overflow: "hidden",
            background: "#000",
            boxShadow: isDraggingCanvas ? "0 0 35px var(--accent-cyan)" : "0 0 35px rgba(0,0,0,0.8)",
            border: isDraggingCanvas ? "2px dashed var(--accent-cyan)" : "none",
            cursor: "pointer",
            transition: "box-shadow 0.15s ease, border 0.15s ease",
          }}
        >
          {/* Centered Play Button HUD Overlay when Paused */}
          {!isPlaying && !isDraggingCanvas && !isCanvasUploading && (
            <div
              id="cinema-play-hud"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "22px",
                paddingLeft: "4px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                pointerEvents: "none",
                transition: "transform 0.15s ease",
                zIndex: 30,
              }}
            >
              ▶
            </div>
          )}

          {/* Drag & Drop Canvas Overlay */}
          {isDraggingCanvas && (
            <div
              id="cinema-drag-drop-overlay"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(8, 20, 36, 0.85)",
                backdropFilter: "blur(8px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                zIndex: 40,
                pointerEvents: "none",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "36px" }}>📥</div>
              <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1.1rem" }}>
                Drop image to replace Scene {safeActiveIndex !== -1 ? safeActiveIndex + 1 : 1}
              </div>
              <div style={{ color: "var(--accent-cyan)", fontSize: "0.8rem", fontWeight: 500 }}>
                Instant desktop replacement with visual color grading
              </div>
            </div>
          )}

          {/* Uploading Status Overlay */}
          {isCanvasUploading && (
            <div
              id="cinema-uploading-overlay"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(8, 20, 36, 0.85)",
                backdropFilter: "blur(8px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                zIndex: 40,
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: "32px", animation: "spin 1s linear infinite" }}>⏳</div>
              <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "0.95rem" }}>
                Uploading Replacement Image...
              </div>
            </div>
          )}

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
              (() => {
                const isTemplate = activeScene.template_type && activeScene.template_type !== "standard";
                const hasSlideBg = Boolean(activeScene.background && (activeScene.background.type === "gradient" || activeScene.background.type === "color"));

                if (isTemplate || hasSlideBg) {
                  const bg = activeScene.background;
                  const bgStyle =
                    bg?.type === "gradient" && bg.gradient_stops
                      ? `linear-gradient(${bg.direction === "horizontal" ? "90deg" : "180deg"}, ${bg.gradient_stops[0]} 0%, ${bg.gradient_stops[1]} 100%)`
                      : bg?.type === "color" && bg.value
                      ? bg.value
                      : isTemplate
                      ? activeScene.template_type === "title_intro"
                        ? "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)"
                        : activeScene.template_type === "quote_slide"
                        ? "linear-gradient(180deg, #18181b 0%, #09090b 100%)"
                        : activeScene.template_type === "key_takeaway"
                        ? "linear-gradient(180deg, #042f2e 0%, #0f172a 100%)"
                        : activeScene.template_type === "outro_cta"
                        ? "linear-gradient(180deg, #311042 0%, #0f172a 100%)"
                        : activeScene.template_type === "split_screen"
                        ? "linear-gradient(90deg, #1e293b 50%, #0f172a 50%)"
                        : "#0f172a"
                      : null;

                  return (
                    <div
                      id="cinema-slide-canvas"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: bgStyle || "#0f172a",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "32px",
                        textAlign: "center",
                        zIndex: 2,
                      }}
                    >
                      {/* Built-in template layout when no custom elements exist */}
                      {(!activeScene.elements || activeScene.elements.length === 0) && (
                        <>
                          {activeScene.template_type === "title_intro" && (
                            <div style={{ maxWidth: "480px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                              <span style={{ padding: "4px 14px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", background: "rgba(99, 102, 241, 0.9)", color: "#fff" }}>
                                INTRODUCTION
                              </span>
                              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", lineHeight: 1.3, margin: 0 }}>
                                {activeScene.caption}
                              </h3>
                              <div style={{ width: "48px", height: "3px", background: "var(--accent-cyan)", borderRadius: "2px" }} />
                            </div>
                          )}

                          {activeScene.template_type === "quote_slide" && (
                            <div style={{ maxWidth: "500px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                              <span style={{ color: "#f59e0b", fontSize: "2.8rem", lineHeight: 0.8, fontFamily: "serif" }}>“</span>
                              <p style={{ fontSize: "1.15rem", fontStyle: "italic", color: "#f4f4f5", margin: 0, lineHeight: 1.4 }}>
                                {activeScene.caption}
                              </p>
                              <span style={{ fontSize: "0.75rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px" }}>
                                — Key Insight
                              </span>
                            </div>
                          )}

                          {activeScene.template_type === "key_takeaway" && (
                            <div style={{ maxWidth: "480px", padding: "24px", borderRadius: "16px", background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(20, 184, 166, 0.4)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}>
                              <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: "#0d9488", color: "#fff", letterSpacing: "0.05em" }}>
                                ⚡ KEY TAKEAWAY
                              </span>
                              <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.4 }}>
                                {activeScene.caption}
                              </p>
                            </div>
                          )}

                          {activeScene.template_type === "outro_cta" && (
                            <div style={{ maxWidth: "460px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                              <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: "#a855f7", color: "#fff" }}>
                                FINAL SUMMARY
                              </span>
                              <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#f4f4f5", margin: 0 }}>
                                {activeScene.caption}
                              </p>
                              <div style={{ padding: "10px 24px", borderRadius: "999px", background: "#ec4899", color: "#fff", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 8px 24px rgba(236, 72, 153, 0.4)" }}>
                                ▶ SUBSCRIBE & SHARE
                              </div>
                            </div>
                          )}

                          {activeScene.template_type === "split_screen" && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%", maxWidth: "520px" }}>
                              <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", marginBottom: "6px" }}>KEY LESSON</div>
                                <div style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>{activeScene.caption}</div>
                              </div>
                              <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "6px" }}>ACTIONABLE STEP</div>
                                <div style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>Apply this insight directly in your project.</div>
                              </div>
                            </div>
                          )}

                          {activeScene.template_type === "blank_slide" && (
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                              <span>Blank Slide Canvas · Add Overlays in Inspector</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                }

                // Standard Image Renderer
                if (activeScene.image_url) {
                  return (
                    <>
                      {/* Blurred Background Mirror if image_fit === "blur" */}
                      {activeScene.image_fit === "blur" && (
                        <img
                          key={`bg-blur-${activeScene.id}`}
                          src={api.getMediaUrl(activeScene.image_url)}
                          alt="Background blur"
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            top: "-10%",
                            left: "-10%",
                            width: "120%",
                            height: "120%",
                            objectFit: "cover",
                            filter: `blur(24px) brightness(0.65) ${getCssFilter(activeScene)}`,
                            pointerEvents: "none",
                            zIndex: 1,
                          }}
                        />
                      )}
                      {(() => {
                        const crop = activeScene.image_crop;
                        const cropClipPath =
                          crop && typeof crop.width === "number" && typeof crop.height === "number" && crop.width > 5 && crop.height > 5
                            ? `inset(${crop.y}% ${100 - (crop.x + crop.width)}% ${100 - (crop.y + crop.height)}% ${crop.x}%)`
                            : undefined;

                        return (
                          <img
                            key={activeScene.id}
                            src={api.getMediaUrl(activeScene.image_url)}
                            alt={activeScene.caption || "Scene image"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit:
                                activeScene.image_fit === "blur"
                                  ? "contain"
                                  : activeScene.image_fit === "fill"
                                  ? "cover"
                                  : ((activeScene.image_fit || "cover") as any),
                              objectPosition: activeScene.image_position || "center",
                              filter: getCssFilter(activeScene),
                              transform: `${getMotionTransform(activeScene.motion, sceneProgress)} scale(${activeScene.image_zoom || 1.0})`,
                              clipPath: cropClipPath,
                              transition: isPlaying ? "none" : "transform 0.2s ease-out",
                              willChange: "transform",
                              position: "relative",
                              zIndex: 2,
                            }}
                          />
                        );
                      })()}
                    </>
                  );
                }

                // Fallback placeholder when no visual exists
                return (
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
                        Scene ID: {activeScene.id} ({activeScene.start.toFixed(1)}s - {activeScene.end.toFixed(1)}s)
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No scenes on timeline
              </div>
            )}

            {/* Custom Overlay Elements Layer */}
            {activeScene?.elements && activeScene.elements.length > 0 && (
              <div
                id="cinema-overlay-elements"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                {activeScene.elements.map((elem) => {
                  const alignStyle = elem.align === "left" ? "left" : elem.align === "right" ? "right" : "center";
                  const hasBg = Boolean(elem.bg_color && elem.bg_color !== "transparent");
                  return (
                    <div
                      key={elem.id}
                      style={{
                        position: "absolute",
                        left: `${elem.x}%`,
                        top: `${elem.y}%`,
                        transform: "translate(-50%, -50%)",
                        fontSize: `${elem.font_size || 32}px`,
                        fontWeight: elem.font_weight === "bold" ? 700 : 500,
                        color: elem.color || "#ffffff",
                        background: hasBg ? elem.bg_color : "transparent",
                        padding: hasBg ? `${elem.padding || 12}px` : "0",
                        borderRadius: `${elem.border_radius || 8}px`,
                        textAlign: alignStyle as any,
                        maxWidth: elem.width ? `${elem.width}px` : "85%",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        boxShadow: hasBg ? "0 4px 20px rgba(0,0,0,0.5)" : "none",
                        textShadow: hasBg ? "none" : "0 2px 8px rgba(0,0,0,0.85)",
                        pointerEvents: "none",
                      }}
                    >
                      {elem.content}
                    </div>
                  );
                })}
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

            {/* Slide Transition Overlay */}
            {isTransitioning && activeScene?.transition === "slide" && nextScene?.image_url && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  transform: `translateX(${(1 - (currentTime - (activeScene.end - transitionDuration)) / transitionDuration) * 100}%)`,
                  pointerEvents: "none",
                  transition: "transform 0.05s linear",
                }}
              >
                <img
                  src={api.getMediaUrl(nextScene.image_url)}
                  alt="Slide transition preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: (nextScene.image_fit || "cover") as any,
                    objectPosition: nextScene.image_position || "center",
                  }}
                />
              </div>
            )}

            {/* Cinematic Subtitle Badge (Phase 8 Styling) */}
            {project.caption_settings?.enabled !== false && activeScene?.caption && (
              <div
                id="cinema-subtitle-container"
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
                  id="cinema-subtitle-text"
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
                    whiteSpace: "pre-line",
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
              id="cinema-top-hud"
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
                id="cinema-active-scene-badge"
                onClick={() => activeScene && onSelectScene && onSelectScene(activeScene.id)}
                title={onSelectScene ? `Click to inspect Scene ${safeActiveIndex + 1}` : undefined}
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
                  cursor: onSelectScene ? "pointer" : "default",
                  pointerEvents: "auto",
                }}
              >
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                  SCENE {safeActiveIndex !== -1 ? safeActiveIndex + 1 : 1}/{scenes.length}
                </span>
                <span style={{ color: "var(--text-muted)" }}>•</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {activeScene.duration.toFixed(1)}s
                </span>
              </div>

              {activeScene.motion && activeScene.motion !== "none" && (
                <div
                  id="cinema-motion-badge"
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
        id="cinema-transport-bar"
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
            id="cinema-playhead-scrubber"
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
            id="cinema-time-display"
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
              id="cinema-rewind-btn"
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
              id="cinema-play-btn"
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
              id="cinema-forward-btn"
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
              id="cinema-start-btn"
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
                id="cinema-master-volume-btn"
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
                id="cinema-master-volume-slider"
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
                id="cinema-inspect-scene-btn"
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
              id="cinema-fullscreen-btn"
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
