import React, { useState, useEffect } from "react";
import {
  Trash2,
  Type,
  Smile,
  Tag,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  ChevronUp,
  Copy,
  ArrowUp,
  ArrowDown,
  Circle,
  GripHorizontal,
  Crosshair,
} from "lucide-react";
import type { Scene, SceneElement } from "../../types/project";

export interface OverlayElementsInspectorProps {
  scene: Scene;
  onUpdateElements: (elements: SceneElement[]) => void;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
}

const EMOJI_PALETTE = [
  "✨", "🚀", "💡", "🔥", "⚡", "🔔", "💯", "🎯",
  "⭐", "🎬", "❤️", "👏", "🏆", "📈", "🎨", "🤖",
  "💥", "💎", "👀", "🧠", "💰", "📌", "🚨", "👇"
];

const BADGE_PRESETS = [
  { label: "⚡ KEY TAKEAWAY", bg: "#0d9488", color: "#ffffff" },
  { label: "💡 PRO TIP", bg: "#4f46e5", color: "#ffffff" },
  { label: "🚨 BREAKING", bg: "#e11d48", color: "#ffffff" },
  { label: "📌 STEP 1", bg: "#7c3aed", color: "#ffffff" },
  { label: "⭐ MUST WATCH", bg: "#d97706", color: "#ffffff" },
  { label: "💎 PRO INSIGHT", bg: "#2563eb", color: "#ffffff" },
];

const TEXT_PRESETS = [
  { label: "Headline", content: "Headline Title", size: 44, weight: "bold" as const },
  { label: "Subtitle", content: "Supporting subtitle description", size: 28, weight: "normal" as const },
  { label: "Stat Callout", content: "+148% GROWTH", size: 38, weight: "bold" as const },
  { label: "Lower Third", content: "Guest Speaker • Expert Analyst", size: 24, weight: "normal" as const },
];

const SHAPE_PRESETS = [
  {
    label: "Frosted Card",
    shape: "rectangle" as const,
    width: 280,
    height: 140,
    radius: 16,
    bg: "rgba(15, 23, 42, 0.85)",
  },
  {
    label: "Accent Pill",
    shape: "pill" as const,
    width: 220,
    height: 54,
    radius: 999,
    bg: "rgba(79, 70, 229, 0.9)",
  },
  {
    label: "Focus Circle",
    shape: "circle" as const,
    width: 120,
    height: 120,
    radius: 999,
    bg: "rgba(13, 148, 136, 0.9)",
  },
  {
    label: "Dark Plate",
    shape: "rectangle" as const,
    width: 320,
    height: 72,
    radius: 10,
    bg: "rgba(0, 0, 0, 0.75)",
  },
];

const COLOR_SWATCHES = [
  "#ffffff", "#f8fafc", "#facc15", "#fb923c",
  "#f43f5e", "#a855f7", "#6366f1", "#38bdf8",
  "#2dd4bf", "#4ade80", "#1e293b", "#0f172a"
];

