import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  ExternalLink,
  Merge,
  Search,
  Palette,
  CheckSquare,
  Square,
  LayoutGrid,
  ListFilter,
  PanelRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatTimecode } from "../../utils/formatters";
import { api } from "../../services/api";
import type {
  Project,
  Scene,
  ImageGeneratorCapabilities,
  ImageProviderHealth,
  ModelCatalogItem,
  SceneVariationItem,
  ProviderUsageStats,
} from "../../types";

interface StoryboardViewProps {
  project: Project;
  onProjectUpdated?: (updated: Project | ((previous: Project) => Project)) => void;
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
  const sceneRequestTokens = useRef(new Map<string, number>());
  const [error, setError] = useState<string | null>(null);
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);

  // Model catalog & usage stats
  const [models, setModels] = useState<ModelCatalogItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("flux-realism");
  const [selectedProvider, setSelectedProvider] = useState<string>("pollinations");
  const [usageStats, setUsageStats] = useState<ProviderUsageStats | null>(null);

  const modelCategories = useMemo(() => {
    const groupDefs: Record<string, { label: string; items: ModelCatalogItem[] }> = {
      free_cloud: { label: "⚡ Free Cloud (Zero Setup / Unlimited)", items: [] },
      quota_cloud: { label: "☁️ Cloudflare Workers AI (Daily Quota)", items: [] },
      local: { label: "💻 Local Machine (Offline / Unlimited)", items: [] },
      mock: { label: "🧪 Offline Testing / Mock", items: [] },
      paid_cloud: { label: "🔑 Advanced Cloud (API Keys Required)", items: [] },
    };

    models.forEach((m) => {
      const cat = m.category || "free_cloud";
      if (groupDefs[cat]) {
        groupDefs[cat].items.push(m);
      } else {
        groupDefs.paid_cloud.items.push(m);
      }
    });

    return Object.entries(groupDefs).filter(([_, g]) => g.items.length > 0);
  }, [models]);

  // Multi-select & Merge state
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const [mergingInProgress, setMergingInProgress] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [viewLayout, setViewLayout] = useState<"cards" | "compact">("cards");
  const [inspectorSceneId, setInspectorSceneId] = useState<string | null>(null);

  // Smart Clustering modal
  const [clusteringModalOpen, setClusteringModalOpen] = useState(false);
  const [clusterTargetDuration, setClusterTargetDuration] = useState<number>(15.0);
  const [clusterMode, setClusterMode] = useState<"fixed_duration" | "smart_llm">("fixed_duration");
  const [clusteringInProgress, setClusteringInProgress] = useState(false);
  const [dismissRapidAlert, setDismissRapidAlert] = useState(false);

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
  const [, setProviderHealth] = useState<ImageProviderHealth | null>(null);

  // Art style mode for image generation
  const [styleMode, setStyleMode] = useState<string>("photorealistic");

  const STYLE_MODES = [
    { id: "stickfigure", label: "Stickman" },
    { id: "whiteboard", label: "Whiteboard" },
    { id: "cartoon", label: "Minimal Cartoon" },
    { id: "flat", label: "Flat Vector" },
    { id: "sketch", label: "Hand Drawn" },
    { id: "3d", label: "3D" },
    { id: "anime", label: "Anime" },
    { id: "cinematic", label: "Cinematic" },
    { id: "documentary", label: "Documentary" },
    { id: "custom", label: "Custom" },
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

  const projectAspectRatio = project.canvas_settings?.aspect_ratio || "16:9";

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
      try {
        const stats = await api.getProviderUsageStats();
        if (isMounted) setUsageStats(stats);
      } catch (err) {
        console.warn("Could not fetch provider usage stats:", err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshUsageStats = useCallback(async () => {
    try {
      const stats = await api.getProviderUsageStats();
      setUsageStats(stats);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.getImageCapabilities(selectedProvider, selectedModelId, styleMode)
      .then((caps) => {
        if (isMounted) setCapabilities(caps);
      })
      .catch((err) => console.warn("Could not refresh selected model capabilities:", err));
    return () => {
      isMounted = false;
    };
  }, [selectedProvider, selectedModelId, styleMode]);

  useEffect(() => {
    if (selectedProvider !== "gemini") {
      setProviderHealth(null);
      return;
    }
    let isMounted = true;
    api.getImageProviderHealth(selectedProvider, selectedModelId)
      .then((health) => {
        if (isMounted) setProviderHealth(health);
      })
      .catch((err) => {
        if (isMounted) setProviderHealth({
          provider: selectedProvider,
          model: selectedModelId,
          status: "error",
          message: err.message || "Gemini health check failed",
        });
      });
    return () => {
      isMounted = false;
    };
  }, [selectedProvider, selectedModelId]);

  const storyboardedCount = scenes.filter((s) => Boolean(s.image_prompt)).length;
  const imagesCompletedCount = scenes.filter((s) => s.image_status === "completed" && Boolean(s.image_url)).length;
  const imagesFailedCount = scenes.filter((s) => s.image_status === "failed").length;
  const isAllImagesCompleted = scenes.length > 0 && imagesCompletedCount === scenes.length;

  const totalVideoDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const avgSceneDuration = scenes.length > 0 ? totalVideoDuration / scenes.length : 0;
  const isRapidPaced = scenes.length > 3 && avgSceneDuration < 8.0;

  const applySceneCollection = (updatedScenes: Scene[], replace = false) => {
    const updatedById = new Map(updatedScenes.map((scene) => [scene.id, scene]));
    setScenes((previous) => replace
      ? updatedScenes
      : previous.map((scene) => updatedById.get(scene.id) || scene)
    );
    onProjectUpdated?.((previous) => ({
      ...previous,
      scenes: replace
        ? updatedScenes
        : previous.scenes.map((scene) => updatedById.get(scene.id) || scene),
    }));
    if (replace) {
      const updatedIds = new Set(updatedScenes.map((scene) => scene.id));
      setSelectedSceneIds((previous) => {
        const reconciled = new Set([...previous].filter((id) => updatedIds.has(id)));
        return reconciled.size === previous.size ? previous : reconciled;
      });
    }
  };

  const applySingleScene = (sceneId: string, updatedScene: Scene) => {
    setScenes((previous) => previous.map((scene) => scene.id === sceneId ? updatedScene : scene));
    onProjectUpdated?.((previous) => ({
      ...previous,
      scenes: previous.scenes.map((scene) => scene.id === sceneId ? updatedScene : scene),
    }));
  };

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
      applySceneCollection(res.scenes);
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
      applySceneCollection(res.scenes);
      refreshUsageStats();

      if (res.failed_count > 0) {
        setError(
          `Batch completed: ${res.completed_count} images succeeded, ${res.failed_count} scenes failed. See scene cards for details.`
        );
      }
    } catch (err: any) {
      setError(err.message || "Batch image generation failed");
    } finally {
      setGeneratingAllImages(false);
      refreshUsageStats();
    }
  };

  // Retry ONLY failed scene images preserving successful ones
  const handleRetryFailedImages = async () => {
    try {
      setRetryingFailed(true);
      setError(null);
      const res = await api.retryFailedImages(project.id, {
        style_mode: styleMode,
        provider: selectedProvider,
        model_id: selectedModelId,
      });
      applySceneCollection(res.scenes);
      refreshUsageStats();
      if (res.failed_count > 0) {
        setError(`Retry completed: ${res.completed_count} ready, ${res.failed_count} still failing.`);
      }
    } catch (err: any) {
      setError(err.message || "Retry failed images failed");
    } finally {
      setRetryingFailed(false);
      refreshUsageStats();
    }
  };

  // Generate or Regenerate SINGLE scene image
  const handleGenerateSceneImage = async (
    sceneId: string,
    force: boolean = false,
    overrideProvider?: string,
    overrideModel?: string,
    promptOverride?: string
  ) => {
    const requestToken = (sceneRequestTokens.current.get(sceneId) || 0) + 1;
    sceneRequestTokens.current.set(sceneId, requestToken);
    try {
      setGeneratingSceneIds((prev) => new Set(prev).add(sceneId));
      setError(null);

      // Optimistically mark this scene as generating
      setScenes((prev) =>
        prev.map((s) => (s.id === sceneId ? { ...s, image_status: "generating", image_error: null } : s))
      );

      const updated = await api.generateSceneImage(project.id, sceneId, {
        force,
        prompt_override: promptOverride || undefined,
        style_mode: styleMode,
        provider: overrideProvider || selectedProvider,
        model_id: overrideModel || selectedModelId,
      });
      if (sceneRequestTokens.current.get(sceneId) === requestToken) {
        applySingleScene(sceneId, updated);
        refreshUsageStats();
      }
    } catch (err: any) {
      if (sceneRequestTokens.current.get(sceneId) === requestToken) {
        const errText = err.message || "Scene image generation failed";
        const failedScene = scenes.find((scene) => scene.id === sceneId);
        if (failedScene) {
          applySingleScene(sceneId, { ...failedScene, image_status: "failed", image_error: errText });
        }
      }
    } finally {
      refreshUsageStats();
      setGeneratingSceneIds((prev) => {
        if (sceneRequestTokens.current.get(sceneId) !== requestToken) return prev;
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
      applySceneCollection(res.scenes, true);
      setClusteringModalOpen(false);
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
      applySceneCollection(res.scenes, true);
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
        image_status: "completed",
        image_metadata: varItem.metadata || undefined,
      });
      applySceneCollection(updated.scenes);
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
      applySingleScene(graphicModalScene.id, updatedScene);
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

      applySingleScene(sceneId, updated);
      setEditingSceneId(null);
    } catch (err: any) {
      setError(`Scene changes could not be saved: ${err.message || "Unknown error"}`);
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

      applySingleScene(regenModalScene.id, updated);
      setRegenModalScene(null);
    } catch (err: any) {
      setError(`Prompt regeneration failed: ${err.message || "Unknown error"}`);
    } finally {
      setRegeneratingPrompt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Storyboard heading and essential controls */}
      <div className="border-b pb-5" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
              Visual Storyboard
            </h2>
            <p className="text-xs max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Turn your narration into visuals. Review a scene, generate its visual, and refine it when needed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* AI Model Selector */}
            {models.length > 0 && (

              <details className="storyboard-advanced-controls">
                <summary className="btn-secondary text-xs py-2 px-3 cursor-pointer flex items-center gap-1.5">
                  <Cpu size={13} />
                  <span>Advanced</span>
                </summary>
                {models.length > 0 && (
                  <div className="storyboard-advanced-popover">
                    <label className="block text-[11px] font-semibold mb-1" htmlFor="storyboard-model">
                      Image model
                    </label>
                    <select
                      id="storyboard-model"
                      value={selectedModelId}
                      onChange={(e) => {
                        const mid = e.target.value;
                        setSelectedModelId(mid);
                        const found = models.find((m) => m.model_id === mid);
                        if (found) setSelectedProvider(found.provider);
                      }}
                      className="w-full bg-zinc-900 text-xs font-semibold focus:outline-none cursor-pointer py-1.5 px-2 rounded border border-zinc-700"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {modelCategories.map(([key, group]) => (
                        <optgroup key={key} label={group.label} className="bg-zinc-950 text-zinc-400 font-bold py-1">
                          {group.items.map((m) => {
                            let extra = m.is_free ? " • Free" : "";
                            if (m.provider === "cloudflare" && usageStats?.cloudflare) {
                              extra = ` • ${usageStats.cloudflare.used_today}/~25 today`;
                            } else if (m.provider === "sana_local") {
                              extra = " • Local GPU (1-Step)";
                            }
                            return (
                              <option key={m.id} value={m.model_id} className="bg-zinc-900 text-white font-normal py-1">
                                {m.name}{extra}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </select>

                    {/* Live Usage / Status Banner */}
                    {selectedProvider === "cloudflare" && usageStats?.cloudflare && (
                      <div
                        className="mt-2 p-2 rounded text-[11px] border"
                        style={{
                          backgroundColor: usageStats.cloudflare.is_exhausted
                            ? "rgba(239, 68, 68, 0.12)"
                            : "rgba(59, 130, 246, 0.1)",
                          borderColor: usageStats.cloudflare.is_exhausted
                            ? "rgba(239, 68, 68, 0.3)"
                            : "rgba(59, 130, 246, 0.25)",
                          color: usageStats.cloudflare.is_exhausted ? "#fca5a5" : "#93c5fd",
                        }}
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span>
                            {usageStats.cloudflare.is_exhausted
                              ? "⚠️ Daily Free Quota Exhausted"
                              : `Cloudflare Quota: ${usageStats.cloudflare.used_today} / ~25 used`}
                          </span>
                          <span className="text-[9px] opacity-75">Resets 00:00 UTC</span>
                        </div>
                        {usageStats.cloudflare.is_exhausted ? (
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-300">Switch to unlimited:</span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedModelId("flux-realism");
                                  setSelectedProvider("pollinations");
                                }}
                                className="px-1.5 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-white text-[10px] cursor-pointer"
                              >
                                Free Flux
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedModelId("Efficient-Large-Model/Sana_Sprint_1.6B_1024px_diffusers");
                                  setSelectedProvider("sana_local");
                                }}
                                className="px-1.5 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-white text-[10px] cursor-pointer"
                              >
                                Local SANA
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] opacity-80 block mt-0.5">
                            Remaining today: ~{usageStats.cloudflare.remaining_today} generations
                          </span>
                        )}
                      </div>
                    )}

                    {selectedProvider === "sana_local" && (
                      <div
                        className="mt-2 p-2 rounded text-[11px] border"
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          borderColor: "rgba(16, 185, 129, 0.25)",
                          color: "#6ee7b7",
                        }}
                      >
                        <span className="font-semibold block">💻 Local SANA-Sprint Active</span>
                        <span className="text-[10px] opacity-80 block mt-0.5">
                          Runs 100% offline on your GPU. Ensure local server is started:
                          <code className="block mt-0.5 px-1 py-0.5 bg-black/40 rounded text-zinc-200">
                            python scripts/sana_server.py
                          </code>
                        </span>
                      </div>
                    )}

                    <span className="block mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Provider: <strong className="text-zinc-200 uppercase">{selectedProvider}</strong>
                    </span>
                  </div>
                )}
              </details>
            )}

            {/* Art Style Mode Selector */}
            <label className="storyboard-style-select text-xs">
              <span>Style</span>
              <select value={styleMode} onChange={(e) => setStyleMode(e.target.value)} aria-label="Visual style">
                {STYLE_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>{mode.label}</option>
                ))}
              </select>
            </label>

            <span className="text-xs text-[var(--text-muted)]">
              {storyboardedCount} of {scenes.length} prompts · {imagesCompletedCount} images ready
            </span>

            {/* Prompt Synthesis Button */}
            {/* Generate All Scene Images Button */}
            <button
              onClick={() => handleGenerateAllImages(isAllImagesCompleted)}
              disabled={generatingAllImages || generatingAllStoryboard || retryingFailed || mergingInProgress || scenes.length === 0}
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
                disabled={retryingFailed || generatingAllImages || generatingAllStoryboard || mergingInProgress}
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

      {/* Rapid Captions Advisory Banner */}
      {isRapidPaced && !dismissRapidAlert && (
        <div
          className="p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
          style={{
            background: "rgba(234, 179, 8, 0.08)",
            borderColor: "rgba(234, 179, 8, 0.4)",
            color: "var(--text-primary)",
          }}
        >
          <div className="flex items-start gap-2.5">
            <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: "#eab308" }} />
            <div>
              <span className="font-bold text-amber-300">Fast Subtitle Pacing Detected ({avgSceneDuration.toFixed(1)}s average): </span>
              <span style={{ color: "var(--text-secondary)" }}>
                Generating visual frames for every 2-3 second line causes strobe-like image cuts. 
                Use <strong>Smart Cluster</strong> to group captions into 15–20s scenes for professional cinematic video pacing.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setClusteringModalOpen(true)}
              className="text-xs py-1 px-3 rounded-lg font-bold transition-opacity hover:opacity-90"
              style={{
                background: "#eab308",
                color: "#000",
              }}
            >
              Cluster to 15s Pacing
            </button>
            <button
              onClick={() => setDismissRapidAlert(true)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              title="Dismiss alert"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}


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
        <div
          className="rounded-2xl border p-10 text-center flex flex-col items-center justify-center max-w-2xl mx-auto space-y-4 shadow-sm"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "var(--accent-primary-subtle)",
              border: "1px solid var(--border-subtle)",
              color: "var(--accent-primary)",
            }}
          >
            <Clapperboard className="w-8 h-8" />
          </div>
          <div>
            <h3
              className="text-base font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Storyboard Not Synthesized Yet
            </h3>
            <p
              className="text-xs mt-1.5 max-w-md mx-auto leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Transform your {scenes.length} timestamped scenes into an actionable visual storyboard.
              The AI will craft detailed visual descriptions, cinematic image prompts, suggested camera motions,
              and seamless transitions adhering strictly to your Video Bible.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleGenerateAllStoryboard}
              disabled={generatingAllStoryboard || scenes.length === 0}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Synthesize Storyboard ({scenes.length} Scenes)</span>
            </button>
            {onSwitchToBible && (
              <button
                onClick={onSwitchToBible}
                className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-medium transition-colors"
                style={{
                  background: "var(--bg-card-subtle)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
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
                aria-label="Search storyboard scenes"
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  aria-label="Clear scene search"
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
                      disabled={mergingInProgress || generatingAllImages || retryingFailed || clusteringInProgress}
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
              {searchQuery.trim() ? "No scenes match your search." : "No scenes match the selected filter."}
            </div>
          ) : (
            <div className={`storyboard-scene-grid ${viewLayout === "compact" ? "is-compact" : ""}`}>
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
                    className={`studio-card storyboard-scene-card p-4 sm:p-5 space-y-4 relative overflow-hidden transition-all ${viewLayout === "compact" ? "is-compact" : ""} ${inspectorSceneId === scene.id || isEditing ? "inspector-open" : ""}`}
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
                    <button
                      onClick={() => startEditing(scene)}
                      className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                      title="Edit this scene"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setInspectorSceneId(inspectorSceneId === scene.id ? null : scene.id)}
                      className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                      aria-expanded={inspectorSceneId === scene.id}
                      title={inspectorSceneId === scene.id ? "Hide scene details" : "Show scene details"}
                    >
                      <PanelRight size={12} />
                      <span>{inspectorSceneId === scene.id ? "Hide details" : "Details"}</span>
                      {inspectorSceneId === scene.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
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
                <div className="storyboard-card-body gap-5 items-start">
                  {/* Left Column: Descriptions, Prompts, Editors */}
                  <div className="storyboard-card-inspector space-y-3.5">
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
                              Image Prompt ({projectAspectRatio})
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
                      <div
                        className="p-4 rounded-xl border space-y-3 shadow-sm"
                        style={{
                          background: "var(--bg-card)",
                          borderColor: "var(--border-default)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h4
                            className="text-xs font-semibold flex items-center gap-1.5"
                            style={{ color: "var(--text-primary)" }}
                          >
                            <Edit3 className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
                            <span>Edit Scene {index + 1} Storyboard Directives</span>
                          </h4>
                          <button
                            onClick={cancelEditing}
                            className="p-1 rounded transition-colors"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label
                            className="block text-[11px] font-medium mb-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Image Generation Prompt
                          </label>
                          <textarea
                            rows={3}
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border focus:outline-none font-mono resize-none"
                            style={{
                              background: "var(--bg-input)",
                              borderColor: "var(--border-default)",
                              color: "var(--text-primary)",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            className="block text-[11px] font-medium mb-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Visual Description
                          </label>
                          <textarea
                            rows={2}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border focus:outline-none resize-none"
                            style={{
                              background: "var(--bg-input)",
                              borderColor: "var(--border-default)",
                              color: "var(--text-primary)",
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              className="block text-[11px] font-medium mb-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Suggested Motion
                            </label>
                            <input
                              type="text"
                              value={editMotion}
                              onChange={(e) => setEditMotion(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none"
                              style={{
                                background: "var(--bg-input)",
                                borderColor: "var(--border-default)",
                                color: "var(--text-primary)",
                              }}
                            />
                          </div>
                          <div>
                            <label
                              className="block text-[11px] font-medium mb-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Suggested Transition
                            </label>
                            <input
                              type="text"
                              value={editTransition}
                              onChange={(e) => setEditTransition(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none"
                              style={{
                                background: "var(--bg-input)",
                                borderColor: "var(--border-default)",
                                color: "var(--text-primary)",
                              }}
                            />
                          </div>
                        </div>

                        <div
                          className="flex justify-end gap-2 pt-2 border-t"
                          style={{ borderColor: "var(--border-subtle)" }}
                        >
                          <button
                            onClick={cancelEditing}
                            className="btn-secondary px-3 py-1.5 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(scene.id)}
                            disabled={savingEdit}
                            className="btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
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
                  <div className="storyboard-card-visual space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                        Generated Visual ({projectAspectRatio})
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
                      className="relative rounded-xl border overflow-hidden group shadow-sm storyboard-thumbnail"
                      style={{
                        background: "var(--bg-card-subtle)",
                        borderColor: "var(--border-subtle)",
                        aspectRatio: projectAspectRatio.replace(":", " / "),
                      }}
                    >
                      {isCompleted && scene.image_url ? (
                        <>
                          <img
                            src={api.getMediaUrl(scene.image_url || undefined)}
                            alt={`Scene ${index + 1} Visual`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                            onError={(e) => {
                              // Graceful fallback for missing or corrupted disk assets
                              e.currentTarget.style.opacity = "0.4";
                            }}
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

                          {/* Source Tag Badge (Top Left) */}
                          <div className="absolute top-2 left-2 pointer-events-none">
                            {scene.image_metadata?.source === "graphic_template" ? (
                              <span className="px-2 py-0.5 rounded bg-indigo-900/90 backdrop-blur-md text-[10px] font-semibold text-indigo-200 border border-indigo-500/40 flex items-center gap-1 shadow">
                                📊 Graphic: {scene.image_metadata.template_type?.replace("_", " ").toUpperCase()}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-semibold text-purple-200 border border-purple-500/30 flex items-center gap-1 shadow">
                                🎨 AI Visual: {scene.image_metadata?.model || selectedModelId || "FLUX"}
                              </span>
                            )}
                          </div>

                          {/* Metadata Pill */}
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                            <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-zinc-700/60">
                              {scene.image_metadata?.source === "graphic_template"
                                ? "1080p • Pillow Engine"
                                : `${scene.image_metadata?.width || 1024}x${scene.image_metadata?.height || 576} • ${scene.image_metadata?.provider?.toUpperCase() || "AI"}`}
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
                              {capabilities?.provider?.toUpperCase() || "AI ENGINE"} • {projectAspectRatio}
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
          <div
            className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{
              background: "var(--color-modal)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <Wand2 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                <span>Direct Prompt Tweak • {regenModalScene.id}</span>
              </h3>
              <button
                onClick={() => setRegenModalScene(null)}
                className="p-1 rounded transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="p-3 rounded-xl border text-xs"
              style={{
                background: "var(--bg-card-subtle)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <span
                className="text-[10px] uppercase font-bold block mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Scene Caption
              </span>
              <p className="italic" style={{ color: "var(--text-primary)" }}>
                {regenModalScene.caption}
              </p>
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Creative Direction / Custom Guidance (Optional)
              </label>
              <textarea
                rows={3}
                value={regenInstructions}
                onChange={(e) => setRegenInstructions(e.target.value)}
                placeholder="e.g. Extreme close-up on cybernetic eye with rain droplets, high tension, macro lens..."
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none resize-none font-sans"
                style={{
                  background: "var(--bg-input)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <p
                className="text-[11px] mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                The AI will preserve the Video Bible visual rules while applying your specific directorial adjustments.
              </p>
            </div>

            <div
              className="flex justify-end gap-2.5 pt-2 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <button
                onClick={() => setRegenModalScene(null)}
                className="btn-secondary px-4 py-2 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRegeneratePrompt}
                disabled={regeneratingPrompt}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
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
          <div
            className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{
              background: "var(--color-modal)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <Layers className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                <span>Smart Visual Scene Clustering</span>
              </h3>
              <button
                onClick={() => setClusteringModalOpen(false)}
                className="p-1 rounded transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Rapid sentence-by-sentence captions make videos feel like a slideshow. Smart Clustering groups consecutive captions into 15–25 second visual scenes so images hold naturally while captions animate.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setClusterMode("fixed_duration")}
                className="p-3 rounded-xl border cursor-pointer transition-all"
                style={{
                  borderColor: clusterMode === "fixed_duration" ? "var(--accent-primary)" : "var(--border-default)",
                  background: clusterMode === "fixed_duration" ? "var(--accent-primary-subtle)" : "var(--bg-card-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <span className="block text-xs font-bold mb-1">Target Duration</span>
                <span className="text-[11px] leading-tight block" style={{ color: "var(--text-secondary)" }}>
                  Groups captions into natural ~{clusterTargetDuration}s visual chunks
                </span>
              </div>

              <div
                onClick={() => setClusterMode("smart_llm")}
                className="p-3 rounded-xl border cursor-pointer transition-all"
                style={{
                  borderColor: clusterMode === "smart_llm" ? "var(--accent-primary)" : "var(--border-default)",
                  background: clusterMode === "smart_llm" ? "var(--accent-primary-subtle)" : "var(--bg-card-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <span className="block text-xs font-bold mb-1">Smart AI Clustering</span>
                <span className="text-[11px] leading-tight block" style={{ color: "var(--text-secondary)" }}>
                  LLM analyzes narrative & topic shifts to detect scene boundaries
                </span>
              </div>
            </div>

            {clusterMode === "fixed_duration" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  <span>Target Scene Length</span>
                  <span className="font-mono font-semibold" style={{ color: "var(--accent-primary)" }}>
                    {clusterTargetDuration} seconds
                  </span>
                </div>
                <div className="flex gap-2">
                  {[10, 15, 20, 25, 30].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setClusterTargetDuration(dur)}
                      className="flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all"
                      style={{
                        background: clusterTargetDuration === dur ? "var(--accent-primary)" : "var(--bg-card-subtle)",
                        borderColor: clusterTargetDuration === dur ? "var(--accent-primary)" : "var(--border-default)",
                        color: clusterTargetDuration === dur ? "#FFFFFF" : "var(--text-secondary)",
                      }}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              className="p-3 rounded-xl border text-xs flex items-center justify-between"
              style={{
                background: "var(--accent-primary-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <span>Current: <strong>{scenes.length}</strong> rapid captions</span>
              <span>→</span>
              <span>
                Est. Result: <strong>~{Math.max(1, Math.round(totalVideoDuration / clusterTargetDuration))}</strong> visual scenes
              </span>
            </div>

            <div
              className="flex justify-end gap-2.5 pt-2 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <button
                onClick={() => setClusteringModalOpen(false)}
                className="btn-secondary px-4 py-2 rounded-xl text-xs font-medium"
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
          <div
            className="w-full max-w-3xl rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{
              background: "var(--color-modal)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <Palette className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                <span>Scene Visual Variations (A/B Test) • {variationsModalScene.id}</span>
              </h3>
              <button
                onClick={() => setVariationsModalScene(null)}
                className="p-1 rounded transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Choose the best candidate visual for this scene. Click any variation to apply it directly.
            </p>

            {variationsLoading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <span className="text-xs block" style={{ color: "var(--text-secondary)" }}>Generating 3 candidate variations in parallel...</span>
              </div>
            ) : variations.length === 0 ? (
              <div className="py-12 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                No variations available. Click below to generate candidates.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {variations.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleApplyVariation(variationsModalScene.id, v)}
                    className="group border rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] p-2 space-y-2 text-left"
                    style={{
                      background: "var(--bg-card-subtle)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div
                      className="relative rounded-lg overflow-hidden"
                      style={{
                        aspectRatio: projectAspectRatio.replace(":", " / "),
                        background: "var(--bg-surface)",
                      }}
                    >
                      <img src={api.getMediaUrl(v.image_url)} alt={`Variation ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-zinc-300">
                        Option {i + 1}
                      </span>
                    </div>
                    <span className="w-full btn-secondary text-xs py-1 group-hover:bg-purple-600 group-hover:text-white transition-colors block text-center">
                      Select Option {i + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div
              className="flex justify-between items-center pt-3 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
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
                className="btn-secondary px-4 py-2 rounded-xl text-xs font-medium"
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
          <div
            className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{
              background: "var(--color-modal)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <Layers className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                <span>Use Graphic Template Card • {graphicModalScene.id}</span>
              </h3>
              <button
                onClick={() => setGraphicModalScene(null)}
                className="p-1 rounded transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Generate crisp high-res cards (Key Point, Quote, Stat, Step) server-side without needing an AI generator.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Template Style</label>
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
                      className="p-2 rounded-lg text-xs font-medium border text-center transition-all"
                      style={{
                        background: graphicTemplateType === t.id ? "var(--accent-primary)" : "var(--bg-card-subtle)",
                        borderColor: graphicTemplateType === t.id ? "var(--accent-primary)" : "var(--border-default)",
                        color: graphicTemplateType === t.id ? "#FFFFFF" : "var(--text-secondary)",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Headline Text</label>
                <input
                  type="text"
                  value={graphicHeadline}
                  onChange={(e) => setGraphicHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Subtext / Citation (Optional)</label>
                <input
                  type="text"
                  value={graphicSubtext}
                  onChange={(e) => setGraphicSubtext(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Accent Color:</label>
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

            <div
              className="flex justify-end gap-2.5 pt-3 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <button
                onClick={() => setGraphicModalScene(null)}
                className="btn-secondary px-4 py-2 rounded-xl text-xs font-medium"
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

