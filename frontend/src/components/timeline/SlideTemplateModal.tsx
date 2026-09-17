import React, { useState, useEffect } from "react";
import {
  X,
  Layout,
  Plus,
  Palette,
  Check,
  Sparkles,
  Quote,
  Zap,
  Columns,
  Megaphone,
  Square,
  Clock,
  Sliders,
  Type,
  ArrowRight,
} from "lucide-react";
import type { SceneTemplateType, SceneBackground, Scene } from "../../types/project";

export interface SlideTemplateOption {
  id: SceneTemplateType;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  defaultGradient: [string, string];
  badgeText?: string;
  previewWireframe: "blank" | "title" | "quote" | "takeaway" | "split" | "outro";
}

const TEMPLATE_OPTIONS: SlideTemplateOption[] = [
  {
    id: "title_intro",
    title: "Title & Chapter Intro",
    category: "Opener",
    description: "Bold headline with chapter pill badge and cinematic backdrop.",
    icon: <Sparkles size={16} />,
    defaultGradient: ["#1e1b4b", "#0f172a"],
    badgeText: "CHAPTER 1",
    previewWireframe: "title",
  },
  {
    id: "key_takeaway",
    title: "Key Takeaway Callout",
    category: "Emphasis",
    description: "Focal takeaway card with teal accent badge for crucial points.",
    icon: <Zap size={16} />,
    defaultGradient: ["#042f2e", "#0f172a"],
    badgeText: "KEY TAKEAWAY",
    previewWireframe: "takeaway",
  },
  {
    id: "quote_slide",
    title: "Quote & Testimonial",
    category: "Statement",
    description: "Stylized quotation typography with author attribution line.",
    icon: <Quote size={16} />,
    defaultGradient: ["#18181b", "#09090b"],
    previewWireframe: "quote",
  },
  {
    id: "split_screen",
    title: "Split Comparison",
    category: "Comparison",
    description: "Dual-card layout for comparing two concepts or pros & cons.",
    icon: <Columns size={16} />,
    defaultGradient: ["#1e293b", "#0f172a"],
    previewWireframe: "split",
  },
  {
    id: "outro_cta",
    title: "Outro & Call-To-Action",
    category: "Ending",
    description: "Wrap-up layout with vibrant Subscribe & Follow action button.",
    icon: <Megaphone size={16} />,
    defaultGradient: ["#311042", "#0f172a"],
    badgeText: "NEXT STEPS",
    previewWireframe: "outro",
  },
  {
    id: "blank_slide",
    title: "Blank Canvas Slide",
    category: "Custom",
    description: "Clean canvas to place custom text, emojis, badges, and shapes.",
    icon: <Square size={16} />,
    defaultGradient: ["#0f172a", "#1e293b"],
    previewWireframe: "blank",
  },
];

const PRESET_GRADIENTS: { name: string; stops: [string, string] }[] = [
  { name: "Deep Indigo", stops: ["#1e1b4b", "#0f172a"] },
  { name: "Obsidian Slate", stops: ["#0f172a", "#020617"] },
  { name: "Emerald Teal", stops: ["#042f2e", "#0f172a"] },
  { name: "Violet Cyber", stops: ["#3b0764", "#0f172a"] },
  { name: "Crimson Rose", stops: ["#4c0519", "#0f172a"] },
  { name: "Amber Sunset", stops: ["#451a03", "#0f172a"] },
  { name: "Midnight Carbon", stops: ["#18181b", "#000000"] },
  { name: "Royal Navy", stops: ["#172554", "#020617"] },
];

const PRESET_SOLIDS: { name: string; hex: string }[] = [
  { name: "Slate Navy", hex: "#0f172a" },
  { name: "Obsidian", hex: "#0a0a0f" },
  { name: "Charcoal", hex: "#18181b" },
  { name: "Pure Black", hex: "#000000" },
  { name: "Deep Teal", hex: "#042f2e" },
  { name: "Wine Purple", hex: "#2e1065" },
  { name: "Dark Ruby", hex: "#3b0720" },
  { name: "Graphite", hex: "#27272a" },
];

