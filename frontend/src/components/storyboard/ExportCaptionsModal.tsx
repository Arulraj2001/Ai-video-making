import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

interface ExportCaptionsModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

type CaptionFormat = "timed_txt" | "srt" | "clean_txt";

export const ExportCaptionsModal: React.FC<ExportCaptionsModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
}) => {
  const [format, setFormat] = useState<CaptionFormat>("timed_txt");
  const [content, setContent] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [sceneCount, setSceneCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    let active = true;
    setLoading(true);
    setError(null);

    api
      .exportTimelineCaptions(projectId, format)
      .then((res) => {
        if (!active) return;
        setContent(res.content);
        setFilename(res.filename);
        setSceneCount(res.scene_count);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load captions export.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, projectId, format]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${projectName}_captions.${format === "srt" ? "srt" : "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "88vh",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "#eff6ff",
                border: "1px solid #dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
                fontWeight: 700,
                fontSize: "18px",
              }}
            >
              📄
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                Export Captions & Narration Timing
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                Exact spoken dialogue and timestamps across {sceneCount} scenes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              backgroundColor: "transparent",
              border: "1px solid transparent",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.color = "#334155";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Format Selector Pills */}
        <div
          style={{
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
          }}
        >
          <button
            type="button"
            onClick={() => setFormat("timed_txt")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              backgroundColor: format === "timed_txt" ? "#2563eb" : "#f1f5f9",
              color: format === "timed_txt" ? "#ffffff" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            ⏱️ Timed Text
          </button>
          <button
            type="button"
            onClick={() => setFormat("srt")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              backgroundColor: format === "srt" ? "#2563eb" : "#f1f5f9",
              color: format === "srt" ? "#ffffff" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            🎬 SRT Subtitles
          </button>
          <button
            type="button"
            onClick={() => setFormat("clean_txt")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              backgroundColor: format === "clean_txt" ? "#2563eb" : "#f1f5f9",
              color: format === "clean_txt" ? "#ffffff" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            📝 Clean Script Text
          </button>
        </div>

        {/* Content Preview Box */}
        <div
          style={{
            padding: "24px",
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#f8fafc",
          }}
        >
          {error && (
            <div style={{ padding: "12px 16px", marginBottom: "12px", borderRadius: "10px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "12px" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <div style={{ width: "32px", height: "32px", border: "2px solid #2563eb", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "12px" }}></div>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 500 }}>Formatting narration captions...</p>
            </div>
          ) : (
            <div>
              <textarea
                readOnly
                value={content}
                rows={14}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#1e293b",
                  backgroundColor: "#ffffff",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  outline: "none",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
                  resize: "none",
                  lineHeight: "1.6",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>
            {filename}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !content}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "#f1f5f9",
                color: "#334155",
                border: "1px solid #e2e8f0",
                cursor: loading || !content ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              {copied ? "✓ Copied!" : "📋 Copy All"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !content}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                cursor: loading || !content ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              ⬇️ Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
