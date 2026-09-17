import React, { useState, useEffect } from "react";
import { Eye, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";
import type { VideoBible, OverallStyle, Character, Location, VideoObject } from "../../types";
import { OverallStyleSection } from "./OverallStyleSection";
import { CharactersSection } from "./CharactersSection";
import { LocationsSection } from "./LocationsSection";
import { ObjectsSection } from "./ObjectsSection";
import { GlobalRulesSection } from "./GlobalRulesSection";
import { VisualContextDrawer } from "./VisualContextDrawer";

interface VideoBibleEditorProps {
  projectId: string;
  initialBible?: VideoBible;
  onBibleUpdated?: (bible: VideoBible) => void;
}

type TabType = "style" | "characters" | "locations" | "objects" | "rules";

export const VideoBibleEditor: React.FC<VideoBibleEditorProps> = ({
  projectId,
  initialBible,
  onBibleUpdated,
}) => {
  const [bible, setBible] = useState<VideoBible | null>(initialBible || null);
  const [activeTab, setActiveTab] = useState<TabType>("style");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectContextOpen, setInspectContextOpen] = useState(false);

  const handleAutoExtract = async () => {
    try {
      setExtracting(true);
      setError(null);
      const updated = await api.autoExtractVideoBible(projectId);
      setBible(updated);
      if (onBibleUpdated) onBibleUpdated(updated);
      setExtractSuccess("Continuity entities automatically extracted from script!");
      if (updated.characters && updated.characters.length > 0) {
        setActiveTab("characters");
      }
      setTimeout(() => setExtractSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to auto-extract Video Bible");
    } finally {
      setExtracting(false);
    }
  };

  // Internal fetch — does NOT call onBibleUpdated to avoid re-render loops.
  // onBibleUpdated is only called when the user mutates the bible (add/update/delete).
  const fetchBible = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getVideoBible(projectId);
      setBible(res);
    } catch (err: any) {
      setError(err.message || "Failed to load Video Bible");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount if no initial data was provided by parent.
  useEffect(() => {
    if (!bible) {
      fetchBible();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Sync prop updates (e.g. when parent refreshes the project) into local state.
  // This handles the case where the parent re-fetches without remounting this component.
  useEffect(() => {
    if (initialBible) {
      setBible(initialBible);
    }
  }, [initialBible]);

  // Handlers for Style
  const handleUpdateStyle = async (newStyle: Partial<OverallStyle>) => {
    const updatedBible = await api.updateVideoBible(projectId, { overall_style: newStyle });
    setBible(updatedBible);
    if (onBibleUpdated) onBibleUpdated(updatedBible);
  };

  // Handlers for Characters
  const handleAddCharacter = async (char: Partial<Character>) => {
    const added = await api.addCharacter(projectId, char);
    setBible((prev) => {
      if (!prev) return null;
      const next = { ...prev, characters: [...prev.characters, added] };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
    return added;
  };

  const handleUpdateCharacter = async (charId: string, char: Partial<Character>) => {
    const updated = await api.updateCharacter(projectId, charId, char);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        characters: prev.characters.map((c) => (c.id === charId ? updated : c)),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
    return updated;
  };

  const handleDeleteCharacter = async (charId: string) => {
    await api.deleteCharacter(projectId, charId);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        characters: prev.characters.filter((c) => c.id !== charId),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
  };

  const handleUploadCharacterReference = async (charId: string, file: File) => {
    const ref = await api.uploadCharacterReference(projectId, charId, file);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        characters: prev.characters.map((c) =>
          c.id === charId ? { ...c, reference_image: ref } : c
        ),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
    return ref;
  };

  const handleDeleteCharacterReference = async (charId: string) => {
    await api.deleteCharacterReference(projectId, charId);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        characters: prev.characters.map((c) =>
          c.id === charId ? { ...c, reference_image: null } : c
        ),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
  };

  // Handlers for Locations
  const handleAddLocation = async (loc: Partial<Location>) => {
    const added = await api.addLocation(projectId, loc);
    setBible((prev) => {
      if (!prev) return null;
      const next = { ...prev, locations: [...prev.locations, added] };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
    return added;
  };

  const handleUpdateLocation = async (locId: string, loc: Partial<Location>) => {
    const updated = await api.updateLocation(projectId, locId, loc);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        locations: prev.locations.map((l) => (l.id === locId ? updated : l)),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
    return updated;
  };

  const handleDeleteLocation = async (locId: string) => {
    await api.deleteLocation(projectId, locId);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        locations: prev.locations.filter((l) => l.id !== locId),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
  };

  const handleUploadLocationReference = async (locId: string, file: File) => {
    const ref = await api.uploadLocationReference(projectId, locId, file);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        locations: prev.locations.map((l) =>
          l.id === locId ? { ...l, reference_image: ref } : l
        ),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
    return ref;
  };

  const handleDeleteLocationReference = async (locId: string) => {
    await api.deleteLocationReference(projectId, locId);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        locations: prev.locations.map((l) =>
          l.id === locId ? { ...l, reference_image: null } : l
        ),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
  };

  // Handlers for Objects
  const handleAddObject = async (obj: Partial<VideoObject>) => {
    const added = await api.addObject(projectId, obj);
    setBible((prev) => {
      if (!prev) return null;
      const next = { ...prev, objects: [...prev.objects, added] };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
    return added;
  };

  const handleUpdateObject = async (objId: string, obj: Partial<VideoObject>) => {
    const updated = await api.updateObject(projectId, objId, obj);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        objects: prev.objects.map((o) => (o.id === objId ? updated : o)),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
    return updated;
  };

  const handleDeleteObject = async (objId: string) => {
    await api.deleteObject(projectId, objId);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        objects: prev.objects.filter((o) => o.id !== objId),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
  };

  const handleUploadObjectReference = async (objId: string, file: File) => {
    const ref = await api.uploadObjectReference(projectId, objId, file);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        objects: prev.objects.map((o) =>
          o.id === objId ? { ...o, reference_image: ref } : o
        ),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
    return ref;
  };

  const handleDeleteObjectReference = async (objId: string) => {
    await api.deleteObjectReference(projectId, objId);
    setBible((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        objects: prev.objects.map((o) =>
          o.id === objId ? { ...o, reference_image: null } : o
        ),
      };
      if (onBibleUpdated) onBibleUpdated(next);
      return next;
    });
  };

  // Handlers for Rules
  const handleUpdateRules = async (rules: string[]) => {
    const updatedBible = await api.updateVideoBible(projectId, { rules });
    setBible(updatedBible);
    if (onBibleUpdated) onBibleUpdated(updatedBible);
  };

  if (loading && !bible) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-zinc-400">Loading Video Bible system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/40 border border-rose-800/60 text-center">
        <p className="text-sm text-rose-300 mb-3">{error}</p>
        <button
          onClick={fetchBible}
          className="px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!bible) return null;

  return (
    <div className="space-y-6">
      {/* Video Bible heading and essential actions */}
      <div className="border-b pb-5" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
              Video Bible
            </h2>
            <p className="text-xs max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Define the characters, places, objects, and visual rules that keep every generated scene consistent.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleAutoExtract}
              disabled={extracting}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              title="Automatically extract recurring characters, locations, and artistic tone from script narration"
            >
              <Sparkles className={`w-3.5 h-3.5 ${extracting ? "animate-spin" : ""}`} />
              <span>{extracting ? "Analyzing Script..." : "AI Auto-Extract Bible"}</span>
            </button>
            <button
              onClick={fetchBible}
              className="btn-secondary p-2"
              title="Refresh Bible data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setInspectContextOpen(true)}
              className="btn-secondary text-xs py-2 px-3.5"
            >
              <Eye className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <span>Inspect prompt context</span>
            </button>
          </div>
        </div>

        {extractSuccess && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center gap-2 text-emerald-400 animate-in fade-in">
            <CheckCircle2 size={15} />
            <span>{extractSuccess}</span>
          </div>
        )}
      </div>

      {/* Sub-navigation with count badges */}
      <div className="flex items-center gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("style")}
          className={`video-bible-tab ${activeTab === "style" ? "is-active" : ""}`}
        >
          <span>Overall Style</span>
        </button>

        <button
          onClick={() => setActiveTab("characters")}
          className={`video-bible-tab ${activeTab === "characters" ? "is-active" : ""}`}
        >
          <span>Characters</span>
          {bible.characters.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 font-mono">
              {bible.characters.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("locations")}
          className={`video-bible-tab ${activeTab === "locations" ? "is-active" : ""}`}
        >
          <span>Locations</span>
          {bible.locations.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 font-mono">
              {bible.locations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("objects")}
          className={`video-bible-tab ${activeTab === "objects" ? "is-active" : ""}`}
        >
          <span>Key Objects</span>
          {bible.objects.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 font-mono">
              {bible.objects.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`video-bible-tab ${activeTab === "rules" ? "is-active" : ""}`}
        >
          <span>Global Rules</span>
          {bible.rules.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 font-mono">
              {bible.rules.length}
            </span>
          )}
        </button>
      </div>

      {/* Helpful banner if Bible has 0 characters and 0 locations */}
      {bible.characters.length === 0 && bible.locations.length === 0 && (
        <div
          className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            borderColor: "rgba(99, 102, 241, 0.25)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h5 className="text-xs font-bold text-indigo-200">AI Auto-Extract Available</h5>
              <p className="text-[11px] text-zinc-400">
                Instantly scan your narration to extract recurring characters, locations, and visual style.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoExtract}
            disabled={extracting}
            className="btn-primary text-xs py-1.5 px-3 shrink-0 self-start sm:self-auto"
          >
            <Sparkles size={13} className={extracting ? "animate-spin" : ""} />
            <span>{extracting ? "Analyzing..." : "Auto-Extract Now"}</span>
          </button>
        </div>
      )}

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "style" && (
          <OverallStyleSection
            style={bible.overall_style}
            onSave={handleUpdateStyle}
          />
        )}

        {activeTab === "characters" && (
          <CharactersSection
            characters={bible.characters}
            onAdd={handleAddCharacter}
            onUpdate={handleUpdateCharacter}
            onDelete={handleDeleteCharacter}
            onUploadReference={handleUploadCharacterReference}
            onDeleteReference={handleDeleteCharacterReference}
          />
        )}

        {activeTab === "locations" && (
          <LocationsSection
            locations={bible.locations}
            onAdd={handleAddLocation}
            onUpdate={handleUpdateLocation}
            onDelete={handleDeleteLocation}
            onUploadReference={handleUploadLocationReference}
            onDeleteReference={handleDeleteLocationReference}
          />
        )}

        {activeTab === "objects" && (
          <ObjectsSection
            objects={bible.objects}
            onAdd={handleAddObject}
            onUpdate={handleUpdateObject}
            onDelete={handleDeleteObject}
            onUploadReference={handleUploadObjectReference}
            onDeleteReference={handleDeleteObjectReference}
          />
        )}

        {activeTab === "rules" && (
          <GlobalRulesSection
            rules={bible.rules}
            onUpdateRules={handleUpdateRules}
          />
        )}
      </div>

      {/* Visual Context Drawer */}
      <VisualContextDrawer
        projectId={projectId}
        isOpen={inspectContextOpen}
        onClose={() => setInspectContextOpen(false)}
      />
    </div>
  );
};