export const OverlayElementsInspector: React.FC<OverlayElementsInspectorProps> = ({
  scene,
  onUpdateElements,
  selectedElementId,
  onSelectElement,
}) => {
  const elements = scene.elements || [];
  const [expandedId, setExpandedId] = useState<string | null>(selectedElementId || elements[0]?.id || null);
  const [activeDrawer, setActiveDrawer] = useState<"text" | "emoji" | "badge" | "shape" | null>(null);

  // Sync expanded state with external selection
  useEffect(() => {
    if (selectedElementId) {
      setExpandedId(selectedElementId);
    }
  }, [selectedElementId]);

  const toggleSelect = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (onSelectElement) onSelectElement(next);
  };

  const handleDragStart = (e: React.DragEvent, payload: Partial<SceneElement>) => {
    const dataStr = JSON.stringify(payload);
    e.dataTransfer.setData("application/x-scenora-element", dataStr);
    e.dataTransfer.setData("text/plain", dataStr);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleAddText = (
    content = "Headline Title",
    fontSize = 38,
    fontWeight: "normal" | "bold" = "bold",
    bg = "transparent",
    color = "#ffffff"
  ) => {
    const newElem: SceneElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "text",
      content,
      x: 50,
      y: 50,
      font_size: fontSize,
      font_weight: fontWeight,
      color,
      bg_color: bg,
      padding: bg !== "transparent" ? 12 : 0,
      border_radius: 8,
      align: "center",
    };
    const updated = [...elements, newElem];
    onUpdateElements(updated);
    setExpandedId(newElem.id);
    if (onSelectElement) onSelectElement(newElem.id);
    setActiveDrawer(null);
  };

  const handleAddBadge = (label: string, bg: string, color = "#ffffff") => {
    const newElem: SceneElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "badge",
      content: label,
      x: 50,
      y: 50,
      font_size: 22,
      font_weight: "bold",
      color,
      bg_color: bg,
      padding: 12,
      border_radius: 999,
      align: "center",
    };
    const updated = [...elements, newElem];
    onUpdateElements(updated);
    setExpandedId(newElem.id);
    if (onSelectElement) onSelectElement(newElem.id);
    setActiveDrawer(null);
  };

  const handleAddEmoji = (emoji: string) => {
    const newElem: SceneElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "emoji",
      content: emoji,
      x: 50,
      y: 40,
      font_size: 64,
    };
    const updated = [...elements, newElem];
    onUpdateElements(updated);
    setExpandedId(newElem.id);
    if (onSelectElement) onSelectElement(newElem.id);
    setActiveDrawer(null);
  };

  const handleAddShape = (
    shape: "rectangle" | "pill" | "circle" = "rectangle",
    width = 280,
    height = 140,
    radius = 16,
    bg = "rgba(15, 23, 42, 0.85)"
  ) => {
    const newElem: SceneElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "shape",
      content: "",
      shape,
      x: 50,
      y: 50,
      width,
      height,
      bg_color: bg,
      border_radius: radius,
    };
    const updated = [...elements, newElem];
    onUpdateElements(updated);
    setExpandedId(newElem.id);
    if (onSelectElement) onSelectElement(newElem.id);
    setActiveDrawer(null);
  };

  const handleUpdateElement = (id: string, patch: Partial<SceneElement>) => {
    const updated = elements.map((el) => (el.id === id ? { ...el, ...patch } : el));
    onUpdateElements(updated);
  };

  const handleDeleteElement = (id: string) => {
    const updated = elements.filter((el) => el.id !== id);
    onUpdateElements(updated);
    if (expandedId === id) {
      setExpandedId(null);
      if (onSelectElement) onSelectElement(null);
    }
  };

  const handleDuplicateElement = (elem: SceneElement) => {
    const clone: SceneElement = {
      ...elem,
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: Math.min(92, Math.max(8, elem.x + 4)),
      y: Math.min(92, Math.max(8, elem.y + 4)),
    };
    const updated = [...elements, clone];
    onUpdateElements(updated);
    setExpandedId(clone.id);
    if (onSelectElement) onSelectElement(clone.id);
  };

  const handleMoveLayer = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= elements.length) return;
    const next = [...elements];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    onUpdateElements(next);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Slide Overlays
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              {elements.length} {elements.length === 1 ? "Element" : "Elements"}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Click to add or drag directly onto the video canvas to place anywhere.
          </p>
        </div>
      </div>

      {/* 4 Feature Creation Shelf */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Feature 1: Text Callout */}
        <div
          draggable
          onDragStart={(e) =>
            handleDragStart(e, {
              type: "text",
              content: "Headline Title",
              font_size: 38,
              font_weight: "bold",
              color: "#ffffff",
              bg_color: "transparent",
              align: "center",
            })
          }
          className={`relative group rounded-xl p-3 border transition-all cursor-grab active:cursor-grabbing select-none ${
            activeDrawer === "text"
              ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10"
              : "bg-indigo-950/20 hover:bg-indigo-950/35 border-indigo-500/30 hover:border-indigo-500/60"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Type size={16} />
            </div>
            <span className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 flex items-center gap-1 border border-indigo-500/30">
              <GripHorizontal size={10} /> Drag
            </span>
          </div>
          <div className="mt-2.5">
            <div className="font-bold text-[13px] text-white flex items-center gap-1">
              <span>+ Text</span>
            </div>
            <p className="text-[10px] text-indigo-200/70 mt-0.5 leading-tight">
              Headlines & titles
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-indigo-500/20 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleAddText()}
              className="flex-1 py-1 px-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition-colors text-center"
            >
              Add Center
            </button>
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === "text" ? null : "text")}
              className="py-1 px-2 rounded-md bg-white/10 hover:bg-white/20 text-indigo-200 text-[10px] transition-colors"
              title="View text presets"
            >
              {activeDrawer === "text" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Feature 2: Emoji Sticker */}
        <div
          draggable
          onDragStart={(e) =>
            handleDragStart(e, {
              type: "emoji",
              content: "✨",
              font_size: 64,
            })
          }
          className={`relative group rounded-xl p-3 border transition-all cursor-grab active:cursor-grabbing select-none ${
            activeDrawer === "emoji"
              ? "bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-500/10"
              : "bg-amber-950/20 hover:bg-amber-950/35 border-amber-500/30 hover:border-amber-500/60"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <Smile size={16} />
            </div>
            <span className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 flex items-center gap-1 border border-amber-500/30">
              <GripHorizontal size={10} /> Drag
            </span>
          </div>
          <div className="mt-2.5">
            <div className="font-bold text-[13px] text-white flex items-center gap-1">
              <span>+ Emoji</span>
            </div>
            <p className="text-[10px] text-amber-200/70 mt-0.5 leading-tight">
              Reactions & stickers
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleAddEmoji("✨")}
              className="flex-1 py-1 px-2 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-semibold transition-colors text-center"
            >
              Add ✨
            </button>
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === "emoji" ? null : "emoji")}
              className="py-1 px-2 rounded-md bg-white/10 hover:bg-white/20 text-amber-200 text-[10px] transition-colors"
              title="Open emoji sticker drawer"
            >
              {activeDrawer === "emoji" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Feature 3: Pill Badge */}
        <div
          draggable
          onDragStart={(e) =>
            handleDragStart(e, {
              type: "badge",
              content: "⚡ KEY TAKEAWAY",
              bg_color: "#0d9488",
              color: "#ffffff",
              font_size: 22,
              font_weight: "bold",
              padding: 12,
              border_radius: 999,
              align: "center",
            })
          }
          className={`relative group rounded-xl p-3 border transition-all cursor-grab active:cursor-grabbing select-none ${
            activeDrawer === "badge"
              ? "bg-teal-950/40 border-teal-500/60 shadow-lg shadow-teal-500/10"
              : "bg-teal-950/20 hover:bg-teal-950/35 border-teal-500/30 hover:border-teal-500/60"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/30">
              <Tag size={16} />
            </div>
            <span className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 flex items-center gap-1 border border-teal-500/30">
              <GripHorizontal size={10} /> Drag
            </span>
          </div>
          <div className="mt-2.5">
            <div className="font-bold text-[13px] text-white flex items-center gap-1">
              <span>+ Badge</span>
            </div>
            <p className="text-[10px] text-teal-200/70 mt-0.5 leading-tight">
              Pills & callout tags
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-teal-500/20 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleAddBadge("⚡ KEY TAKEAWAY", "#0d9488")}
              className="flex-1 py-1 px-2 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-semibold transition-colors text-center"
            >
              Add Badge
            </button>
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === "badge" ? null : "badge")}
              className="py-1 px-2 rounded-md bg-white/10 hover:bg-white/20 text-teal-200 text-[10px] transition-colors"
              title="Open badge presets"
            >
              {activeDrawer === "badge" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Feature 4: Container Shape */}
        <div
          draggable
          onDragStart={(e) =>
            handleDragStart(e, {
              type: "shape",
              content: "",
              shape: "rectangle",
              width: 280,
              height: 140,
              bg_color: "rgba(15, 23, 42, 0.85)",
              border_radius: 16,
            })
          }
          className={`relative group rounded-xl p-3 border transition-all cursor-grab active:cursor-grabbing select-none ${
            activeDrawer === "shape"
              ? "bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10"
              : "bg-cyan-950/20 hover:bg-cyan-950/35 border-cyan-500/30 hover:border-cyan-500/60"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
              <Square size={16} />
            </div>
            <span className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 flex items-center gap-1 border border-cyan-500/30">
              <GripHorizontal size={10} /> Drag
            </span>
          </div>
          <div className="mt-2.5">
            <div className="font-bold text-[13px] text-white flex items-center gap-1">
              <span>+ Shape</span>
            </div>
            <p className="text-[10px] text-cyan-200/70 mt-0.5 leading-tight">
              Backplates & cards
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleAddShape()}
              className="flex-1 py-1 px-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-semibold transition-colors text-center"
            >
              Add Card
            </button>
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === "shape" ? null : "shape")}
              className="py-1 px-2 rounded-md bg-white/10 hover:bg-white/20 text-cyan-200 text-[10px] transition-colors"
              title="Open shape presets"
            >
              {activeDrawer === "shape" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Preset Drawers */}
      {activeDrawer === "text" && (
        <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-zinc-900/60 shadow-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
            <span>Choose or drag a text style:</span>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TEXT_PRESETS.map((tp) => (
              <div
                key={tp.label}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, {
                    type: "text",
                    content: tp.content,
                    font_size: tp.size,
                    font_weight: tp.weight,
                    color: "#ffffff",
                    bg_color: "transparent",
                    align: "center",
                  })
                }
                onClick={() => handleAddText(tp.content, tp.size, tp.weight)}
                className="p-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-400/50 cursor-grab active:cursor-grabbing transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-indigo-400 tracking-wider">
                    {tp.label}
                  </span>
                  <span className="text-[9px] text-zinc-400 group-hover:text-indigo-300">
                    {tp.size}px
                  </span>
                </div>
                <div className="font-semibold text-white mt-1 text-xs truncate">
                  {tp.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeDrawer === "emoji" && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/40 to-zinc-900/60 shadow-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold">
            <span>Click or drag any emoji onto the canvas:</span>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {EMOJI_PALETTE.map((emoji) => (
              <button
                key={emoji}
                type="button"
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, {
                    type: "emoji",
                    content: emoji,
                    font_size: 64,
                  })
                }
                onClick={() => handleAddEmoji(emoji)}
                className="text-2xl p-2 rounded-lg bg-white/5 hover:bg-white/15 hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing transition-all text-center border border-transparent hover:border-amber-400/40"
                title={`Drag or click ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeDrawer === "badge" && (
        <div className="p-3.5 rounded-xl border border-teal-500/30 bg-gradient-to-b from-teal-950/40 to-zinc-900/60 shadow-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-teal-300 font-semibold">
            <span>Click or drag badge to position:</span>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {BADGE_PRESETS.map((bp) => (
              <button
                key={bp.label}
                type="button"
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, {
                    type: "badge",
                    content: bp.label,
                    bg_color: bp.bg,
                    color: bp.color,
                    font_size: 22,
                    font_weight: "bold",
                    padding: 12,
                    border_radius: 999,
                    align: "center",
                  })
                }
                onClick={() => handleAddBadge(bp.label, bp.bg, bp.color)}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:scale-105 hover:shadow-lg cursor-grab active:cursor-grabbing flex items-center gap-1.5"
                style={{ background: bp.bg, boxShadow: `0 4px 14px ${bp.bg}55` }}
              >
                <GripHorizontal size={11} className="opacity-70" />
                <span>{bp.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeDrawer === "shape" && (
        <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/40 to-zinc-900/60 shadow-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-cyan-300 font-semibold">
            <span>Click or drag backplate shape:</span>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SHAPE_PRESETS.map((sp) => (
              <div
                key={sp.label}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, {
                    type: "shape",
                    content: "",
                    shape: sp.shape,
                    width: sp.width,
                    height: sp.height,
                    bg_color: sp.bg,
                    border_radius: sp.radius,
                  })
                }
                onClick={() => handleAddShape(sp.shape, sp.width, sp.height, sp.radius, sp.bg)}
                className="p-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/50 cursor-grab active:cursor-grabbing transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="text-[10px] font-semibold uppercase text-cyan-400 tracking-wider">
                    {sp.label}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {sp.width} × {sp.height}px
                  </div>
                </div>
                <div
                  className="w-10 h-7 border border-white/20 shadow-inner flex items-center justify-center text-[9px] text-white/60"
                  style={{
                    background: sp.bg,
                    borderRadius: sp.shape === "circle" ? "50%" : sp.shape === "pill" ? "999px" : "6px",
                  }}
                >
                  {sp.shape === "circle" ? <Circle size={12} /> : <Square size={12} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer List / Active Slide Elements */}
      <div className="pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Slide Layer Stack
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {elements.length === 0 ? "Empty canvas" : "Top layer renders on top"}
          </span>
        </div>

        {elements.length === 0 ? (
          <div className="mt-3 p-6 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <Crosshair size={20} />
            </div>
            <div className="text-xs font-semibold text-white">
              No overlay elements on this slide yet
            </div>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
              Drag any tool card from above directly onto the video preview to place text, emojis, badges, or shapes.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {elements.map((elem, idx) => {
              const isExpanded = expandedId === elem.id;
              const isSelected = selectedElementId === elem.id;

              return (
                <div
                  key={elem.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isSelected
                      ? "border-cyan-400/80 bg-cyan-950/20 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-white/20"
                  }`}
                >
                  {/* Layer Header Row */}
                  <div
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 select-none"
                    onClick={() => toggleSelect(elem.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="capitalize font-bold text-white text-xs">
                          {elem.type}:
                        </span>
                        <span className="font-normal text-zinc-300 truncate max-w-[130px] text-xs">
                          {elem.type === "shape"
                            ? `${elem.shape || "rectangle"} (${elem.width || 280}×${elem.height || 140})`
                            : elem.content || "Empty"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Layer reorder buttons */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayer(idx, "down");
                        }}
                        disabled={idx === 0}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Send Backward"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayer(idx, "up");
                        }}
                        disabled={idx === elements.length - 1}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Bring Forward"
                      >
                        <ArrowUp size={13} />
                      </button>

                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateElement(elem);
                        }}
                        className="p-1 text-zinc-400 hover:text-indigo-300 transition-colors"
                        title="Duplicate layer"
                      >
                        <Copy size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteElement(elem.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                        title="Delete layer"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Expand / Collapse */}
                      <div className="text-zinc-400 ml-0.5">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Properties */}
                  {isExpanded && (
                    <div className="p-3 pt-0 border-t border-[var(--border-subtle)] space-y-3 mt-1 bg-black/25">
                      {/* Content Input */}
                      {elem.type !== "shape" && (
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                            {elem.type === "emoji" ? "Emoji Sticker" : "Text Content"}
                          </label>
                          <input
                            type="text"
                            value={elem.content}
                            onChange={(e) => handleUpdateElement(elem.id, { content: e.target.value })}
                            className="input-text text-xs w-full"
                            placeholder={elem.type === "emoji" ? "✨" : "Enter text here..."}
                          />
                        </div>
                      )}

                      {/* Position Sliders with Center buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] mb-1">
                            <span>Horizontal (X)</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-zinc-300 font-semibold">{Math.round(elem.x)}%</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateElement(elem.id, { x: 50 })}
                                className="text-[9px] px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300"
                                title="Center Horizontally"
                              >
                                50%
                              </button>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="95"
                            value={elem.x}
                            onChange={(e) => handleUpdateElement(elem.id, { x: parseFloat(e.target.value) })}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] mb-1">
                            <span>Vertical (Y)</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-zinc-300 font-semibold">{Math.round(elem.y)}%</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateElement(elem.id, { y: 50 })}
                                className="text-[9px] px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300"
                                title="Center Vertically"
                              >
                                50%
                              </button>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="95"
                            value={elem.y}
                            onChange={(e) => handleUpdateElement(elem.id, { y: parseFloat(e.target.value) })}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Dimensions for Shape */}
                      {elem.type === "shape" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                                <span>Width</span>
                                <span className="font-mono text-zinc-300">{elem.width || 280}px</span>
                              </div>
                              <input
                                type="range"
                                min="60"
                                max="700"
                                step="10"
                                value={elem.width || 280}
                                onChange={(e) =>
                                  handleUpdateElement(elem.id, { width: parseInt(e.target.value, 10) })
                                }
                                className="w-full accent-cyan-500 cursor-pointer"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                                <span>Height</span>
                                <span className="font-mono text-zinc-300">{elem.height || 140}px</span>
                              </div>
                              <input
                                type="range"
                                min="30"
                                max="500"
                                step="10"
                                value={elem.height || 140}
                                onChange={(e) =>
                                  handleUpdateElement(elem.id, { height: parseInt(e.target.value, 10) })
                                }
                                className="w-full accent-cyan-500 cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                                Shape Style
                              </label>
                              <select
                                value={elem.shape || "rectangle"}
                                onChange={(e) =>
                                  handleUpdateElement(elem.id, {
                                    shape: e.target.value as "rectangle" | "pill" | "circle",
                                  })
                                }
                                className="input-text text-xs w-full"
                              >
                                <option value="rectangle">Rounded Rectangle</option>
                                <option value="pill">Pill / Capsule</option>
                                <option value="circle">Circle / Halo</option>
                              </select>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                                <span>Corner Radius</span>
                                <span className="font-mono text-zinc-300">{elem.border_radius ?? 16}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="60"
                                value={elem.border_radius ?? 16}
                                onChange={(e) =>
                                  handleUpdateElement(elem.id, { border_radius: parseInt(e.target.value, 10) })
                                }
                                className="w-full accent-cyan-500 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Font Size & Alignment for Text/Badge/Emoji */}
                      {elem.type !== "shape" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                              <span>Font Size</span>
                              <span className="font-mono text-zinc-300">{elem.font_size || 36}px</span>
                            </div>
                            <input
                              type="range"
                              min="14"
                              max="110"
                              value={elem.font_size || 36}
                              onChange={(e) =>
                                handleUpdateElement(elem.id, { font_size: parseInt(e.target.value, 10) })
                              }
                              className="w-full accent-indigo-500 cursor-pointer"
                            />
                          </div>

                          {elem.type in { text: 1, badge: 1 } && (
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                                Text Alignment
                              </label>
                              <div className="flex items-center gap-1 border border-white/15 rounded-lg p-0.5 bg-black/30">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateElement(elem.id, { align: "left" })}
                                  className={`flex-1 py-1 rounded flex justify-center transition-colors ${
                                    elem.align === "left" ? "bg-indigo-600 text-white font-bold" : "text-zinc-400 hover:text-white"
                                  }`}
                                  title="Align Left"
                                >
                                  <AlignLeft size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateElement(elem.id, { align: "center" })}
                                  className={`flex-1 py-1 rounded flex justify-center transition-colors ${
                                    elem.align === "center" || !elem.align
                                      ? "bg-indigo-600 text-white font-bold"
                                      : "text-zinc-400 hover:text-white"
                                  }`}
                                  title="Align Center"
                                >
                                  <AlignCenter size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateElement(elem.id, { align: "right" })}
                                  className={`flex-1 py-1 rounded flex justify-center transition-colors ${
                                    elem.align === "right" ? "bg-indigo-600 text-white font-bold" : "text-zinc-400 hover:text-white"
                                  }`}
                                  title="Align Right"
                                >
                                  <AlignRight size={13} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Color Palette & Background Controls */}
                      {elem.type in { text: 1, badge: 1, shape: 1 } && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          {/* Text Color (Text & Badge) */}
                          {elem.type !== "shape" && (
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                                Text Color
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={elem.color || "#ffffff"}
                                  onChange={(e) => handleUpdateElement(elem.id, { color: e.target.value })}
                                  className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                                />
                                <span className="font-mono text-[10px] text-zinc-300">
                                  {elem.color || "#ffffff"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Background Color */}
                          <div className={elem.type === "shape" ? "col-span-2" : ""}>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                {elem.type === "shape" ? "Shape Fill Color" : "Background Box"}
                              </label>
                              {elem.type !== "shape" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateElement(elem.id, {
                                      bg_color:
                                        elem.bg_color === "transparent" || !elem.bg_color
                                          ? "#4f46e5"
                                          : "transparent",
                                    })
                                  }
                                  className="text-[10px] text-indigo-400 hover:underline"
                                >
                                  {elem.bg_color === "transparent" || !elem.bg_color ? "+ Add Fill" : "Transparent"}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={
                                  elem.bg_color && elem.bg_color !== "transparent"
                                    ? elem.bg_color.startsWith("rgba")
                                      ? "#4f46e5"
                                      : elem.bg_color
                                    : "#4f46e5"
                                }
                                onChange={(e) => handleUpdateElement(elem.id, { bg_color: e.target.value })}
                                className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                              />
                              <div className="flex items-center gap-1">
                                {COLOR_SWATCHES.slice(0, 6).map((swatch) => (
                                  <button
                                    key={swatch}
                                    type="button"
                                    onClick={() => handleUpdateElement(elem.id, { bg_color: swatch })}
                                    className="w-4 h-4 rounded-full border border-white/20 hover:scale-125 transition-transform"
                                    style={{ background: swatch }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
