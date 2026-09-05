import React, { useState, useRef } from "react";
import { MapPin, Plus, Edit3, Trash2, UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { api } from "../../services/api";
import type { Location } from "../../types";

interface LocationsSectionProps {
  locations: Location[];
  onAdd: (loc: Partial<Location>) => Promise<any>;
  onUpdate: (locId: string, loc: Partial<Location>) => Promise<any>;
  onDelete: (locId: string) => Promise<any>;
  onUploadReference: (locId: string, file: File) => Promise<any>;
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({
  locations,
  onAdd,
  onUpdate,
  onDelete,
  onUploadReference,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState("");
  const [lighting, setLighting] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetLocForUpload, setTargetLocForUpload] = useState<string | null>(null);

  const openAdd = () => {
    setEditingLoc(null);
    setName("");
    setDescription("");
    setEnvironment("");
    setLighting("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditingLoc(loc);
    setName(loc.name);
    setDescription(loc.description);
    setEnvironment(loc.environment);
    setLighting(loc.lighting);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      if (editingLoc) {
        await onUpdate(editingLoc.id, {
          name: name.trim(),
          description: description.trim(),
          environment: environment.trim(),
          lighting: lighting.trim(),
        });
      } else {
        await onAdd({
          name: name.trim(),
          description: description.trim(),
          environment: environment.trim(),
          lighting: lighting.trim(),
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const triggerUpload = (locId: string) => {
    setTargetLocForUpload(locId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetLocForUpload) return;

    try {
      setUploadingId(targetLocForUpload);
      await onUploadReference(targetLocForUpload, file);
    } catch (err: any) {
      alert(`Upload failed: ${err.message || "Unknown error"}`);
    } finally {
      setUploadingId(null);
      setTargetLocForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for reference images */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Recurring Locations ({locations.length})
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Key environments that reappear across scenes. Setting visual cues guarantees architectural and spatial continuity.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-3">
            <MapPin className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-zinc-300">No recurring locations defined</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Add environments like "Cyberpunk Alley", "Modern Glass Office", or "Victorian Study" to anchor image generations in the same setting.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Add First Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => {
            const imageUrl = loc.reference_image?.url
              ? api.getMediaUrl(loc.reference_image.url)
              : null;
            const isUploading = uploadingId === loc.id;

            return (
              <div
                key={loc.id}
                className="group relative rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700/80 transition-all p-4 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header & Reference Thumbnail */}
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-lg bg-zinc-800/80 border border-zinc-750 shrink-0 overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={loc.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-zinc-600" />
                      )}

                      {/* Upload overlay button */}
                      <button
                        title="Upload reference photo"
                        disabled={isUploading}
                        onClick={() => triggerUpload(loc.id)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-zinc-200 hover:text-white"
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-zinc-100 truncate">{loc.name}</h4>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(loc)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            title="Edit location"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(loc.id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Delete location"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {loc.reference_image ? (
                        <span className="inline-block mt-0.5 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-1.5 py-0.2 rounded">
                          Ref Image Active
                        </span>
                      ) : (
                        <span className="inline-block mt-0.5 text-[10px] text-zinc-500">
                          No reference image
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {loc.description && (
                    <p className="mt-3 text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {loc.description}
                    </p>
                  )}

                  {/* Attributes Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {loc.environment && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                        <span className="text-zinc-500 mr-1">Env:</span>
                        {loc.environment}
                      </span>
                    )}
                    {loc.lighting && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                        <span className="text-zinc-500 mr-1">Light:</span>
                        {loc.lighting}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Quick Action */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>ID: {loc.id.substring(0, 10)}</span>
                  <button
                    onClick={() => triggerUpload(loc.id)}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <UploadCloud className="w-3 h-3" />
                    {loc.reference_image ? "Replace Image" : "Upload Reference"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Location Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {editingLoc ? "Edit Recurring Location" : "Add Recurring Location"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Location Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Captain's Bridge, Tokyo Neon Alley, Old Library"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed architectural description, atmosphere, scale, key props..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Environment / Setting</label>
                  <input
                    type="text"
                    placeholder="e.g., Interior futuristic sci-fi starship"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Location Lighting</label>
                  <input
                    type="text"
                    placeholder="e.g., Moody cyan consoles, dimmed overhead strips"
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : editingLoc ? "Update Location" : "Add Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
