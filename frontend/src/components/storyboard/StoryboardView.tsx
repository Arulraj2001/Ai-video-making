import React, { useState, useEffect, useMemo } from "react";
import {
  Clapperboard,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Edit3,
  X,
  Film,
  Camera,
  Layers,
  Wand2,
  AlertCircle,
  Image as ImageIcon,
  Maximize2,
  CheckCircle2,
  Cpu,
  Info,
  ExternalLink,
  Merge,
  Search,
  Palette,
  CheckSquare,
  Square,
  LayoutGrid,
  ListFilter,
} from "lucide-react";
import { formatTimecode } from "../../utils/formatters";
import { api } from "../../services/api";
import type {
  Project,
  Scene,
  ImageGeneratorCapabilities,
  ModelCatalogItem,
  SceneVariationItem,
} from "../../types";

interface StoryboardViewProps {
  project: Project;
  onProjectUpdated?: (updated: Project) => void;
  onSwitchToBible?: () => void;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  project,
  onProjectUpdated,
  onSwitchToBible,
}) => {
  const [scenes, setScenes] = useState<Scene[]>(project.scenes || []);
  const [generatingAllStoryboard, setGeneratingAllStoryboard] = useState(false);
  const [generatingAllImages, setGeneratingAllImages] = useState(false);
  const [retryingFailed, setRetryingFailed] = useState(false);
  const [generatingSceneIds, setGeneratingSceneIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);

  // Model catalog
  const [models, setModels] = useState<ModelCatalogItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("flux-realism");
  const [selectedProvider, setSelectedProvider] = useState<string>("pollinations");

  // Multi-select & Merge state
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const [mergingInProgress, setMergingInProgress] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [viewLayout, setViewLayout] = useState<"cards" | "compact">("cards");

  // Smart Clustering modal
  const [clusteringModalOpen, setClusteringModalOpen] = useState(false);
  const [clusterTargetDuration, setClusterTargetDuration] = useState<number>(15.0);
  const [clusterMode, setClusterMode] = useState<"fixed_duration" | "smart_llm">("fixed_duration");
  const [clusteringInProgress, setClusteringInProgress] = useState(false);

  // Variations modal
  const [variationsModalScene, setVariationsModalScene] = useState<Scene | null>(null);
  const [variations, setVariations] = useState<SceneVariationItem[]>([]);
  const [variationsLoading, setVariationsLoading] = useState(false);

  // Graphic template modal
  const [graphicModalScene, setGraphicModalScene] = useState<Scene | null>(null);
  const [graphicTemplateType, setGraphicTemplateType] = useState<
    "title_card" | "quote_card" | "stats_card" | "step_card" | "split_layout"
  >("title_card");
  const [graphicHeadline, setGraphicHeadline] = useState("");
  const [graphicSubtext, setGraphicSubtext] = useState("");
  const [graphicAccent, setGraphicAccent] = useState("#6366f1");
  const [graphicApplying, setGraphicApplying] = useState(false);

  // Provider capabilities
  const [capabilities, setCapabilities] = useState<ImageGeneratorCapabilities | null>(null);

  // Art style mode for image generation
  const [styleMode, setStyleMode] = useState<string>("photorealistic");

  const STYLE_MODES = [
    { id: "photorealistic", label: "Photo", emoji: "📷" },
    { id: "cinematic",      label: "Cinema", emoji: "🎬" },
    { id: "anime",         label: "Anime", emoji: "✨" },
    { id: "3d",            label: "3D", emoji: "🎲" },
    { id: "cartoon",       label: "Cartoon", emoji: "🎨" },
    { id: "stickfigure",   label: "Stick", emoji: "🖊️" },
    { id: "sketch",        label: "Sketch", emoji: "✏️" },
    { id: "watercolor",    label: "Watercolor", emoji: "🖌️" },
  ];

  // Inline editing state
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMotion, setEditMotion] = useState("");
  const [editTransition, setEditTransition] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Prompt regeneration modal state
  const [regenModalScene, setRegenModalScene] = useState<Scene | null>(null);
  const [regenInstructions, setRegenInstructions] = useState("");
  const [regeneratingPrompt, setRegeneratingPrompt] = useState(false);

  // Image lightbox preview modal
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    sceneNumber: number;
    caption: string;
    metadata?: any;
  } | null>(null);

  // Sync scenes if project prop updates
  useEffect(() => {
    setScenes(project.scenes || []);
  }, [project.scenes]);

  // Load image capabilities and model catalog on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const caps = await api.getImageCapabilities();
        if (isMounted) setCapabilities(caps);
      } catch (err) {
        console.warn("Could not fetch image capabilities:", err);
      }
      try {
        const cat = await api.getModelCatalog();
        if (isMounted) {
          setModels(cat.models);
          const readyDefault = cat.models.find((m) => m.is_ready) || cat.models[0];
          if (readyDefault) {
            setSelectedModelId(readyDefault.model_id);
            setSelectedProvider(readyDefault.provider);
          }
        }
      } catch (err) {
        console.warn("Could not fetch model catalog:", err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const storyboardedCount = scenes.filter((s) => Boolean(s.image_prompt)).length;
  const isAllStoryboarded = scenes.length > 0 && storyboardedCount === scenes.length;
  const imagesCompletedCount = scenes.filter((s) => s.image_status === "completed" && Boolean(s.image_url)).length;
  const imagesFailedCount = scenes.filter((s) => s.image_status === "failed").length;
  const isAllImagesCompleted = scenes.length > 0 && imagesCompletedCount === scenes.length;

  const totalVideoDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  // Filtered scenes based on search and status
  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      if (statusFilter === "completed" && !(scene.image_status === "completed" && scene.image_url)) return false;
      if (statusFilter === "pending" && scene.image_status !== "pending") return false;
      if (statusFilter === "failed" && scene.image_status !== "failed") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inCaption = scene.caption?.toLowerCase().includes(q);
        const inPrompt = scene.image_prompt?.toLowerCase().includes(q);
        const inDesc = scene.visual_description?.toLowerCase().includes(q);
        return inCaption || inPrompt || inDesc;
      }
      return true;
    });
  }, [scenes, statusFilter, searchQuery]);


  // Generate or Regenerate all storyboard prompts
  const handleGenerateAllStoryboard = async () => {
    try {
      setGeneratingAllStoryboard(true);
      setError(null);
      const res = await api.generateStoryboard(project.id);
      setScenes(res.scenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: res.scenes });
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate visual storyboard");
    } finally {
      setGeneratingAllStoryboard(false);
    }
  };

  // Generate or Regenerate ALL scene images (Batch with Fault Tolerance)
  const handleGenerateAllImages = async (force: boolean = false) => {
    try {
      setGeneratingAllImages(true);
      setError(null);

      // Optimistically update scene status to generating
      setScenes((prev) =>
        prev.map((s) =>
          force || s.image_status !== "completed"
            ? { ...s, image_status: "generating" }
            : s
        )
      );

      const res = await api.generateAllSceneImages(project.id, {
        force,
        style_mode: styleMode,
        provider: selectedProvider,
        model_id: selectedModelId,
      });
      setScenes(res.scenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: res.scenes });
      }

      if (res.failed_count > 0) {
        setError(
          `Batch completed: ${res.completed_count} images succeeded, ${res.failed_count} scenes failed. See scene cards for details.`
        );
      }
    } catch (err: any) {
      setError(err.message || "Batch image generation failed");
    } finally {
      setGeneratingAllImages(false);
    }
  };

  // Retry ONLY failed scene images preserving successful ones
  const handleRetryFailedImages = async () => {
    try {
      setRetryingFailed(true);
      setError(null);
      const res = await api.retryFailedImages(project.id);
      setScenes(res.scenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: res.scenes });
      }
      if (res.failed_count > 0) {
        setError(`Retry completed: ${res.completed_count} ready, ${res.failed_count} still failing.`);
      }
    } catch (err: any) {
      setError(err.message || "Retry failed images failed");
    } finally {
      setRetryingFailed(false);
    }
  };

  // Generate or Regenerate SINGLE scene image
  const handleGenerateSceneImage = async (
    sceneId: string,
    force: boolean = false,
    overrideProvider?: string,
    overrideModel?: string
  ) => {
    try {
      setGeneratingSceneIds((prev) => new Set(prev).add(sceneId));
      setError(null);

      // Optimistically mark this scene as generating
      setScenes((prev) =>
        prev.map((s) => (s.id === sceneId ? { ...s, image_status: "generating", image_error: null } : s))
      );

      const updated = await api.generateSceneImage(project.id, sceneId, {
        force,
        prompt_override: scenes.find((s) => s.id === sceneId)?.image_prompt || undefined,
        style_mode: styleMode,
        provider: overrideProvider || selectedProvider,
        model_id: overrideModel || selectedModelId,
      });
      const nextScenes = scenes.map((s) => (s.id === sceneId ? updated : s));
      setScenes(nextScenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: nextScenes });
      }
    } catch (err: any) {
      const errText = err.message || "Scene image generation failed";
      const nextScenes = scenes.map((s) =>
        s.id === sceneId
          ? { ...s, image_status: "failed" as const, image_error: errText }
          : s
      );
      setScenes(nextScenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: nextScenes });
      }
    } finally {
      setGeneratingSceneIds((prev) => {
        const copy = new Set(prev);
        copy.delete(sceneId);
        return copy;
      });
    }
  };

  // Smart Scene Clustering Handler
  const handleClusterScenes = async () => {
    try {
      setClusteringInProgress(true);
      setError(null);
      const res = await api.clusterScenes(project.id, {
        mode: clusterMode,
        target_duration: clusterTargetDuration,
      });
      setScenes(res.scenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: res.scenes });
      }
      setClusteringModalOpen(false);
      setSelectedSceneIds(new Set());
    } catch (err: any) {
      setError(err.message || "Failed to cluster scenes");
    } finally {
      setClusteringInProgress(false);
    }
  };

  // Multi-select & Merge Handler
  const handleMergeSelected = async () => {
    if (selectedSceneIds.size < 2) return;
    try {
      setMergingInProgress(true);
      setError(null);
      const res = await api.mergeScenes(project.id, Array.from(selectedSceneIds));
      setScenes(res.scenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: res.scenes });
      }
      setSelectedSceneIds(new Set());
    } catch (err: any) {
      setError(err.message || "Failed to merge selected scenes");
    } finally {
      setMergingInProgress(false);
    }
  };

  // Variations Modal Handlers
  const handleOpenVariations = async (scene: Scene) => {
    setVariationsModalScene(scene);
    setVariations([]);
    setVariationsLoading(true);
    try {
      const res = await api.generateSceneVariations(project.id, scene.id, {
        style_mode: styleMode,
        provider: selectedProvider,
        model_id: selectedModelId,
      });
      setVariations(res.variations);
    } catch (err: any) {
      setError(err.message || "Failed to generate variations");
    } finally {
      setVariationsLoading(false);
    }
  };

  const handleApplyVariation = async (sceneId: string, varItem: SceneVariationItem) => {
    try {
      const updated = await api.updateSceneTimeline(project.id, sceneId, {
        image_url: varItem.image_url,
      });
      setScenes(updated.scenes);
      if (onProjectUpdated) {
        onProjectUpdated(updated);
      }
      setVariationsModalScene(null);
    } catch (err: any) {
      setError(err.message || "Failed to apply variation");
    }
  };

  // Graphic Template Handlers
  const handleOpenGraphicModal = (scene: Scene) => {
    setGraphicModalScene(scene);
    setGraphicHeadline(scene.caption.slice(0, 70));
    setGraphicSubtext(scene.caption.length > 70 ? scene.caption.slice(70, 160) : "");
    setGraphicAccent("#6366f1");
    setGraphicTemplateType("title_card");
  };

  const handleApplyGraphicTemplate = async () => {
    if (!graphicModalScene) return;
    try {
      setGraphicApplying(true);
      setError(null);
      const updatedScene = await api.applyGraphicTemplate(project.id, graphicModalScene.id, {
        template_type: graphicTemplateType,
        headline: graphicHeadline.trim() || graphicModalScene.caption,
        subtext: graphicSubtext.trim() || undefined,
        accent_color: graphicAccent,
      });
      const nextScenes = scenes.map((s) => (s.id === graphicModalScene.id ? updatedScene : s));
      setScenes(nextScenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: nextScenes });
      }
      setGraphicModalScene(null);
    } catch (err: any) {
      setError(err.message || "Failed to apply graphic template");
    } finally {
      setGraphicApplying(false);
    }
  };

  const toggleSelectScene = (id: string) => {
    setSelectedSceneIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const selectAllFiltered = () => {
    setSelectedSceneIds(new Set(filteredScenes.map((s) => s.id)));
  };

  const clearSelection = () => {
    setSelectedSceneIds(new Set());
  };

  const handleCopyPrompt = (sceneId: string, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedSceneId(sceneId);

    setTimeout(() => setCopiedSceneId(null), 2000);
  };

  const startEditing = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setEditPrompt(scene.image_prompt || "");
    setEditDescription(scene.visual_description || "");
    setEditMotion(scene.suggested_motion || "");
    setEditTransition(scene.suggested_transition || "");
  };

  const cancelEditing = () => {
    setEditingSceneId(null);
  };

  const handleSaveEdit = async (sceneId: string) => {
    try {
      setSavingEdit(true);
      const updated = await api.updateSceneStoryboard(project.id, sceneId, {
        image_prompt: editPrompt,
        visual_description: editDescription,
        suggested_motion: editMotion,
        suggested_transition: editTransition,
      });

      const nextScenes = scenes.map((s) => (s.id === sceneId ? updated : s));
      setScenes(nextScenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: nextScenes });
      }
      setEditingSceneId(null);
    } catch (err: any) {
      alert(`Failed to save edits: ${err.message || "Unknown error"}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const openRegenModal = (scene: Scene) => {
    setRegenModalScene(scene);
    setRegenInstructions("");
  };

  const handleRegeneratePrompt = async () => {
    if (!regenModalScene) return;
    try {
      setRegeneratingPrompt(true);
      const updated = await api.regenerateScenePrompt(
        project.id,
        regenModalScene.id,
        regenInstructions.trim()
      );

      const nextScenes = scenes.map((s) => (s.id === regenModalScene.id ? updated : s));
      setScenes(nextScenes);
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, scenes: nextScenes });
      }
      setRegenModalScene(null);
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message || "Unknown error"}`);
    } finally {
      setRegeneratingPrompt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Storyboard Header Banner */}
      <div
        className="studio-card p-5 sm:p-6"
        style={{
          borderLeft: "4px solid var(--accent-primary)",
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-info text-[10px] font-semibold uppercase tracking-wider">
                <Clapperboard size={12} />
                Stage 3: Storyboard & AI Frames
              </span>

              {capabilities && (
                <span className="badge badge-neutral text-[10px] font-mono">
                  <Cpu size={11} />
                  {capabilities.provider.toUpperCase()} ({capabilities.model})
                </span>
              )}

              {capabilities?.supports_reference_images ? (
                <span className="badge badge-success text-[10px]">
                  <CheckCircle2 size={11} />
                  Ref Conditioning Supported
                </span>
              ) : (
                <span className="badge badge-info text-[10px]">
                  <Info size={11} />
                  Prompt Injected References
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
              Visual Storyboard & AI Scene Images
            </h2>
            <p className="text-xs max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Synthesize cinematic prompt descriptors and generate visual frames for every scene.
              Supports fault-tolerant batch generation, isolated scene regeneration, and Video Bible consistency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* AI Model Selector */}
            {models.length > 0 && (

              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-xl border text-xs"
                style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}
              >
                <Cpu size={13} style={{ color: "var(--accent-primary)" }} />
                <select
                  value={selectedModelId}
                  onChange={(e) => {
                    const mid = e.target.value;
                    setSelectedModelId(mid);
                    const found = models.find((m) => m.model_id === mid);
                    if (found) setSelectedProvider(found.provider);
                  }}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer py-0.5"
                  style={{ color: "var(--text-primary)" }}
                  title="Choose active AI image model"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.model_id} className="bg-zinc-900 text-white">
                      {m.name} {m.is_free ? "(Free)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Art Style Mode Selector */}
            <div
              className="flex items-center gap-1.5 p-1 rounded-xl border"
              style={{ background: "var(--bg-card-subtle)", borderColor: "var(--border-subtle)" }}
            >
              {STYLE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setStyleMode(mode.id)}
                  title={`Art style: ${mode.label}`}
                  className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
                  style={{
                    background: styleMode === mode.id ? "var(--accent-primary)" : "transparent",
                    color: styleMode === mode.id ? "#fff" : "var(--text-muted)",
                    border: styleMode === mode.id ? "1px solid var(--accent-primary)" : "1px solid transparent",
                  }}
                >
                  {mode.emoji} {mode.label}
                </button>
              ))}
            </div>

            {/* Progress metrics */}
            <div
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl border text-xs font-mono"
              style={{
                background: "var(--bg-card-subtle)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div>
                <span className="block text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>Prompts</span>
                <span className="font-bold" style={{ color: "var(--accent-primary)" }}>
                  {storyboardedCount} / {scenes.length}
                </span>
              </div>
              <div className="h-6 w-px" style={{ background: "var(--border-subtle)" }} />
              <div>
                <span className="block text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>Images</span>
                <span className="font-bold" style={{ color: "var(--accent-success-text)" }}>
                  {imagesCompletedCount} / {scenes.length}
                </span>
              </div>
            </div>

            {/* Smart Cluster Button */}
            <button
              onClick={() => setClusteringModalOpen(true)}
              disabled={clusteringInProgress || scenes.length === 0}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              title="Intelligently group fast captions into 15-25s visual scenes"
            >
              <Layers className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
              <span>Smart Cluster ({scenes.length})</span>
            </button>

            {/* Prompt Synthesis Button */}
            <button
              onClick={handleGenerateAllStoryboard}
              disabled={generatingAllStoryboard || generatingAllImages || scenes.length === 0}
              className="btn-secondary text-xs py-2 px-3"
              title="Generate or update visual storyboard prompts"
            >
              {generatingAllStoryboard ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--accent-primary)" }} />
                  <span>Synthesizing Prompts...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
                  <span>{isAllStoryboarded ? "Regenerate Prompts" : "Synthesize Prompts"}</span>
                </>
              )}
            </button>

            {/* Generate All Scene Images Button */}
            <button
              onClick={() => handleGenerateAllImages(isAllImagesCompleted)}
              disabled={generatingAllImages || generatingAllStoryboard || scenes.length === 0}
              className="btn-primary text-xs py-2 px-4"
              title="Generate images for all scenes without clicking individually"
            >
              {generatingAllImages ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Scene Images...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>
                    {isAllImagesCompleted ? "Regenerate All Images" : "Generate All Images"}
                  </span>
                </>
              )}
            </button>

            {/* Retry Failed Images Button */}
            {imagesFailedCount > 0 && (
              <button
                onClick={handleRetryFailedImages}
                disabled={retryingFailed || generatingAllImages}
                className="btn-danger text-xs py-2 px-3"
                title="Retry image generation only for failed scenes, preserving successful images"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retryingFailed ? "animate-spin" : ""}`} />
                <span>Retry Failed ({imagesFailedCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Real-time Generation Progress Bar */}
      {(generatingAllImages || retryingFailed) && (
        <div
          className="p-4 rounded-xl border space-y-2 shadow-sm"
          style={{
            background: "var(--bg-card-subtle)",
            borderColor: "var(--accent-primary)",
          }}
        >
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: "var(--text-primary)" }}>
            <span className="flex items-center gap-2 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--accent-primary)" }} />
              <span>{retryingFailed ? "Retrying failed scene images..." : "Generating scene images..."}</span>
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              {imagesCompletedCount} of {scenes.length} completed ({Math.round((imagesCompletedCount / (scenes.length || 1)) * 100)}%)
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: "var(--border-subtle)" }}
          >
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${Math.max(5, (imagesCompletedCount / (scenes.length || 1)) * 100)}%`,
                background: "var(--accent-primary)",
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty State: If no scenes are storyboarded yet */}
      {storyboardedCount === 0 && !generatingAllStoryboard ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-10 text-center flex flex-col items-center justify-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
            <Clapperboard className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Storyboard Not Synthesized Yet
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
              Transform your {scenes.length} timestamped scenes into an actionable visual storyboard.
              The AI will craft detailed visual descriptions, cinematic image prompts, suggested camera motions,
              and seamless transitions adhering strictly to your Video Bible.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleGenerateAllStoryboard}
              disabled={generatingAllStoryboard || scenes.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Synthesize Storyboard ({scenes.length} Scenes)</span>
            </button>
            {onSwitchToBible && (
              <button
                onClick={onSwitchToBible}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Review Video Bible First
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Storyboard Scenes List */

        <div className="space-y-4">
          {/* SaaS Search, Filter, and Bulk Actions Toolbar */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
          >
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search captions or prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1">
              {(["all", "completed", "pending", "failed"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg capitalize transition-colors"
                  style={{
                    background: statusFilter === st ? "var(--accent-primary)" : "transparent",
                    color: statusFilter === st ? "#fff" : "var(--text-secondary)",
                    border: statusFilter === st ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  }}
                >
                  {st}{" "}
                  {st === "all"
                    ? `(${scenes.length})`
                    : st === "completed"
                    ? `(${imagesCompletedCount})`
                    : st === "failed"
                    ? `(${imagesFailedCount})`
                    : `(${scenes.length - imagesCompletedCount - imagesFailedCount})`}
                </button>
              ))}
            </div>

            {/* Bulk Selection Actions */}
            <div className="flex items-center gap-2">
              {selectedSceneIds.size > 0 ? (
                <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-800 px-3 py-1 rounded-lg text-xs">
                  <span className="font-semibold text-indigo-300">{selectedSceneIds.size} selected</span>
                  {selectedSceneIds.size >= 2 && (
                    <button
                      onClick={handleMergeSelected}
                      disabled={mergingInProgress}
                      className="btn-primary text-xs py-0.5 px-2.5 flex items-center gap-1"
                      title="Merge selected scenes into 1 continuous visual scene"
                    >
                      <Merge size={12} />
                      <span>{mergingInProgress ? "Merging..." : `Merge ${selectedSceneIds.size} Scenes`}</span>
                    </button>
                  )}
                  <button onClick={clearSelection} className="text-zinc-400 hover:text-zinc-200 text-xs">
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={selectAllFiltered}
                  className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
                >
                  <CheckSquare size={13} />
                  <span>Select All</span>
                </button>
              )}

              {/* View Layout Toggle */}
              <div
                className="flex items-center rounded-lg border p-0.5"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <button
                  onClick={() => setViewLayout("cards")}
                  className="p-1 rounded transition-colors"
                  style={{
                    background: viewLayout === "cards" ? "var(--accent-primary)" : "transparent",
                    color: viewLayout === "cards" ? "#fff" : "var(--text-muted)",
                  }}
                  title="Full Cards View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewLayout("compact")}
                  className="p-1 rounded transition-colors"
                  style={{
                    background: viewLayout === "compact" ? "var(--accent-primary)" : "transparent",
                    color: viewLayout === "compact" ? "#fff" : "var(--text-muted)",
                  }}
                  title="Compact View"
                >
                  <ListFilter size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Render Filtered Scenes */}
          {filteredScenes.length === 0 ? (
            <div className="text-center py-12 studio-card p-8 text-xs" style={{ color: "var(--text-secondary)" }}>
              No scenes match the filter criteria.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredScenes.map((scene) => {
                const index = scenes.findIndex((s) => s.id === scene.id);
                const isSelected = selectedSceneIds.has(scene.id);
                const isEditing = editingSceneId === scene.id;
                const isCopied = copiedSceneId === scene.id;
                const isSceneGenerating =
                  generatingSceneIds.has(scene.id) ||
                  scene.image_status === "generating" ||
                  (generatingAllImages && scene.image_status !== "completed");
                const isCompleted = scene.image_status === "completed" && Boolean(scene.image_url);
                const isFailed = scene.image_status === "failed";

                return (
                  <div
                    key={scene.id}
                    className="studio-card p-5 sm:p-6 space-y-4 relative overflow-hidden transition-all"
                    style={{
                      borderLeft: isSelected ? "4px solid var(--accent-primary)" : undefined,
                    }}
                  >
                    {/* Scene Header & Badges */}
                    <div
                      className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Multi-select Checkbox */}
                        <button
                          onClick={() => toggleSelectScene(scene.id)}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                          title={isSelected ? "Deselect scene" : "Select scene for batch merge"}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} style={{ color: "var(--accent-primary)" }} />
                          ) : (
                            <Square size={16} style={{ color: "var(--text-muted)" }} />
                          )}
                        </button>

                        <span className="badge badge-info text-xs font-mono font-bold px-3 py-1">
                          <Film size={13} />
                          Scene {index + 1}
                        </span>
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          ID: {scene.id}
                        </span>
                        <span className="badge badge-neutral font-mono text-xs">
                          {formatTimecode(scene.start)} → {formatTimecode(scene.end)} ({scene.duration.toFixed(2)}s)
                        </span>
                      </div>


                  {/* Status, Motion & Transition Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Image Status Badge */}
                    {isCompleted && (
                      <span className="badge badge-success text-[11px]">
                        <CheckCircle2 size={12} />
                        <span>Image Ready</span>
                      </span>
                    )}
                    {isSceneGenerating && (
                      <span className="badge badge-warning text-[11px] animate-pulse">
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Generating Visual...</span>
                      </span>
                    )}
                    {isFailed && (
                      <span className="badge badge-danger text-[11px]">
                        <AlertCircle size={12} />
                        <span>Generation Failed</span>
                      </span>
                    )}

                    {scene.suggested_motion && (
                      <span className="badge badge-neutral text-[11px]">
                        <Camera size={12} />
                        <span>{scene.suggested_motion}</span>
                      </span>
                    )}
                    {scene.suggested_transition && (
                      <span className="badge badge-neutral text-[11px]">
                        <Layers size={12} />
                        <span>{scene.suggested_transition}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Caption Narration Quote */}
                <div
                  className="p-3.5 rounded-xl border flex items-start gap-2 text-xs"
                  style={{
                    background: "var(--bg-card-subtle)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <span className="font-serif font-bold text-base leading-none" style={{ color: "var(--accent-primary)" }}>“</span>
                  <p className="font-medium italic flex-1" style={{ color: "var(--text-primary)" }}>
                    {scene.caption}
                  </p>
                  <span className="font-serif font-bold text-base leading-none" style={{ color: "var(--accent-primary)" }}>”</span>
                </div>

                {/* Two-Column Responsive Layout: Metadata & Prompt on Left, Image Visual on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Descriptions, Prompts, Editors */}
                  <div className="lg:col-span-7 space-y-3.5">
                    {!isEditing ? (
                      <>
                        {/* Visual Description */}
                        {scene.visual_description && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                              Visual Description & Action
                            </span>
                            <p
                              className="text-xs leading-relaxed p-3 rounded-xl border"
                              style={{
                                background: "var(--bg-card-subtle)",
                                borderColor: "var(--border-subtle)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {scene.visual_description}
                            </p>
                          </div>
                        )}

                        {/* Image Generation Prompt */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--accent-primary)" }}>
                              <Sparkles size={12} />
                              Image Prompt (16:9 Midjourney / Flux Ready)
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopyPrompt(scene.id, scene.image_prompt || "")}
                                className="btn-secondary text-xs py-1 px-2.5"
                                title="Copy prompt to clipboard"
                              >
                                {isCopied ? (
                                  <>
                                    <Check size={12} style={{ color: "var(--accent-success)" }} />
                                    <span style={{ color: "var(--accent-success-text)" }}>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => startEditing(scene)}
                                className="btn-secondary text-xs py-1 px-2.5"
                                title="Edit prompt and scene details"
                              >
                                <Edit3 size={12} />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => openRegenModal(scene)}
                                className="btn-secondary text-xs py-1 px-2.5"
                                title="Regenerate prompt text with custom guidance"
                              >
                                <Wand2 size={12} style={{ color: "var(--accent-primary)" }} />
                                <span>Tweak Prompt</span>
                              </button>

                              <button
                                onClick={() => handleOpenVariations(scene)}
                                disabled={variationsLoading && variationsModalScene?.id === scene.id}
                                className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                                title="Generate 3 image variations for A/B testing"
                              >
                                <Palette size={12} style={{ color: "var(--accent-primary)" }} />
                                <span>Variations</span>
                              </button>

                              <button
                                onClick={() => handleOpenGraphicModal(scene)}
                                className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                                title="Use a clean graphic template card instead of AI image"
                              >
                                <Layers size={12} style={{ color: "var(--accent-primary)" }} />
                                <span>Graphic Card</span>
                              </button>
                            </div>
                          </div>


                          <div
                            className="p-3.5 rounded-xl border text-xs font-mono leading-relaxed select-all max-h-32 overflow-y-auto"
                            style={{
                              background: "var(--bg-card-subtle)",
                              borderColor: "var(--border-subtle)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {scene.image_prompt || (
                              <span className="italic" style={{ color: "var(--text-muted)" }}>
                                No prompt synthesized yet. Click Synthesize Prompts above.
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Inline Edit Mode */
                      <div className="p-4 rounded-xl border border-indigo-500/40 bg-zinc-950/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                            Edit Scene {index + 1} Storyboard Directives
                          </h4>
                          <button
                            onClick={cancelEditing}
                            className="text-zinc-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                            Image Generation Prompt
                          </label>
                          <textarea
                            rows={3}
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                            Visual Description
                          </label>
                          <textarea
                            rows={2}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                              Suggested Motion
                            </label>
                            <input
                              type="text"
                              value={editMotion}
                              onChange={(e) => setEditMotion(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                              Suggested Transition
                            </label>
                            <input
                              type="text"
                              value={editTransition}
                              onChange={(e) => setEditTransition(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(scene.id)}
                            disabled={savingEdit}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {savingEdit ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <span>Save Changes</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Scene AI Image Visual Panel (Phase 5) */}
                  <div className="lg:col-span-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                        Generated Visual (16:9)
                      </span>

                      {/* Single Scene Image Actions */}
                      <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                          <button
                            onClick={() => handleGenerateSceneImage(scene.id, true)}
                            disabled={isSceneGenerating || generatingAllImages}
                            className="btn-secondary text-xs py-1 px-2.5"
                            title="Regenerate image for this scene only"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSceneGenerating ? "animate-spin" : ""}`} style={{ color: "var(--accent-primary)" }} />
                            <span>Regenerate</span>
                          </button>
                        ) : isFailed ? (
                          <button
                            onClick={() => handleGenerateSceneImage(scene.id, true)}
                            disabled={isSceneGenerating || generatingAllImages}
                            className="btn-danger text-xs py-1 px-2.5"
                            title="Retry image generation for this scene"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSceneGenerating ? "animate-spin" : ""}`} />
                            <span>Retry</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateSceneImage(scene.id, false)}
                            disabled={isSceneGenerating || generatingAllImages}
                            className="btn-primary text-xs py-1 px-3"
                            title="Generate AI image for this scene"
                          >
                            <Sparkles size={13} />
                            <span>Generate Image</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Image Viewport Container */}
                    <div
                      className="relative aspect-video rounded-xl border overflow-hidden group shadow-sm"
                      style={{
                        background: "var(--bg-card-subtle)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      {isCompleted && scene.image_url ? (
                        <>
                          <img
                            src={api.getMediaUrl(scene.image_url || undefined)}
                            alt={`Scene ${index + 1} Visual`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                            onClick={() =>
                              setPreviewImage({
                                url: api.getMediaUrl(scene.image_url || undefined),
                                sceneNumber: index + 1,
                                caption: scene.caption,
                                metadata: scene.image_metadata,
                              })
                            }
                          />

                          {/* Hover Overlay with Zoom Button */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                setPreviewImage({
                                  url: api.getMediaUrl(scene.image_url || undefined),
                                  sceneNumber: index + 1,
                                  caption: scene.caption,
                                  metadata: scene.image_metadata,
                                })
                              }
                              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all hover:scale-110"
                              title="Expand Fullscreen"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateSceneImage(scene.id, true)}
                              disabled={isSceneGenerating || generatingAllImages}
                              className="p-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 backdrop-blur-md text-white transition-all hover:scale-110"
                              title="Regenerate Visual"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Metadata Pill */}
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                            <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-zinc-700/60">
                              {scene.image_metadata?.width || 1024}x{scene.image_metadata?.height || 576} • {scene.image_metadata?.provider?.toUpperCase() || "AI"}
                            </span>
                            {Boolean(scene.image_metadata?.references_used && scene.image_metadata.references_used.length > 0) && (
                              <span className="px-2 py-0.5 rounded bg-indigo-950/80 backdrop-blur-md text-[10px] font-mono text-indigo-300 border border-indigo-800/60">
                                {scene.image_metadata?.references_used.length} Refs
                              </span>
                            )}
                          </div>
                        </>
                      ) : isSceneGenerating ? (
                        /* Generating Loading State */
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 p-4 text-center space-y-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                            <Sparkles className="w-5 h-5 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-zinc-200 block">
                              Synthesizing Scene Visual
                            </span>
                            <span className="text-[11px] text-zinc-400 block mt-0.5 font-mono">
                              {capabilities?.provider?.toUpperCase() || "AI ENGINE"} • 16:9 Widescreen
                            </span>
                          </div>
                          <div className="w-3/4 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 animate-[shimmer_2s_infinite]" />
                          </div>
                        </div>
                      ) : isFailed ? (
                        /* Failed Error State */
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/40 p-4 text-center space-y-2 border border-rose-900/50">
                          <AlertCircle className="w-7 h-7 text-rose-400" />
                          <div className="max-w-xs">
                            <span className="text-xs font-bold text-rose-300 block">
                              Generation Failed
                            </span>
                            <p className="text-[11px] text-rose-400 mt-0.5 line-clamp-2 leading-relaxed">
                              {scene.image_error || "An unexpected error occurred during synthesis."}
                            </p>
                          </div>
                          <button
                            onClick={() => handleGenerateSceneImage(scene.id, true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold transition-colors mt-1 shadow-sm"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Retry Generation</span>
                          </button>
                        </div>
                      ) : (
                        /* Pending State */
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/60 p-4 text-center space-y-2 border-2 border-dashed border-zinc-800 rounded-xl">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-medium text-zinc-400 block">
                              Visual Pending
                            </span>
                            <span className="text-[10px] text-zinc-600 block">
                              Ready for text-to-image synthesis
                            </span>
                          </div>
                          <button
                            onClick={() => handleGenerateSceneImage(scene.id, false)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-purple-300 text-xs font-medium border border-purple-900/40 transition-colors mt-1"
                          >
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Generate Visual</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          )}
        </div>
      )}



      {/* Prompt Regeneration Modal */}
      {regenModalScene && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                Direct Prompt Tweak • {regenModalScene.id}
              </h3>
              <button
                onClick={() => setRegenModalScene(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                Scene Caption
              </span>
              <p className="text-zinc-300 italic">{regenModalScene.caption}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Creative Direction / Custom Guidance (Optional)
              </label>
              <textarea
                rows={3}
                value={regenInstructions}
                onChange={(e) => setRegenInstructions(e.target.value)}
                placeholder="e.g. Extreme close-up on cybernetic eye with rain droplets, high tension, macro lens..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                The AI will preserve the Video Bible visual rules while applying your specific directorial adjustments.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setRegenModalScene(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegeneratePrompt}
                disabled={regeneratingPrompt}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {regeneratingPrompt ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Regenerate Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono text-xs font-bold">
                  Scene {previewImage.sceneNumber}
                </span>
                <span className="text-xs text-zinc-300 font-medium truncate max-w-md">
                  {previewImage.caption}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image View */}
            <div className="relative flex-1 overflow-auto flex items-center justify-center bg-black/95 p-4">
              <img
                src={previewImage.url}
                alt="Scene Visual Full Preview"
                className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Modal Footer Metadata */}
            {previewImage.metadata && (
              <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-3">
                  <span>Engine: {previewImage.metadata.provider?.toUpperCase()}</span>
                  <span>•</span>
                  <span>Model: {previewImage.metadata.model}</span>
                  <span>•</span>
                  <span>
                    Resolution: {previewImage.metadata.width}x{previewImage.metadata.height} ({previewImage.metadata.aspect_ratio})
                  </span>
                </div>
                {previewImage.metadata.generated_at && (
                  <span className="text-zinc-500 text-[11px]">
                    {new Date(previewImage.metadata.generated_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Scene Clustering Modal */}
      {clusteringModalOpen && (

        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Smart Visual Scene Clustering
              </h3>
              <button onClick={() => setClusteringModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Rapid sentence-by-sentence captions make videos feel like a slideshow. Smart Clustering groups consecutive captions into 15–25 second visual scenes so images hold naturally while captions animate.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setClusterMode("fixed_duration")}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  clusterMode === "fixed_duration"
                    ? "border-indigo-500 bg-indigo-950/40 text-white"
                    : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span className="block text-xs font-bold mb-1">Target Duration</span>
                <span className="text-[11px] leading-tight block">
                  Groups captions into natural ~{clusterTargetDuration}s visual chunks
                </span>
              </div>

              <div
                onClick={() => setClusterMode("smart_llm")}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  clusterMode === "smart_llm"
                    ? "border-indigo-500 bg-indigo-950/40 text-white"
                    : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span className="block text-xs font-bold mb-1">Smart AI Clustering</span>
                <span className="text-[11px] leading-tight block">
                  LLM analyzes narrative & topic shifts to detect scene boundaries
                </span>
              </div>
            </div>

            {clusterMode === "fixed_duration" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-zinc-300">
                  <span>Target Scene Length</span>
                  <span className="font-mono text-indigo-400">{clusterTargetDuration} seconds</span>
                </div>
                <div className="flex gap-2">
                  {[10, 15, 20, 25, 30].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setClusterTargetDuration(dur)}
                      className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all ${
                        clusterTargetDuration === dur
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/60 text-xs text-indigo-200 flex items-center justify-between">
              <span>Current: <strong className="text-white">{scenes.length}</strong> rapid captions</span>
              <span>→</span>
              <span>
                Est. Result: <strong className="text-indigo-300">~{Math.max(1, Math.round(totalVideoDuration / clusterTargetDuration))}</strong> visual scenes
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setClusteringModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClusterScenes}
                disabled={clusteringInProgress}
                className="btn-primary text-xs py-2 px-5 flex items-center gap-2"
              >
                {clusteringInProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Clustering Scenes...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5" />
                    <span>Run Smart Clustering</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variations Modal */}
      {variationsModalScene && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-zinc-900 border border-zinc-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                Scene Visual Variations (A/B Test) • {variationsModalScene.id}
              </h3>
              <button onClick={() => setVariationsModalScene(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Choose the best candidate visual for this scene. Click any variation to apply it directly.
            </p>

            {variationsLoading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <span className="text-xs text-zinc-300 block">Generating 3 candidate variations in parallel...</span>
              </div>
            ) : variations.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No variations available. Click below to generate candidates.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {variations.map((v, i) => (
                  <div
                    key={v.id}
                    onClick={() => handleApplyVariation(variationsModalScene.id, v)}
                    className="group border border-zinc-800 hover:border-purple-500 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] bg-black/40 p-2 space-y-2"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950">
                      <img src={api.getMediaUrl(v.image_url)} alt={`Variation ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-zinc-300">
                        Option {i + 1}
                      </span>
                    </div>
                    <button className="w-full btn-secondary text-xs py-1 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      Select Option {i + 1}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
              <button
                onClick={() => handleOpenVariations(variationsModalScene)}
                disabled={variationsLoading}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${variationsLoading ? "animate-spin" : ""}`} />
                <span>Re-roll 3 More</span>
              </button>
              <button
                onClick={() => setVariationsModalScene(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Graphic Template Card Modal */}
      {graphicModalScene && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Use Graphic Template Card • {graphicModalScene.id}
              </h3>
              <button onClick={() => setGraphicModalScene(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Generate crisp high-res cards (Key Point, Quote, Stat, Step) server-side without needing an AI generator.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Template Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "title_card", label: "Title / Key Point" },
                    { id: "quote_card", label: "Quote Card" },
                    { id: "stats_card", label: "Stat / Number" },
                    { id: "step_card",  label: "Step Card" },
                    { id: "split_layout", label: "Split Overview" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setGraphicTemplateType(t.id as any)}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        graphicTemplateType === t.id
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Headline Text</label>
                <input
                  type="text"
                  value={graphicHeadline}
                  onChange={(e) => setGraphicHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Subtext / Citation (Optional)</label>
                <input
                  type="text"
                  value={graphicSubtext}
                  onChange={(e) => setGraphicSubtext(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-zinc-300">Accent Color:</label>
                <div className="flex items-center gap-2">
                  {["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setGraphicAccent(col)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        graphicAccent === col ? "scale-125 border-white" : "border-transparent"
                      }`}
                      style={{ background: col }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setGraphicModalScene(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyGraphicTemplate}
                disabled={graphicApplying}
                className="btn-primary text-xs py-2 px-5 flex items-center gap-2"
              >
                {graphicApplying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering Card...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Render & Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

