import React, { useState } from "react";
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
} from "lucide-react";
import type { Scene, SceneElement } from "../../types/project";

export interface OverlayElementsInspectorProps {
  scene: Scene;
  onUpdateElements: (elements: SceneElement[]) => void;
}

const EMOJI_PALETTE = ["✨", "🚀", "💡", "🔥", "⚡", "🔔", "💯", "🎯", "⭐", "🎬", "❤️", "👏", "🏆", "📈", "🎨", "🤖"];

const BADGE_PRESETS = [
  { label: "PRO TIP", bg: "#4f46e5", color: "#ffffff" },
  { label: "KEY TAKEAWAY", bg: "#0d9488", color: "#ffffff" },
  { label: "BREAKING", bg: "#e11d48", color: "#ffffff" },
  { label: "STEP 1", bg: "#7c3aed", color: "#ffffff" },
  { label: "IMPORTANT", bg: "#d97706", color: "#ffffff" },
];

export const OverlayElementsInspector: React.FC<OverlayElementsInspectorProps> = ({
  scene,
  onUpdateElements,
}) => {
  const elements = scene.elements || [];
  const [expandedId, setExpandedId] = useState<string | null>(elements[0]?.id || null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBadgePresets, setShowBadgePresets] = useState(false);

  const handleAddText = (type: "text" | "badge" = "text", presetContent = "New Text Callout", bg = "#4f46e5") => {
    const newElem: SceneElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      content: presetContent,
      x: 50,
      y: 50,
      font_size: type === "badge" ? 24 : 36,
      font_weight: type === "badge" ? "bold" : "normal",
      color: "#ffffff",
      bg_color: type === "badge" ? bg : "transparent",
      padding: type === "badge" ? 14 : 8,
      border_radius: type === "badge" ? 999 : 8,
      align: "center",
    };
    const updated = [...elements, newElem];
    onUpdateElements(updated);
    setExpandedId(newElem.id);
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
    setShowEmojiPicker(false);
    setExpandedId(newElem.id);
  };

  const handleAddShape = () => {
    const newElem: SceneElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "shape",
      content: "",
      x: 50,
      y: 50,
      width: 260,
      height: 120,
      bg_color: "rgba(15, 23, 42, 0.85)",
      border_radius: 16,
      shape: "rectangle",
    };
    const updated = [...elements, newElem];
    onUpdateElements(updated);
    setExpandedId(newElem.id);
  };

  const handleUpdateElement = (id: string, patch: Partial<SceneElement>) => {
    const updated = elements.map((el) => (el.id === id ? { ...el, ...patch } : el));
    onUpdateElements(updated);
  };

  const handleDeleteElement = (id: string) => {
    const updated = elements.filter((el) => el.id !== id);
    onUpdateElements(updated);
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Overlay Elements ({elements.length})
          </h4>
          <p className="text-[11px] text-[var(--text-muted)]">
            Place customizable text, badges, emojis, and shapes on this slide canvas.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => handleAddText("text", "Headline Text")}
          className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1.5"
          title="Add text element"
        >
          <Type size={13} />
          <span>+ Text</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowBadgePresets(false);
          }}
          className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1.5 relative"
          title="Add emoji sticker"
        >
          <Smile size={13} />
          <span>+ Emoji</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowBadgePresets(!showBadgePresets);
            setShowEmojiPicker(false);
          }}
          className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1.5"
          title="Add pill badge"
        >
          <Tag size={13} />
          <span>+ Badge</span>
        </button>

        <button
          type="button"
          onClick={handleAddShape}
          className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1.5"
          title="Add container card or shape"
        >
          <Square size={13} />
          <span>+ Shape</span>
        </button>
      </div>

      {/* Badge Presets Popover */}
      {showBadgePresets && (
        <div className="p-3 rounded-xl border bg-[var(--bg-app)] border-[var(--border-subtle)] shadow-xl flex flex-wrap gap-2">
          {BADGE_PRESETS.map((bp) => (
            <button
              key={bp.label}
              type="button"
              onClick={() => {
                handleAddText("badge", bp.label, bp.bg);
                setShowBadgePresets(false);
              }}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white transition-transform hover:scale-105"
              style={{ background: bp.bg }}
            >
              {bp.label}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="p-3 rounded-xl border bg-[var(--bg-app)] border-[var(--border-subtle)] shadow-xl grid grid-cols-8 gap-2">
          {EMOJI_PALETTE.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="text-xl p-1.5 rounded-lg hover:bg-white/10 transition-colors text-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Elements List */}
      {elements.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] space-y-1">
          <div>No overlay elements on this slide yet.</div>
          <div className="text-[11px]">
            Click <strong>+ Text</strong>, <strong>+ Emoji</strong>, or <strong>+ Badge</strong> above to place elements on the canvas.
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {elements.map((elem, idx) => {
            const isExpanded = expandedId === elem.id;
            return (
              <div
                key={elem.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden transition-all text-xs"
              >
                {/* Element Row Header */}
                <div
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                  onClick={() => setExpandedId(isExpanded ? null : elem.id)}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="capitalize text-[var(--text-primary)]">
                      {elem.type}:{" "}
                      <span className="font-normal text-[var(--text-muted)] truncate max-w-[120px] inline-block align-bottom">
                        {elem.content || elem.shape || "Shape"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteElement(elem.id);
                      }}
                      className="text-[var(--text-muted)] hover:text-rose-400 p-1"
                      title="Delete element"
                    >
                      <Trash2 size={13} />
                    </button>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {/* Expanded Properties Editor */}
                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-[var(--border-subtle)] space-y-3 mt-1 bg-[var(--bg-app)]/50">
                    {/* Content Input */}
                    {elem.type !== "shape" && (
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                          {elem.type === "emoji" ? "Emoji Character" : "Content Text"}
                        </label>
                        <input
                          type="text"
                          value={elem.content}
                          onChange={(e) => handleUpdateElement(elem.id, { content: e.target.value })}
                          className="input-text text-xs"
                        />
                      </div>
                    )}

                    {/* Position Sliders */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                          <span>Position X</span>
                          <span>{Math.round(elem.x)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={elem.x}
                          onChange={(e) => handleUpdateElement(elem.id, { x: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                          <span>Position Y</span>
                          <span>{Math.round(elem.y)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={elem.y}
                          onChange={(e) => handleUpdateElement(elem.id, { y: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Size & Weight */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                          <span>Size</span>
                          <span>{elem.font_size || 36}px</span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="96"
                          value={elem.font_size || 36}
                          onChange={(e) => handleUpdateElement(elem.id, { font_size: parseInt(e.target.value, 10) })}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      {elem.type in { text: 1, badge: 1 } && (
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                            Alignment
                          </label>
                          <div className="flex items-center gap-1 border border-[var(--border-subtle)] rounded-lg p-0.5 bg-[var(--bg-surface)]">
                            <button
                              type="button"
                              onClick={() => handleUpdateElement(elem.id, { align: "left" })}
                              className={`flex-1 py-1 rounded flex justify-center ${elem.align === "left" ? "bg-indigo-600 text-white" : "text-[var(--text-muted)]"}`}
                            >
                              <AlignLeft size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateElement(elem.id, { align: "center" })}
                              className={`flex-1 py-1 rounded flex justify-center ${elem.align === "center" || !elem.align ? "bg-indigo-600 text-white" : "text-[var(--text-muted)]"}`}
                            >
                              <AlignCenter size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateElement(elem.id, { align: "right" })}
                              className={`flex-1 py-1 rounded flex justify-center ${elem.align === "right" ? "bg-indigo-600 text-white" : "text-[var(--text-muted)]"}`}
                            >
                              <AlignRight size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Color and Background Settings */}
                    {elem.type in { text: 1, badge: 1, shape: 1 } && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
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
                            <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                              {elem.color || "#ffffff"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                            Badge / Card Background
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={elem.bg_color && elem.bg_color !== "transparent" ? elem.bg_color : "#4f46e5"}
                              onChange={(e) => handleUpdateElement(elem.id, { bg_color: e.target.value })}
                              className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateElement(elem.id, { bg_color: elem.bg_color === "transparent" ? "#4f46e5" : "transparent" })}
                              className="text-[10px] text-indigo-400 hover:underline"
                            >
                              {elem.bg_color === "transparent" ? "Add Box" : "Make Clear"}
                            </button>
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
  );
};
