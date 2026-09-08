import React, { useState, useRef } from "react";
import { User, Plus, Edit3, Trash2, UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { api } from "../../services/api";
import type { Character } from "../../types";

interface CharactersSectionProps {
  characters: Character[];
  onAdd: (char: Partial<Character>) => Promise<any>;
  onUpdate: (charId: string, char: Partial<Character>) => Promise<any>;
  onDelete: (charId: string) => Promise<any>;
  onUploadReference: (charId: string, file: File) => Promise<any>;
}

export const CharactersSection: React.FC<CharactersSectionProps> = ({
  characters,
  onAdd,
  onUpdate,
  onDelete,
  onUploadReference,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [appearance, setAppearance] = useState("");
  const [clothing, setClothing] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [personality, setPersonality] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetCharForUpload, setTargetCharForUpload] = useState<string | null>(null);

  const openAdd = () => {
    setEditingChar(null);
    setName("");
    setDescription("");
    setAppearance("");
    setClothing("");
    setAgeRange("");
    setPersonality("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (char: Character) => {
    setEditingChar(char);
    setName(char.name);
    setDescription(char.description);
    setAppearance(char.appearance);
    setClothing(char.clothing);
    setAgeRange(char.age_range);
    setPersonality(char.personality);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      if (editingChar) {
        await onUpdate(editingChar.id, {
          name: name.trim(),
          description: description.trim(),
          appearance: appearance.trim(),
          clothing: clothing.trim(),
          age_range: ageRange.trim(),
          personality: personality.trim(),
        });
      } else {
        await onAdd({
          name: name.trim(),
          description: description.trim(),
          appearance: appearance.trim(),
          clothing: clothing.trim(),
          age_range: ageRange.trim(),
          personality: personality.trim(),
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save character");
    } finally {
      setSaving(false);
    }
  };

  const triggerUpload = (charId: string) => {
    setTargetCharForUpload(charId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && targetCharForUpload) {
      const file = e.target.files[0];
      try {
        setUploadingId(targetCharForUpload);
        await onUploadReference(targetCharForUpload, file);
      } finally {
        setUploadingId(null);
        setTargetCharForUpload(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <User size={18} className="text-cyan-400" />
          <h4 className="text-sm font-bold font-display uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Recurring Characters ({characters.length})
          </h4>
        </div>
        <button onClick={openAdd} className="btn-primary text-xs py-1.5 px-3">
          <Plus size={14} />
          <span>Add Character</span>
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/5">
          <User size={28} className="text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-300 font-semibold">No Recurring Characters Yet</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Add characters with specific appearance and reference images to ensure consistent faces and clothing across all scenes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => (
            <div
              key={char.id}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between gap-3 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Reference Image Thumbnail */}
                <div
                  className="w-16 h-16 rounded-xl border overflow-hidden flex items-center justify-center flex-shrink-0 relative group"
                  style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}
                >
                  {char.reference_image?.url ? (
                    <img
                      src={api.getMediaUrl(char.reference_image.url)}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={20} className="text-slate-600" />
                  )}

                  <button
                    onClick={() => triggerUpload(char.id)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-white font-medium"
                    title="Upload Reference Image"
                  >
                    <UploadCloud size={14} />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h5
                      className="text-sm font-bold truncate font-display"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {char.name}
                    </h5>
                    {char.age_range && (
                      <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                        {char.age_range}
                      </span>
                    )}
                  </div>

                  {char.description && (
                    <p className="text-xs text-slate-300 mt-0.5 truncate">{char.description}</p>
                  )}

                  <div className="text-[11px] text-slate-400 space-y-0.5 mt-2">
                    {char.appearance && (
                      <div>
                        <strong className="text-slate-300">Look:</strong> {char.appearance}
                      </div>
                    )}
                    {char.clothing && (
                      <div>
                        <strong className="text-slate-300">Outfit:</strong> {char.clothing}
                      </div>
                    )}
                    {char.personality && (
                      <div>
                        <strong className="text-slate-300">Traits:</strong> {char.personality}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <button
                  onClick={() => triggerUpload(char.id)}
                  disabled={uploadingId === char.id}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium flex items-center gap-1"
                >
                  <UploadCloud size={12} />
                  <span>
                    {uploadingId === char.id
                      ? "Uploading..."
                      : char.reference_image
                      ? "Change Reference"
                      : "Upload Reference"}
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(char)}
                    className="icon-action-btn sm primary"
                    title="Edit character"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete character "${char.name}"?`)) {
                        onDelete(char.id);
                      }
                    }}
                    className="icon-action-btn sm danger"
                    title="Delete character"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Character Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl border p-6 max-w-lg w-full shadow-2xl"
            style={{ background: "var(--color-modal)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold font-display" style={{ color: "var(--text-primary)" }}>
                {editingChar ? `Edit ${editingChar.name}` : "Add Recurring Character"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="icon-action-btn"
                title="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-text text-xs"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Age Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Late 20s, Early 40s"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="input-text text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Narrative Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cybernetic archivist and former orbital pilot"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-text text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Physical Appearance
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Athletic build, silver buzzcut, sharp cheekbones, glowing cyan cybernetic left eye"
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  className="textarea-custom text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Signature Clothing
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weathered dark-grey trench coat with glowing collar seams, tactical combat boots"
                  value={clothing}
                  onChange={(e) => setClothing(e.target.value)}
                  className="input-text text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Personality & Mannerisms
                </label>
                <input
                  type="text"
                  placeholder="e.g. Calculating, guarded, fiercely observant, stoic posture"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  className="input-text text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="btn-primary text-xs"
                >
                  {saving ? "Saving..." : editingChar ? "Save Changes" : "Create Character"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
