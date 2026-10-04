import React, { useState } from "react";
import { FolderPlus, AlertCircle } from "lucide-react";
import type { ProjectCreateInput } from "../types";
import { Modal } from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import { Button } from "./ui/Button";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: ProjectCreateInput) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await onSubmit({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
        <FolderPlus size={18} />
      </div>
      <div>
        <h3 className="text-base font-bold text-[var(--color-text)]">Create Video Project</h3>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex items-center justify-end gap-2.5 w-full">
      <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant="primary"
        size="sm"
        type="submit"
        form="create-project-form"
        disabled={loading || !name.trim()}
        isLoading={loading}
      >
        Create Project
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description="Name your project. Next, you'll import your voiceover audio and Clipchamp captions to generate your timeline."
      size="sm"
      footer={modalFooter}
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form id="create-project-form" onSubmit={handleSubmit} className="space-y-4 py-1">
        <Input
          label="Project Name *"
          required
          autoFocus
          placeholder="e.g. Neon Horizon Documentary"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          label="Description (Optional)"
          rows={3}
          placeholder="Brief summary or creative notes for this video..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </form>
    </Modal>
  );
};