const QUICK_CAPTIONS = [
  "Chapter 1: The Core Breakthrough",
  "Key Takeaway: Exponential Growth Ahead",
  "Pro Tip: Consistency Over Perfection",
  "Summary: Subscribe for Part 2",
];

export interface SlideTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScene?: Scene;
  onApplyToCurrentScene: (
    templateType: SceneTemplateType,
    background: SceneBackground,
    caption?: string
  ) => Promise<void>;
  onAddNewSlide: (
    templateType: SceneTemplateType,
    background: SceneBackground,
    captionText: string,
    duration: number
  ) => Promise<void>;
}

export const SlideTemplateModal: React.FC<SlideTemplateModalProps> = ({
  isOpen,
  onClose,
  activeScene,
  onApplyToCurrentScene,
  onAddNewSlide,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<SceneTemplateType>("title_intro");
  const [activeTab, setActiveTab] = useState<"layouts" | "background" | "settings">("layouts");
  const [bgType, setBgType] = useState<"preset_gradient" | "solid" | "custom_gradient">("preset_gradient");
  const [selectedGradient, setSelectedGradient] = useState<[string, string]>(["#1e1b4b", "#0f172a"]);
  const [gradientDirection, setGradientDirection] = useState<"vertical" | "horizontal">("vertical");
  const [solidColor, setSolidColor] = useState("#0f172a");
  const [customStart, setCustomStart] = useState("#312e81");
  const [customEnd, setCustomEnd] = useState("#0f172a");
  const [slideCaption, setSlideCaption] = useState(
    activeScene?.caption || "Master Timeline Key Presentation Takeaway"
  );
  const [duration, setDuration] = useState<number>(5.0);
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Clear modal error when modal is opened
  useEffect(() => {
    if (isOpen) setModalError(null);
  }, [isOpen]);

  // Sync initial scene caption if available
  useEffect(() => {
    if (activeScene?.caption) {
      setSlideCaption(activeScene.caption);
    }
  }, [activeScene]);

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentOption = TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplate) || TEMPLATE_OPTIONS[0];

  const handleSelectTemplate = (opt: SlideTemplateOption) => {
    setSelectedTemplate(opt.id);
    if (bgType === "preset_gradient") {
      setSelectedGradient(opt.defaultGradient);
    }
  };

  const getActiveBackground = (): SceneBackground => {
    if (bgType === "preset_gradient") {
      const angle = gradientDirection === "vertical" ? "180deg" : "90deg";
      return {
        type: "gradient",
        value: `linear-gradient(${angle}, ${selectedGradient[0]} 0%, ${selectedGradient[1]} 100%)`,
      };
    }
    if (bgType === "custom_gradient") {
      const angle = gradientDirection === "vertical" ? "180deg" : "90deg";
      return {
        type: "gradient",
        value: `linear-gradient(${angle}, ${customStart} 0%, ${customEnd} 100%)`,
      };
    }
    return {
      type: "color",
      value: solidColor,
    };
  };

  const getCssBackground = (): string => {
    const angle = gradientDirection === "vertical" ? "180deg" : "90deg";
    if (bgType === "preset_gradient") {
      return `linear-gradient(${angle}, ${selectedGradient[0]} 0%, ${selectedGradient[1]} 100%)`;
    }
    if (bgType === "custom_gradient") {
      return `linear-gradient(${angle}, ${customStart} 0%, ${customEnd} 100%)`;
    }
    return solidColor;
  };

  const handleApplyCurrent = async () => {
    try {
      setLoading(true);
      setModalError(null);
      await onApplyToCurrentScene(selectedTemplate, getActiveBackground(), slideCaption.trim());
      onClose();
    } catch (err: any) {
      setModalError("Failed to apply slide template: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlide = async () => {
    try {
      setLoading(true);
      setModalError(null);
      await onAddNewSlide(
        selectedTemplate,
        getActiveBackground(),
        slideCaption.trim() || "New Slide",
        duration || 5.0
      );
      onClose();
    } catch (err: any) {
      setModalError("Failed to add new slide: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-2xl w-full shadow-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: "1080px",
          maxHeight: "92vh",
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        {/* ================= MODAL HEADER ================= */}
        <div
          className="px-6 py-4 flex items-center justify-between shrink-0"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{
                background: "linear-gradient(135deg, var(--orange) 0%, #7c3aed 100%)",
              }}
            >
              <Layout size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Slide Studio & Canvas Templates
                </h3>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background: "var(--orange-subtle)",
                    color: "var(--orange)",
                    border: "1px solid rgba(255, 107, 0, 0.25)",
                  }}
                >
                  16:9 HD Ready
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  marginTop: "2px",
                }}
              >
                Choose presentation-grade slide layouts, configure backgrounds, and set slide duration.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            title="Close (Escape)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Error Banner */}
        {modalError && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              borderBottom: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "10px 24px",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{modalError}</span>
          </div>
        )}

        {/* ================= MODAL BODY (SPLIT VIEW) ================= */}
        <div
          className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0"
          style={{ background: "var(--surface-alt)" }}
        >
          {/* LEFT: 16:9 PREVIEW STAGE (7 COLS) */}
          <div
            className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-center border-b lg:border-b-0 lg:border-r overflow-y-auto"
            style={{
              borderColor: "var(--border-subtle)",
              background: "#0b0f17",
            }}
          >
            {/* Stage Header Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span style={{ color: "#e2e8f0", fontSize: "0.82rem", fontWeight: 700 }}>
                  Live Slide Canvas
                </span>
                <span style={{ color: "#64748b" }}>•</span>
                <span style={{ color: "#38bdf8", fontSize: "0.82rem", fontWeight: 600 }}>
                  {currentOption.title}
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-mono)",
                  color: "#94a3b8",
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                1920 × 1080 (16:9)
              </span>
            </div>

            {/* True 16:9 Aspect Ratio Frame */}
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center transition-all"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.7)",
              }}
            >
              {/* Dynamic Background */}
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  background: getCssBackground(),
                }}
              />

              {/* Cinematic Vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.45) 100%)",
                }}
              />

              {/* Slide Content Rendered Inside The 16:9 Frame */}
              <div
                className="relative z-10 w-full h-full p-6 sm:p-10 flex flex-col justify-center items-center text-center select-none"
                style={{ color: "#ffffff" }}
              >
                {selectedTemplate === "title_intro" && (
                  <div className="space-y-3 max-w-lg px-3">
                    <span
                      style={{
                        padding: "3px 12px",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        background: "var(--orange)",
                        color: "#ffffff",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        boxShadow: "0 4px 12px rgba(255, 107, 0, 0.4)",
                      }}
                    >
                      {currentOption.badgeText || "INTRODUCTION"}
                    </span>
                    <h2
                      style={{
                        fontSize: "1.45rem",
                        fontWeight: 800,
                        color: "#ffffff",
                        lineHeight: 1.25,
                        margin: 0,
                        textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      {slideCaption || "Master Timeline Scene Title"}
                    </h2>
                    <div
                      style={{
                        width: "60px",
                        height: "3px",
                        background: "var(--orange)",
                        borderRadius: "2px",
                        margin: "8px auto",
                      }}
                    />
                    <p style={{ fontSize: "0.8rem", color: "#cbd5e1", margin: 0 }}>
                      Strategic Overview & Focal Insight
                    </p>
                  </div>
                )}

                {selectedTemplate === "key_takeaway" && (
                  <div
                    className="w-full max-w-md p-5 rounded-xl shadow-2xl text-left"
                    style={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(20, 184, 166, 0.5)",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "9999px",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          background: "#14b8a6",
                          color: "#042f2e",
                          letterSpacing: "0.05em",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Zap size={12} /> KEY TAKEAWAY
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#2dd4bf", fontFamily: "var(--font-mono)" }}>
                        #CORE_POINT
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "#ffffff",
                        lineHeight: 1.4,
                        margin: 0,
                      }}
                    >
                      {slideCaption || "Core lesson or primary conclusion that viewers must remember."}
                    </p>
                  </div>
                )}

                {selectedTemplate === "quote_slide" && (
                  <div className="space-y-2 max-w-lg px-4">
                    <span
                      style={{
                        fontSize: "3.5rem",
                        fontFamily: "serif",
                        lineHeight: 0.8,
                        color: "#fbbf24",
                        display: "block",
                      }}
                    >
                      “
                    </span>
                    <p
                      style={{
                        fontSize: "1.05rem",
                        fontStyle: "italic",
                        color: "#f8fafc",
                        lineHeight: 1.45,
                        margin: 0,
                      }}
                    >
                      {slideCaption ||
                        "In the heart of innovation, every frame tells an enduring story."}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        paddingTop: "6px",
                      }}
                    >
                      <div style={{ width: "24px", height: "1px", background: "rgba(251, 191, 36, 0.5)" }} />
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#fde68a",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Featured Quote
                      </span>
                      <div style={{ width: "24px", height: "1px", background: "rgba(251, 191, 36, 0.5)" }} />
                    </div>
                  </div>
                )}

                {selectedTemplate === "split_screen" && (
                  <div className="grid grid-cols-2 gap-3 w-full max-w-lg text-left">
                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        background: "rgba(30, 41, 59, 0.85)",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          color: "#818cf8",
                          letterSpacing: "0.05em",
                          marginBottom: "4px",
                        }}
                      >
                        01 • INITIAL STATE
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                        {slideCaption ? `${slideCaption.slice(0, 36)}...` : "Challenge & Context"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        background: "rgba(30, 41, 59, 0.85)",
                        border: "1px solid rgba(16, 185, 129, 0.4)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          color: "#34d399",
                          letterSpacing: "0.05em",
                          marginBottom: "4px",
                        }}
                      >
                        02 • BREAKTHROUGH
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                        Strategic Outcome & Result
                      </div>
                    </div>
                  </div>
                )}

                {selectedTemplate === "outro_cta" && (
                  <div className="space-y-3 max-w-md px-3">
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        background: "#c026d3",
                        color: "#ffffff",
                        letterSpacing: "0.05em",
                      }}
                    >
                      CALL TO ACTION
                    </span>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                      {slideCaption || "Thank you for watching! Subscribe for upcoming chapters."}
                    </p>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 18px",
                        borderRadius: "9999px",
                        background: "#e11d48",
                        color: "#ffffff",
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        boxShadow: "0 6px 16px rgba(225, 29, 72, 0.4)",
                      }}
                    >
                      ▶ SUBSCRIBE & LIKE
                    </div>
                  </div>
                )}

                {selectedTemplate === "blank_slide" && (
                  <div className="space-y-2 max-w-sm text-center">
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        border: "1px dashed rgba(255, 255, 255, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        color: "#94a3b8",
                      }}
                    >
                      <Square size={16} />
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
                      Blank Canvas Slide
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0 }}>
                      Clean canvas ready for custom overlay elements (Text, Badges, Emojis, Shapes).
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stage Bottom Status Chips */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    padding: "3px 9px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#cbd5e1",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Clock size={12} color="#fbbf24" />
                  <span>Duration: {duration.toFixed(1)}s</span>
                </span>
                <span
                  style={{
                    padding: "3px 9px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#cbd5e1",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Palette size={12} color="#38bdf8" />
                  <span>{bgType === "solid" ? "Solid Color" : "Gradient"}</span>
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Pillow Compositor Verified
              </span>
            </div>
          </div>

          {/* RIGHT: CONFIGURATION STUDIO (5 COLS) */}
          <div
            className="lg:col-span-5 flex flex-col min-h-0 overflow-hidden"
            style={{ background: "var(--bg-surface)" }}
          >
            {/* Tab Navigation */}
            <div
              className="p-3 shrink-0"
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
              }}
            >
              <div
                className="grid grid-cols-3 gap-1 p-1 rounded-xl"
                style={{
                  background: "var(--surface-alt)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("layouts")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: "none",
                    background: activeTab === "layouts" ? "var(--orange)" : "transparent",
                    color: activeTab === "layouts" ? "#ffffff" : "var(--text-secondary)",
                    boxShadow: activeTab === "layouts" ? "0 2px 6px rgba(255, 107, 0, 0.25)" : "none",
                  }}
                >
                  <Layout size={14} />
                  <span>Layouts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("background")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: "none",
                    background: activeTab === "background" ? "var(--orange)" : "transparent",
                    color: activeTab === "background" ? "#ffffff" : "var(--text-secondary)",
                    boxShadow: activeTab === "background" ? "0 2px 6px rgba(255, 107, 0, 0.25)" : "none",
                  }}
                >
                  <Palette size={14} />
                  <span>Background</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: "none",
                    background: activeTab === "settings" ? "var(--orange)" : "transparent",
                    color: activeTab === "settings" ? "#ffffff" : "var(--text-secondary)",
                    boxShadow: activeTab === "settings" ? "0 2px 6px rgba(255, 107, 0, 0.25)" : "none",
                  }}
                >
                  <Sliders size={14} />
                  <span>Settings</span>
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* ================= TAB 1: LAYOUTS ================= */}
              {activeTab === "layouts" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Choose Slide Layout
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      6 Templates
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {TEMPLATE_OPTIONS.map((opt) => {
                      const isSelected = selectedTemplate === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectTemplate(opt)}
                          style={{
                            padding: "12px",
                            borderRadius: "12px",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "8px",
                            border: isSelected
                              ? "2px solid var(--orange)"
                              : "1px solid var(--border-default)",
                            background: isSelected
                              ? "var(--orange-subtle)"
                              : "var(--bg-surface)",
                            boxShadow: isSelected ? "0 4px 12px rgba(255, 107, 0, 0.12)" : "none",
                          }}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: isSelected ? "var(--orange)" : "var(--surface-alt)",
                                  color: isSelected ? "#ffffff" : "var(--text-secondary)",
                                }}
                              >
                                {opt.icon}
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                    color: isSelected ? "var(--orange)" : "var(--text-muted)",
                                    display: "block",
                                    lineHeight: 1,
                                  }}
                                >
                                  {opt.category}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    display: "block",
                                    marginTop: "2px",
                                  }}
                                >
                                  {opt.title}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  background: "var(--orange)",
                                  color: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Check size={12} />
                              </div>
                            )}
                          </div>

                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              margin: 0,
                              lineHeight: 1.35,
                            }}
                          >
                            {opt.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= TAB 2: BACKGROUND ================= */}
              {activeTab === "background" && (
                <div className="space-y-4">
                  {/* Mode Selector */}
                  <div className="space-y-1.5">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-secondary)",
                        display: "block",
                      }}
                    >
                      Background Palette Mode
                    </span>
                    <div
                      className="grid grid-cols-3 gap-1.5 p-1 rounded-xl"
                      style={{
                        background: "var(--surface-alt)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setBgType("preset_gradient")}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "none",
                          background: bgType === "preset_gradient" ? "var(--orange)" : "transparent",
                          color: bgType === "preset_gradient" ? "#ffffff" : "var(--text-secondary)",
                        }}
                      >
                        Gradients
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgType("solid")}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "none",
                          background: bgType === "solid" ? "var(--orange)" : "transparent",
                          color: bgType === "solid" ? "#ffffff" : "var(--text-secondary)",
                        }}
                      >
                        Solid Color
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgType("custom_gradient")}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "none",
                          background: bgType === "custom_gradient" ? "var(--orange)" : "transparent",
                          color: bgType === "custom_gradient" ? "#ffffff" : "var(--text-secondary)",
                        }}
                      >
                        Custom 2-Stop
                      </button>
                    </div>
                  </div>

                  {/* Flow Direction (Vertical vs Horizontal) */}
                  {bgType !== "solid" && (
                    <div
                      className="flex items-center justify-between p-2.5 rounded-xl"
                      style={{
                        background: "var(--surface-alt)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                        Gradient Flow:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGradientDirection("vertical")}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            background: gradientDirection === "vertical" ? "var(--text-primary)" : "var(--bg-surface)",
                            color: gradientDirection === "vertical" ? "var(--bg-surface)" : "var(--text-secondary)",
                          }}
                        >
                          Vertical (↓)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGradientDirection("horizontal")}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            background: gradientDirection === "horizontal" ? "var(--text-primary)" : "var(--bg-surface)",
                            color: gradientDirection === "horizontal" ? "var(--bg-surface)" : "var(--text-secondary)",
                          }}
                        >
                          Horizontal (→)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preset Gradients Grid */}
                  {bgType === "preset_gradient" && (
                    <div className="space-y-2">
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: "var(--text-muted)",
                          display: "block",
                        }}
                      >
                        Curated Palettes
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_GRADIENTS.map((g) => {
                          const isCur =
                            selectedGradient[0] === g.stops[0] &&
                            selectedGradient[1] === g.stops[1];
                          return (
                            <button
                              key={g.name}
                              type="button"
                              onClick={() => setSelectedGradient(g.stops)}
                              style={{
                                padding: "8px 10px",
                                borderRadius: "10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                border: isCur
                                  ? "2px solid var(--orange)"
                                  : "1px solid var(--border-default)",
                                background: isCur ? "var(--orange-subtle)" : "var(--bg-surface)",
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "6px",
                                    background: `linear-gradient(135deg, ${g.stops[0]} 0%, ${g.stops[1]} 100%)`,
                                    border: "1px solid rgba(0,0,0,0.1)",
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: "0.78rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {g.name}
                                </span>
                              </div>
                              {isCur && <Check size={14} color="var(--orange)" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Solid Colors */}
                  {bgType === "solid" && (
                    <div className="space-y-3">
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: "var(--text-muted)",
                          display: "block",
                        }}
                      >
                        Solid Swatches
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_SOLIDS.map((s) => {
                          const isCur = solidColor.toLowerCase() === s.hex.toLowerCase();
                          return (
                            <button
                              key={s.hex}
                              type="button"
                              onClick={() => setSolidColor(s.hex)}
                              style={{
                                padding: "8px",
                                borderRadius: "10px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "6px",
                                cursor: "pointer",
                                border: isCur
                                  ? "2px solid var(--orange)"
                                  : "1px solid var(--border-default)",
                                background: isCur ? "var(--orange-subtle)" : "var(--bg-surface)",
                              }}
                            >
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "6px",
                                  backgroundColor: s.hex,
                                  border: "1px solid rgba(0,0,0,0.15)",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {s.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div
                        className="p-3 rounded-xl flex items-center justify-between gap-3"
                        style={{
                          background: "var(--surface-alt)",
                          border: "1px solid var(--border-default)",
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="color"
                            value={solidColor}
                            onChange={(e) => setSolidColor(e.target.value)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              border: "1px solid var(--border-default)",
                              padding: 0,
                              background: "transparent",
                            }}
                          />
                          <div>
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
                              Custom Hex Color
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              Click palette to pick
                            </span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={solidColor}
                          onChange={(e) => setSolidColor(e.target.value)}
                          className="input-text uppercase font-mono text-center"
                          style={{ maxWidth: "100px", padding: "6px 8px", fontSize: "0.75rem" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Custom 2-Stop Gradient */}
                  {bgType === "custom_gradient" && (
                    <div className="space-y-3">
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: "var(--text-muted)",
                          display: "block",
                        }}
                      >
                        Configure Gradient Stops
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className="p-3 rounded-xl space-y-2"
                          style={{
                            background: "var(--surface-alt)",
                            border: "1px solid var(--border-default)",
                          }}
                        >
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
                            Stop 1 (Start)
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customStart}
                              onChange={(e) => setCustomStart(e.target.value)}
                              style={{ width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer" }}
                            />
                            <input
                              type="text"
                              value={customStart}
                              onChange={(e) => setCustomStart(e.target.value)}
                              className="input-text uppercase font-mono text-center"
                              style={{ padding: "4px 6px", fontSize: "0.72rem" }}
                            />
                          </div>
                        </div>

                        <div
                          className="p-3 rounded-xl space-y-2"
                          style={{
                            background: "var(--surface-alt)",
                            border: "1px solid var(--border-default)",
                          }}
                        >
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
                            Stop 2 (End)
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customEnd}
                              onChange={(e) => setCustomEnd(e.target.value)}
                              style={{ width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer" }}
                            />
                            <input
                              type="text"
                              value={customEnd}
                              onChange={(e) => setCustomEnd(e.target.value)}
                              className="input-text uppercase font-mono text-center"
                              style={{ padding: "4px 6px", fontSize: "0.72rem" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 3: SETTINGS ================= */}
              {activeTab === "settings" && (
                <div className="space-y-4">
                  {/* Narration Caption */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Type size={14} color="var(--orange)" />
                        <span>Slide Caption & Narration</span>
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {slideCaption.length} chars
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={slideCaption}
                      onChange={(e) => setSlideCaption(e.target.value)}
                      placeholder="e.g. Chapter 2: The Three Strategic Pillars..."
                      className="input-text"
                      style={{ resize: "none", fontSize: "0.82rem", lineHeight: 1.4 }}
                    />

                    {/* Suggestions */}
                    <div className="space-y-1">
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
                        Quick Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_CAPTIONS.map((qc) => (
                          <button
                            key={qc}
                            type="button"
                            onClick={() => setSlideCaption(qc)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              background: "var(--surface-alt)",
                              border: "1px solid var(--border-default)",
                              color: "var(--text-secondary)",
                              cursor: "pointer",
                            }}
                          >
                            {qc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Duration Controls */}
                  <div className="space-y-2.5 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center justify-between">
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Clock size={14} color="var(--orange)" />
                        <span>Slide Duration</span>
                      </span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--orange)", fontFamily: "var(--font-mono)" }}>
                        {duration.toFixed(1)}s
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[3.0, 5.0, 8.0, 10.0].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDuration(d)}
                          style={{
                            padding: "6px",
                            borderRadius: "8px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                            border: duration === d ? "1px solid var(--orange)" : "1px solid var(--border-default)",
                            background: duration === d ? "var(--orange)" : "var(--surface-alt)",
                            color: duration === d ? "#ffffff" : "var(--text-primary)",
                          }}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>

                    <div className="pt-1">
                      <input
                        type="range"
                        min={1.0}
                        max={15.0}
                        step={0.5}
                        value={duration}
                        onChange={(e) => setDuration(parseFloat(e.target.value))}
                        className="w-full cursor-pointer h-2 rounded-lg"
                        style={{ accentColor: "var(--orange)" }}
                      />
                      <div className="flex justify-between text-[11px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>
                        <span>1s (Brisk)</span>
                        <span>5s (Standard)</span>
                        <span>15s (Detailed)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div
          className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0"
          style={{
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--surface-alt)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {activeScene && (
              <button
                type="button"
                onClick={handleApplyCurrent}
                disabled={loading}
                className="btn-secondary text-xs"
                title="Replace visual on the currently selected scene without altering timeline duration"
              >
                <Palette size={14} color="var(--orange)" />
                <span>Apply to Current Scene</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddSlide}
              disabled={loading}
              className="btn-primary text-xs"
            >
              <Plus size={15} />
              <span>
                {loading
                  ? "Inserting Slide..."
                  : `+ Insert New Slide (${duration.toFixed(1)}s)`}
              </span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
