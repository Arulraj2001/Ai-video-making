import React, { useRef, useState, useEffect, useMemo } from "react";
import type { Project } from "../../types/project";
import { api } from "../../services/api";

interface TimelineTracksProps {
  project: Project;
  currentTime: number;
  totalDuration: number;
  pixelsPerSecond: number;
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onSeek: (time: number) => void;
  onUpdateSceneTimes?: (sceneId: string, start: number, end: number, ripple: boolean) => Promise<void>;
  onUploadImage?: (sceneId: string, file: File) => Promise<void>;
  onOpenSlideModal?: () => void;
  onDuplicateScene?: (sceneId: string) => void;
  onSplitScene?: (sceneId: string, splitTime: number) => void;
  onShowToast?: (message: string, type?: "error" | "success" | "info") => void;
}

export const TimelineTracksComponent: React.FC<TimelineTracksProps> = ({
  project,
  currentTime,
  totalDuration,
  pixelsPerSecond,
  selectedSceneId,
  onSelectScene,
  onSeek,
  onUpdateSceneTimes,
  onUploadImage,
  onOpenSlideModal,
  onDuplicateScene,
  onSplitScene,
  onShowToast,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);
  const scenes = project.scenes || [];
  const trackWidth = Math.max(800, totalDuration * pixelsPerSecond + 120);

  // Time ruler tick marks (every 1 second or 5 seconds depending on zoom)
  const tickStep = pixelsPerSecond < 40 ? 5 : pixelsPerSecond < 80 ? 2 : 1;
  const numTicks = Math.ceil(totalDuration / tickStep) + 2;

  // Memoized ruler ticks to eliminate allocation thrashing on 60fps playhead updates
  const rulerTicks = useMemo(() => {
    return Array.from({ length: numTicks })
      .map((_, i) => {
        const tickTime = i * tickStep;
        const leftPos = tickTime * pixelsPerSecond;
        if (leftPos > trackWidth) return null;
        const mins = Math.floor(tickTime / 60);
        const secs = tickTime % 60;
        const label = `${mins}:${secs.toString().padStart(2, "0")}`;
        return { i, leftPos, label };
      })
      .filter((t): t is { i: number; leftPos: number; label: string } => t !== null);
  }, [numTicks, tickStep, pixelsPerSecond, trackWidth]);

  // Memoized waveform bars to avoid array re-allocations during playback
  const pseudoWaveformBars = useMemo(() => {
    const count = Math.min(200, Math.floor((totalDuration * pixelsPerSecond) / 8));
    return Array.from({ length: count }).map((_, i) => ({
      i,
      height: 6 + ((i * 23 + 11) % 16),
    }));
  }, [totalDuration, pixelsPerSecond]);

  // Memoized narration waveform bars
  const pseudoNarrationBars = useMemo(() => {
    const count = Math.min(200, Math.floor((totalDuration * pixelsPerSecond) / 6));
    return Array.from({ length: count }).map((_, i) => ({
      i,
      height: 8 + ((i * 17 + 7) % 18),
    }));
  }, [totalDuration, pixelsPerSecond]);

  // --- Drag-to-Scrub on Ruler & Playhead Needle ---
  const [isScrubbing, setIsScrubbing] = useState(false);

  const seekFromPointer = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const clickX = clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(totalDuration, clickX / pixelsPerSecond));
    onSeek(Number(time.toFixed(3)));
  };

  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsScrubbing(true);
    seekFromPointer(e.clientX);
  };

  useEffect(() => {
    if (!isScrubbing) return;
    const handlePointerMove = (e: MouseEvent) => {
      seekFromPointer(e.clientX);
    };
    const handlePointerUp = () => {
      setIsScrubbing(false);
    };
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [isScrubbing, totalDuration, pixelsPerSecond]);

  // --- Interactive Clip Edge Trimming State ---
  const [trimmingState, setTrimmingState] = useState<{
    sceneId: string;
    handle: "left" | "right";
    initialClientX: number;
    initialStart: number;
    initialEnd: number;
    currentStart: number;
    currentEnd: number;
  } | null>(null);

  useEffect(() => {
    if (!trimmingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - trimmingState.initialClientX;
      const deltaTime = deltaX / pixelsPerSecond;

      if (trimmingState.handle === "left") {
        const rawStart = trimmingState.initialStart + deltaTime;
        const boundedStart = Math.max(0, Math.min(trimmingState.initialEnd - 0.3, rawStart));
        setTrimmingState((prev) => (prev ? { ...prev, currentStart: Number(boundedStart.toFixed(3)) } : null));
      } else {
        const rawEnd = trimmingState.initialEnd + deltaTime;
        const boundedEnd = Math.max(trimmingState.initialStart + 0.3, rawEnd);
        setTrimmingState((prev) => (prev ? { ...prev, currentEnd: Number(boundedEnd.toFixed(3)) } : null));
      }
    };

    const handleMouseUp = async () => {
      const stateToCommit = trimmingState;
      setTrimmingState(null);
      if (
        stateToCommit &&
        onUpdateSceneTimes &&
        (stateToCommit.currentStart !== stateToCommit.initialStart ||
          stateToCommit.currentEnd !== stateToCommit.initialEnd)
      ) {
        try {
          await onUpdateSceneTimes(
            stateToCommit.sceneId,
            stateToCommit.currentStart,
            stateToCommit.currentEnd,
            true
          );
        } catch (err) {
          console.error("Failed to commit clip edge trim:", err);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [trimmingState, pixelsPerSecond, onUpdateSceneTimes]);

  const playheadLeft = currentTime * pixelsPerSecond;

  // --- Auto-scroll Playhead Follow during playback ---
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollLeft = container.scrollLeft;
      const clientWidth = container.clientWidth;
      if (playheadLeft > scrollLeft + clientWidth - 70) {
        container.scrollLeft = playheadLeft - clientWidth + 240;
      } else if (playheadLeft < scrollLeft) {
        container.scrollLeft = Math.max(0, playheadLeft - 60);
      }
    }
  }, [playheadLeft]);

  return (
    <div
      id="timeline-tracks-container"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Scrollable Timeline Viewport */}
      <div
        id="timeline-tracks-viewport"
        ref={containerRef}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          position: "relative",
          paddingBottom: "8px",
          userSelect: isScrubbing || Boolean(trimmingState) ? "none" : "auto",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${trackWidth}px`,
            minHeight: "310px",
          }}
        >
          {/* Vertical Playhead Indicator spanning all tracks */}
          <div
            id="timeline-playhead-needle"
            className="timeline-playhead-line"
            style={{
              left: `${playheadLeft}px`,
              transition: "none",
              cursor: "ew-resize",
              zIndex: 40,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsScrubbing(true);
            }}
          >
            <div
              id="timeline-playhead-handle"
              className="timeline-playhead-head"
              style={{ cursor: "ew-resize" }}
              title="Drag playhead to scrub timeline"
            />
          </div>

          {/* 1. Time Ruler Header */}
          <div
            id="timeline-ruler"
            onMouseDown={handleRulerMouseDown}
            style={{
              height: "36px",
              background: "var(--bg-card-subtle)",
              borderBottom: "1px solid var(--border-subtle)",
              position: "relative",
              cursor: "ew-resize",
              userSelect: "none",
            }}
            title="Click or drag along ruler to scrub playhead"
          >
            {rulerTicks.map((tick) => (
              <div
                key={tick.i}
                style={{
                  position: "absolute",
                  left: `${tick.leftPos}px`,
                  top: 0,
                  bottom: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  paddingLeft: "4px",
                  borderLeft: "1px solid var(--border-subtle)",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  {tick.label}
                </span>
              </div>
            ))}
          </div>

          {/* 2. Track 1: Image Track (Master Timeline Rule Enforced with Trimming) */}
          <div
            id="timeline-image-track"
            style={{
              padding: "10px 0",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              position: "relative",
              height: "100px",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "8px",
                top: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                zIndex: 20,
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--primary)",
                  fontWeight: 700,
                }}
              >
                📷 Visual & Slide Track
              </span>

              {onOpenSlideModal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSlideModal();
                  }}
                  style={{
                    background: "rgba(99, 102, 241, 0.2)",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    color: "var(--primary)",
                    borderRadius: "4px",
                    padding: "1px 7px",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Add blank or template slide (PowerPoint style)"
                >
                  + Add Slide
                </button>
              )}

              {selectedSceneId && onDuplicateScene && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateScene(selectedSceneId);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "var(--text-secondary)",
                    borderRadius: "4px",
                    padding: "1px 7px",
                    fontSize: "0.68rem",
                    cursor: "pointer",
                  }}
                  title="Duplicate selected scene (Ctrl+D)"
                >
                  Duplicate (Ctrl+D)
                </button>
              )}

              {selectedSceneId && onSplitScene && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSplitScene(selectedSceneId, currentTime);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "var(--text-secondary)",
                    borderRadius: "4px",
                    padding: "1px 7px",
                    fontSize: "0.68rem",
                    cursor: "pointer",
                  }}
                  title="Split scene at current playhead position (C)"
                >
                  Split (C)
                </button>
              )}
            </div>

            {scenes.map((scene, idx) => {
              const isBeingTrimmed = trimmingState?.sceneId === scene.id;
              const displayStart = isBeingTrimmed ? trimmingState.currentStart : scene.start;
              const displayEnd = isBeingTrimmed ? trimmingState.currentEnd : scene.end;
              const displayDuration = Math.max(0.3, displayEnd - displayStart);

              const left = displayStart * pixelsPerSecond;
              const width = Math.max(32, displayDuration * pixelsPerSecond);
              const isSelected = selectedSceneId === scene.id;
              const isActiveInPlayback =
                currentTime >= scene.start && currentTime < scene.end;

              const isDragTarget = dragOverSceneId === scene.id;

              return (
                <div
                  key={scene.id}
                  id={`timeline-scene-block-${scene.id}`}
                  onClick={() => {
                    onSelectScene(scene.id);
                    onSeek(scene.start);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverSceneId(scene.id);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverSceneId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverSceneId(null);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/") && onUploadImage) {
                      onUploadImage(scene.id, file).catch((err: any) => {
                        if (onShowToast) {
                          onShowToast(err.message || "Failed to upload image", "error");
                        } else {
                          console.error(err);
                        }
                      });
                    }
                  }}
                  style={{
                    position: "absolute",
                    left: `${left}px`,
                    width: `${width}px`,
                    height: "80px",
                    top: "14px",
                    borderRadius: "var(--radius-sm)",
                    overflow: "visible",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    border: isDragTarget
                      ? "2px dashed var(--accent-cyan)"
                      : isSelected
                      ? "2px solid var(--accent-primary)"
                      : isActiveInPlayback
                      ? "2px solid var(--accent-primary)"
                      : "1px solid var(--border-subtle)",
                    boxShadow: isDragTarget
                      ? "0 0 20px rgba(6, 182, 212, 0.6)"
                      : isSelected
                      ? "0 0 16px var(--accent-primary-subtle)"
                      : "none",
                    background: "var(--bg-card)",
                    transition: isBeingTrimmed ? "none" : "border 0.15s ease, box-shadow 0.15s ease",
                  }}
                  title={`Scene ${idx + 1}: ${scene.caption}\n${displayStart.toFixed(2)}s - ${displayEnd.toFixed(2)}s (${displayDuration.toFixed(2)}s)\n(Drag clip borders to trim duration, or drop image to replace)`}
                >
                  {/* Floating Trim Tooltip */}
                  {isBeingTrimmed && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-26px",
                        left: trimmingState.handle === "left" ? 0 : "auto",
                        right: trimmingState.handle === "right" ? 0 : "auto",
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid var(--accent-primary)",
                        color: "var(--text-primary)",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        fontSize: "0.72rem",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        zIndex: 35,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.6)",
                        pointerEvents: "none",
                      }}
                    >
                      {trimmingState.handle === "left"
                        ? `Start: ${displayStart.toFixed(2)}s (${displayDuration.toFixed(2)}s)`
                        : `End: ${displayEnd.toFixed(2)}s (${displayDuration.toFixed(2)}s)`}
                    </div>
                  )}

                  {/* Left Trim Handle */}
                  <div
                    id={`timeline-trim-left-${scene.id}`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setTrimmingState({
                        sceneId: scene.id,
                        handle: "left",
                        initialClientX: e.clientX,
                        initialStart: scene.start,
                        initialEnd: scene.end,
                        currentStart: scene.start,
                        currentEnd: scene.end,
                      });
                    }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "8px",
                      cursor: "col-resize",
                      zIndex: 25,
                      background: isSelected ? "var(--primary)" : "rgba(255,255,255,0.25)",
                      opacity: isSelected ? 0.9 : 0.4,
                      borderTopLeftRadius: "3px",
                      borderBottomLeftRadius: "3px",
                    }}
                    title="Drag left edge to adjust scene start"
                  />

                  {/* Right Trim Handle */}
                  <div
                    id={`timeline-trim-right-${scene.id}`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setTrimmingState({
                        sceneId: scene.id,
                        handle: "right",
                        initialClientX: e.clientX,
                        initialStart: scene.start,
                        initialEnd: scene.end,
                        currentStart: scene.start,
                        currentEnd: scene.end,
                      });
                    }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "8px",
                      cursor: "col-resize",
                      zIndex: 25,
                      background: isSelected ? "var(--primary)" : "rgba(255,255,255,0.25)",
                      opacity: isSelected ? 0.9 : 0.4,
                      borderTopRightRadius: "3px",
                      borderBottomRightRadius: "3px",
                    }}
                    title="Drag right edge to trim scene length (ripples downstream scenes)"
                  />

                  {/* Clip Content Wrapper */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Visual Thumbnail */}
                    {(!scene.template_type || scene.template_type === "standard") &&
                    !scene.background?.type &&
                    scene.image_url ? (
                      <img
                        src={api.getMediaUrl(scene.image_url)}
                        alt={scene.caption}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: isSelected ? "brightness(1)" : "brightness(0.85)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          padding: "4px",
                          textAlign: "center",
                          background:
                            scene.background?.type === "color" && scene.background.value
                              ? scene.background.value
                              : scene.background?.type === "gradient" && scene.background.gradient_stops
                              ? `linear-gradient(135deg, ${scene.background.gradient_stops[0]}, ${scene.background.gradient_stops[1]})`
                              : scene.template_type === "title_intro"
                              ? "linear-gradient(135deg, #1e1b4b, #0f172a)"
                              : scene.template_type === "key_takeaway"
                              ? "linear-gradient(135deg, #042f2e, #0f172a)"
                              : scene.template_type === "quote_slide"
                              ? "linear-gradient(135deg, #18181b, #09090b)"
                              : "var(--bg-card-subtle)",
                        }}
                      >
                        {scene.template_type && scene.template_type !== "standard" ? (
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>
                            {scene.template_type.replace("_", " ")}
                          </span>
                        ) : (
                          <span>{scene.image_status === "generating" ? "⏳ Gen" : "No Visual"}</span>
                        )}
                        {scene.elements && scene.elements.length > 0 && (
                          <span style={{ fontSize: "0.6rem", color: "var(--accent-cyan)", marginTop: "2px" }}>
                            ✦ {scene.elements.length} overlays
                          </span>
                        )}
                      </div>
                    )}

                    {/* Scene Block Details Badge Overlay */}
                    {isDragTarget && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "rgba(6, 182, 212, 0.45)",
                          backdropFilter: "blur(2px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFFFFF",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          zIndex: 22,
                          pointerEvents: "none",
                        }}
                      >
                        📥 Drop to Replace
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                        padding: "4px 8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pointerEvents: "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#fff",
                          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                        }}
                      >
                        S{idx + 1}
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "rgba(255,255,255,0.8)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {displayDuration.toFixed(1)}s
                      </span>
                    </div>

                    {/* Motion and Transition Badges */}
                    {scene.motion && scene.motion !== "none" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "4px",
                          left: "8px",
                          background: "rgba(0,0,0,0.75)",
                          borderRadius: "4px",
                          padding: "2px 5px",
                          fontSize: "0.62rem",
                          color: "var(--primary)",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "2px",
                          pointerEvents: "none",
                        }}
                      >
                        🎥 {scene.motion}
                      </div>
                    )}

                    {scene.transition && scene.transition !== "none" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "8px",
                          background: "rgba(6, 182, 212, 0.3)",
                          border: "1px solid rgba(6, 182, 212, 0.5)",
                          borderRadius: "4px",
                          padding: "2px 5px",
                          fontSize: "0.6rem",
                          color: "var(--accent-cyan)",
                          fontWeight: 600,
                          pointerEvents: "none",
                        }}
                      >
                        ⚡ {scene.transition}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Track 2: Caption Track */}
          <div
            id="timeline-captions-track"
            style={{
              padding: "6px 0",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              position: "relative",
              height: "46px",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "8px",
                top: "2px",
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--accent-cyan, #0284c7)",
                fontWeight: 700,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              💬 Captions
            </div>

            {scenes.map((scene) => {
              const left = scene.start * pixelsPerSecond;
              const width = Math.max(30, scene.duration * pixelsPerSecond);
              const isSelected = selectedSceneId === scene.id;

              return (
                <div
                  key={scene.id}
                  id={`timeline-caption-block-${scene.id}`}
                  onClick={() => {
                    onSelectScene(scene.id);
                    onSeek(scene.start);
                  }}
                  style={{
                    position: "absolute",
                    left: `${left}px`,
                    width: `${width}px`,
                    height: "32px",
                    top: "10px",
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 8px",
                    background: isSelected
                      ? "var(--accent-primary-subtle)"
                      : "var(--bg-card-subtle)",
                    border: isSelected
                      ? "1px solid var(--accent-primary)"
                      : "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                  title={scene.caption}
                >
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {scene.caption}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 4. Track 3: Voiceover Narration Track */}
          <div
            id="timeline-narration-track"
            style={{
              padding: "6px 0",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              position: "relative",
              height: "46px",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "8px",
                top: "2px",
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--accent-emerald)",
                fontWeight: 700,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              🎙 Narration ({project.audio_file ? project.audio_file.filename : "No Audio"})
            </div>

            {project.audio_file ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: `${totalDuration * pixelsPerSecond}px`,
                  height: "30px",
                  top: "12px",
                  borderRadius: "4px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 10px",
                  gap: "3px",
                  overflow: "hidden",
                }}
              >
                {pseudoNarrationBars.map((bar) => (
                  <div
                    key={bar.i}
                    style={{
                      width: "3px",
                      height: `${bar.height}px`,
                      background: "rgba(16, 185, 129, 0.6)",
                      borderRadius: "1px",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: `${Math.max(400, totalDuration * pixelsPerSecond)}px`,
                  height: "30px",
                  top: "12px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-card-subtle)",
                  border: "1px dashed var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "16px",
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                }}
              >
                No audio track uploaded. Voice audio will synchronize automatically when attached.
              </div>
            )}
          </div>

          {/* 5. Track 4: Background Music (BGM) Track */}
          <div
            id="timeline-bgm-track"
            style={{
              padding: "6px 0",
              display: "flex",
              alignItems: "center",
              position: "relative",
              height: "46px",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "8px",
                top: "2px",
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#c084fc",
                fontWeight: 700,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              🎼 Music ({project.audio_settings?.music_file ? project.audio_settings.music_file.filename : "No BGM"})
            </div>

            {project.audio_settings?.music_file ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: `${totalDuration * pixelsPerSecond}px`,
                  height: "30px",
                  top: "12px",
                  borderRadius: "4px",
                  background: project.audio_settings.music_muted
                    ? "rgba(239, 68, 68, 0.08)"
                    : "rgba(168, 85, 247, 0.12)",
                  border: project.audio_settings.music_muted
                    ? "1px dashed rgba(239, 68, 68, 0.4)"
                    : "1px solid rgba(168, 85, 247, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 10px",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "3px", overflow: "hidden" }}>
                  {pseudoWaveformBars.map((bar) => (
                    <div
                      key={bar.i}
                      style={{
                        width: "3px",
                        height: `${bar.height}px`,
                        background: project.audio_settings?.music_muted
                          ? "rgba(239, 68, 68, 0.5)"
                          : "rgba(168, 85, 247, 0.6)",
                        borderRadius: "1px",
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontFamily: "var(--font-mono)",
                    color: project.audio_settings.music_muted ? "#ef4444" : "#c084fc",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    marginLeft: "8px",
                  }}
                >
                  {project.audio_settings.music_muted
                    ? "MUTED"
                    : `Vol: ${Math.round((project.audio_settings.music_volume ?? 0.25) * 100)}%`}
                </span>
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: `${Math.max(400, totalDuration * pixelsPerSecond)}px`,
                  height: "30px",
                  top: "12px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-card-subtle)",
                  border: "1px dashed var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "16px",
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                }}
              >
                No background music attached (configure & upload in Audio mixing tab)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TimelineTracks = React.memo(TimelineTracksComponent);

