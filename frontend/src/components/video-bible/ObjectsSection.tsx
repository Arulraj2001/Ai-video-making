import React, { useState, useRef } from "react";
import { Package, Plus, Edit3, Trash2, UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { api } from "../../services/api";
import type { VideoObject } from "../../types";

interface ObjectsSectionProps {
  objects: VideoObject[];
  onAdd: (obj: Partial<VideoObject>) => Promise<any>;
  onUpdate: (objId: string, obj: Partial<VideoObject>) => Promise<any>;
  onDelete: (objId: string) => Promise<any>;
  onUploadReference: (objId: string, file: File) => Promise<any>;
}

export const ObjectsSection: React.FC<ObjectsSectionProps> = ({
  objects,
  onAdd,
  onUpdate,
  onDelete,
  onUploadReference,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObj, setEditingObj] = useState<VideoObject | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetObjForUpload, setTargetObjForUpload] = useState<string | null>(null);

  const openAdd = () => {
    setEditingObj(null);
    setName("");
    setDescription("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (obj: VideoObject) => {
    setEditingObj(obj);
    setName(obj.name);
    setDescription(obj.description);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      if (editingObj) {
        await onUpdate(editingObj.id, {
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        await onAdd({
          name: name.trim(),
          description: description.trim(),
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save object");
    } finally {
      setSaving(false);
    }
  };

  const triggerUpload = (objId: string) => {
    setTargetObjForUpload(objId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetObjForUpload) return;

    try {
      setUploadingId(targetObjForUpload);
      await onUploadReference(targetObjForUpload, file);
    } catch (err: any) {
      alert(`Upload failed: ${err.message || "Unknown error"}`);
    } finally {
      setUploadingId(null);
      setTargetObjForUpload(null);
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
            <Package className="w-5 h-5 text-amber-400" />
            Recurring Objects & Artifacts ({objects.length})
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Important signature props, devices, or items that appear repeatedly (e.g., a glowing crystal, antique pocket watch, futuristic blaster).
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-medium shadow-md shadow-amber-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Object
        </button>
      </div>

      {objects.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-3">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-zinc-300">No recurring objects defined</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Keep props consistent across camera cuts by cataloging recurring vehicles, key items, or tools here.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Add First Object
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {objects.map((obj) => {
            const imageUrl = obj.reference_image?.url
              ? api.getMediaUrl(obj.reference_image.url)
              : null;
            const isUploading = uploadingId === obj.id;

            return (
              <div
                key={obj.id}
                className="group relative rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700/80 transition-all p-4 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header & Reference Thumbnail */}
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-lg bg-zinc-800/80 border border-zinc-750 shrink-0 overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={obj.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-zinc-600" />
                      )}

                      {/* Upload overlay button */}
                      <button
                        title="Upload reference photo"
                        disabled={isUploading}
                        onClick={() => triggerUpload(obj.id)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-zinc-200 hover:text-white"
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-zinc-100 truncate">{obj.name}</h4>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(obj)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            title="Edit object"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(obj.id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Delete object"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {obj.reference_image ? (
                        <span className="inline-block mt-0.5 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900/50 px-1.5 py-0.2 rounded">
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
                  {obj.description && (
                    <p className="mt-3 text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                      {obj.description}
                    </p>
                  )}
                </div>

                {/* Footer Quick Action */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>ID: {obj.id.substring(0, 10)}</span>
                  <button
                    onClick={() => triggerUpload(obj.id)}
                    className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    <UploadCloud className="w-3 h-3" />
                    {obj.reference_image ? "Replace Image" : "Upload Reference"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Object Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 overflow-hidden"
            style={{ background: "var(--color-modal)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Package className="w-4 h-4 text-amber-400" />
                {editingObj ? "Edit Recurring Object" : "Add Recurring Object"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "var(--text-muted)" }}
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
                  Object Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Brass Chronometer, Hologram Projector, Silver Dagger"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Description & Visual Details</label>
                <textarea
                  rows={4}
                  placeholder="Shape, materials, color, engravings, wear-and-tear, distinctive marks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
                />
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
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : editingObj ? "Update Object" : "Add Object"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
