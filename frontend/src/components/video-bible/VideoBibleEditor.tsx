import React, { useState, useEffect } from "react";
import { Eye, RefreshCw } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [inspectContextOpen, setInspectContextOpen] = useState(false);

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
      </div>

      {/* Sub-navigation */}
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
        </button>

        <button
          onClick={() => setActiveTab("locations")}
          className={`video-bible-tab ${activeTab === "locations" ? "is-active" : ""}`}
        >
          <span>Locations</span>
        </button>

        <button
          onClick={() => setActiveTab("objects")}
          className={`video-bible-tab ${activeTab === "objects" ? "is-active" : ""}`}
        >
          <span>Key Objects</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`video-bible-tab ${activeTab === "rules" ? "is-active" : ""}`}
        >
          <span>Global Rules</span>
        </button>
      </div>

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
          />
        )}

        {activeTab === "locations" && (
          <LocationsSection
            locations={bible.locations}
            onAdd={handleAddLocation}
            onUpdate={handleUpdateLocation}
            onDelete={handleDeleteLocation}
            onUploadReference={handleUploadLocationReference}
          />
        )}

        {activeTab === "objects" && (
          <ObjectsSection
            objects={bible.objects}
            onAdd={handleAddObject}
            onUpdate={handleUpdateObject}
            onDelete={handleDeleteObject}
            onUploadReference={handleUploadObjectReference}
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
