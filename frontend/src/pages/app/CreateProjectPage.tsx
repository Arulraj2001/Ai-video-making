import React, { useState } from "react";
import { useRouter } from "../../router/Router";
import { useApp } from "../../context/AppContext";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ArrowRight } from "lucide-react";

export const CreateProjectPage: React.FC = () => {
  const { navigate } = useRouter();
  const { createProject, setActiveStage } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const created = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setActiveStage("script");
      navigate(`/app/studio/${created.id}?stage=script`);
    } catch (err: any) {
      alert("Failed to create project: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Create New Project"
        subtitle="Configure your canvas aspect ratio, initial style direction, and production workspace."
      />

      <Card variant="default" className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Project Name"
            placeholder="e.g. The Quantum Paradox — Chapter 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Project Description / Script Summary"
            placeholder="Brief synopsis of narration, themes, or tone..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text)]">
              Canvas Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "16:9", label: "Widescreen (16:9)", desc: "YouTube, Landscape" },
                { id: "9:16", label: "Vertical (9:16)", desc: "Shorts, TikTok, Reels" },
                { id: "1:1", label: "Square (1:1)", desc: "Instagram, Feed" },
              ].map((ar) => (
                <div
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id as "16:9" | "9:16" | "1:1")}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all select-none ${
                    aspectRatio === ar.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
                  }`}
                >
                  <span
                    className={`text-xs font-bold block ${
                      aspectRatio === ar.id ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"
                    }`}
                  >
                    {ar.label}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                    {ar.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--color-border-subtle)]">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => navigate("/app/projects")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              rightIcon={<ArrowRight size={14} />}
            >
              Create & Open Studio
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
