import React, { useRef } from "react";
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
}

export const TimelineTracks: React.FC<TimelineTracksProps> = ({
  project,
  currentTime,
  totalDuration,
  pixelsPerSecond,
  selectedSceneId,
  onSelectScene,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scenes = project.scenes || [];
  const trackWidth = Math.max(800, totalDuration * pixelsPerSecond + 120);

  // Time ruler tick marks (every 1 second or 5 seconds depending on zoom)
  const tickStep = pixelsPerSecond < 40 ? 5 : pixelsPerSecond < 80 ? 2 : 1;
  const numTicks = Math.ceil(totalDuration / tickStep) + 2;

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = Math.max(0, Math.min(totalDuration, clickX / pixelsPerSecond));
    onSeek(time);
  };

  const playheadLeft = currentTime * pixelsPerSecond;

  return (
    <div
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
        ref={containerRef}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          position: "relative",
          paddingBottom: "8px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${trackWidth}px`,
            minHeight: "260px",
          }}
        >
          {/* Vertical Playhead Indicator spanning all tracks */}
          <div
            className="timeline-playhead-line"
            style={{
              left: `${playheadLeft}px`,
              transition: "left 0.05s linear",
            }}
          >
            <div className="timeline-playhead-head" />
          </div>

          {/* 1. Time Ruler Header */}
          <div
            onClick={handleRulerClick}
            style={{
              height: "36px",
              background: "var(--bg-card-subtle)",
              borderBottom: "1px solid var(--border-subtle)",
              position: "relative",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {Array.from({ length: numTicks }).map((_, i) => {
              const tickTime = i * tickStep;
              const leftPos = tickTime * pixelsPerSecond;
              if (leftPos > trackWidth) return null;

              const mins = Math.floor(tickTime / 60);
              const secs = tickTime % 60;
              const label = `${mins}:${secs.toString().padStart(2, "0")}`;

              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${leftPos}px`,
                    top: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    paddingLeft: "4px",
                    borderLeft: "1px solid var(--border-subtle)",
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
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 2. Track 1: Image Track (Master Timeline Rule Enforced) */}
          <div
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
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--primary)",
                fontWeight: 700,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              📷 Image Track (Authoritative)
            </div>

            {scenes.map((scene, idx) => {
              const left = scene.start * pixelsPerSecond;
              const width = Math.max(30, scene.duration * pixelsPerSecond);
              const isSelected = selectedSceneId === scene.id;
              const isActiveInPlayback =
                currentTime >= scene.start && currentTime < scene.end;

              return (
                <div
                  key={scene.id}
                  onClick={() => {
                    onSelectScene(scene.id);
                    onSeek(scene.start);
                  }}
                  style={{
                    position: "absolute",
                    left: `${left}px`,
                    width: `${width}px`,
                    height: "80px",
                    top: "14px",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    border: isSelected
                      ? "2px solid var(--accent-primary)"
                      : isActiveInPlayback
                      ? "2px solid var(--accent-primary)"
                      : "1px solid var(--border-subtle)",
                    boxShadow: isSelected
                      ? "0 0 16px var(--accent-primary-subtle)"
                      : "none",
                    background: "var(--bg-card)",
                    transition: "all 0.15s ease",
                  }}
                  title={`Scene ${idx + 1}: ${scene.caption}\n${scene.start}s - ${scene.end}s (${scene.duration}s)`}
                >
                  {/* Background Image Thumbnail */}
                  {scene.image_url ? (
                    <img
                      src={api.getMediaUrl(scene.image_url)}
                      alt={scene.caption}
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
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                        fontSize: "0.75rem",
                        background: "var(--bg-card-subtle)",
                      }}
                    >
                      {scene.image_status === "generating" ? "⏳ Gen" : "No Visual"}
                    </div>
                  )}

                  {/* Scene Block Details Badge Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                      padding: "4px 6px",
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
                      {scene.duration.toFixed(1)}s
                    </span>
                  </div>

                  {/* Motion and Transition Badges */}
                  {scene.motion && scene.motion !== "none" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        background: "rgba(0,0,0,0.7)",
                        borderRadius: "4px",
                        padding: "2px 4px",
                        fontSize: "0.62rem",
                        color: "var(--primary)",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
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
                        right: "4px",
                        background: "rgba(6, 182, 212, 0.25)",
                        border: "1px solid rgba(6, 182, 212, 0.5)",
                        borderRadius: "4px",
                        padding: "2px 4px",
                        fontSize: "0.6rem",
                        color: "var(--accent-cyan)",
                        fontWeight: 600,
                      }}
                    >
                      ⚡ {scene.transition}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3. Track 2: Caption Track */}
          <div
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

          {/* 4. Track 3: Audio Track */}
          <div
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
                color: "var(--accent-emerald)",
                fontWeight: 700,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              🎵 Audio ({project.audio_file ? project.audio_file.filename : "No Audio"})
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
                {/* Simulated waveform lines across duration */}
                {Array.from({
                  length: Math.min(200, Math.floor((totalDuration * pixelsPerSecond) / 6)),
                }).map((_, i) => {
                  const pseudoRandomHeight = 8 + ((i * 17 + 7) % 18);
                  return (
                    <div
                      key={i}
                      style={{
                        width: "3px",
                        height: `${pseudoRandomHeight}px`,
                        background: "rgba(16, 185, 129, 0.6)",
                        borderRadius: "1px",
                      }}
                    />
                  );
                })}
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
        </div>
      </div>
    </div>
  );
};
