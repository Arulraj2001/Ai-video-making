import React, { useEffect } from "react";
import { X, ExternalLink, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface LightboxData {
  url: string;
  sceneNumber: number;
  caption: string;
  metadata?: any;
}

interface StoryboardLightboxModalProps {
  previewImage: LightboxData | null;
  onClose: () => void;
  onPrevScene?: () => void;
  onNextScene?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const StoryboardLightboxModal: React.FC<StoryboardLightboxModalProps> = ({
  previewImage,
  onClose,
  onPrevScene,
  onNextScene,
  hasPrev = false,
  hasNext = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrevScene && hasPrev) onPrevScene();
      if (e.key === "ArrowRight" && onNextScene && hasNext) onNextScene();
    };
    if (previewImage) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewImage, onClose, onPrevScene, onNextScene, hasPrev, hasNext]);

  if (!previewImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-md sm:p-6"
      style={{ background: "rgba(5, 6, 8, 0.88)" }}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl sm:max-h-[calc(100vh-3rem)]"
        style={{
          backgroundColor: "#16181F",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle orange accent top hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,107,0,0.6) 50%, transparent 100%)",
            zIndex: 10,
          }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-5"
          style={{
            background: "#13151B",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 10px",
                borderRadius: "9999px",
                background: "#FF6B00",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              SCENE {String(previewImage.sceneNumber).padStart(2, "0")}
            </span>
            <span
              className="truncate text-xs font-medium"
              style={{ color: "#F0F1F5" }}
            >
              "{previewImage.caption}"
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={previewImage.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#8A8F9E",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#8A8F9E";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              title="Open full resolution in new tab"
            >
              <ExternalLink size={14} />
            </a>

            <a
              href={previewImage.url}
              download={`scene-${previewImage.sceneNumber}-visual.png`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#8A8F9E",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#8A8F9E";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              title="Download image asset"
            >
              <Download size={14} />
            </a>

            <button
              type="button"
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#8A8F9E",
                cursor: "pointer",
                transition: "all 0.15s ease",
                marginLeft: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#8A8F9E";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
              aria-label="Close preview"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Cinema Viewport */}
        <div
          className="relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden p-4 sm:min-h-[380px] sm:p-6"
          style={{ backgroundColor: "#090A0D" }}
        >
          {/* Previous Button */}
          {onPrevScene && hasPrev && (
            <button
              type="button"
              onClick={onPrevScene}
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 20,
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(22, 24, 31, 0.9)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FF6B00";
                e.currentTarget.style.borderColor = "#FF6B00";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(22, 24, 31, 0.9)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
              title="Previous scene (Left Arrow)"
              aria-label="Previous scene"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <img
            src={previewImage.url}
            alt={`Scene ${previewImage.sceneNumber} Full Preview`}
            className="max-h-[min(70vh,720px)] max-w-full rounded-xl object-contain shadow-2xl"
            style={{
              boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          />

          {/* Next Button */}
          {onNextScene && hasNext && (
            <button
              type="button"
              onClick={onNextScene}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 20,
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(22, 24, 31, 0.9)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FF6B00";
                e.currentTarget.style.borderColor = "#FF6B00";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(22, 24, 31, 0.9)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
              title="Next scene (Right Arrow)"
              aria-label="Next scene"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Footer Metadata */}
        {previewImage.metadata && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs font-mono sm:px-5"
            style={{
              backgroundColor: "#13151B",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              color: "#8A8F9E",
            }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span>Engine: <strong style={{ color: "#F0F1F5" }}>{previewImage.metadata.provider?.toUpperCase() || "FLUX"}</strong></span>
              <span style={{ color: "#4E5364" }}>·</span>
              <span>Model: <strong style={{ color: "#F0F1F5" }}>{previewImage.metadata.model || "Schnell"}</strong></span>
              <span style={{ color: "#4E5364" }}>·</span>
              <span>
                {previewImage.metadata.width}×{previewImage.metadata.height} ({previewImage.metadata.aspect_ratio || "16:9"})
              </span>
            </div>

            {previewImage.metadata.generated_at && (
              <span style={{ fontSize: "11px", color: "#4E5364" }}>
                Rendered: {new Date(previewImage.metadata.generated_at).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
