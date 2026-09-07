import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AlertCircle, X } from "lucide-react";
import { api } from "../../services/api";
import type {
  Project,
  Scene,
  ModelCatalogItem,
  SceneVariationItem,
  ProviderUsageStats,
} from "../../types";

// Sub-components
import { StoryboardHeader } from "./StoryboardHeader";
import { StoryboardToolbar } from "./StoryboardToolbar";
import { StoryboardSceneCard } from "./StoryboardSceneCard";
import { StoryboardEmptyState } from "./StoryboardEmptyState";
import { StoryboardDetailsModal } from "./StoryboardDetailsModal";
import { StoryboardTweakModal } from "./StoryboardTweakModal";
import { StoryboardLightboxModal } from "./StoryboardLightboxModal";
import { StoryboardClusteringModal } from "./StoryboardClusteringModal";
import { StoryboardVariationsModal } from "./StoryboardVariationsModal";
import { StoryboardGraphicModal } from "./StoryboardGraphicModal";

interface StoryboardViewProps {
  project: Project;
  onProjectUpdated?: (updated: Project | ((previous: Project) => Project)) => void;
  onSwitchToBible?: () => void;
}

const STYLE_MODES = [
  { id: "photorealistic", label: "Photorealistic" },
  { id: "cinematic", label: "Cinematic" },
  { id: "documentary", label: "Documentary" },
  { id: "3d", label: "3D Animation" },
  { id: "anime", label: "Anime" },
  { id: "flat", label: "Flat Vector" },
  { id: "cartoon", label: "Minimal Cartoon" },
  { id: "sketch", label: "Hand Drawn Sketch" },
  { id: "whiteboard", label: "Whiteboard" },
  { id: "stickfigure", label: "Stickman" },
  { id: "custom", label: "Custom Directives" },
];

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
  const [styleMode, setStyleMode] = useState<string>("photorealistic");

  // Multi-select & Merge state
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const [mergingInProgress, setMergingInProgress] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [viewLayout, setViewLayout] = useState<"cards" | "compact">("cards");

  // Inline editing state
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMotion, setEditMotion] = useState("");
  const [editTransition, setEditTransition] = useState("");
  const [editAspectRatio, setEditAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [sceneAspectRatios, setSceneAspectRatios] = useState<Record<string, "16:9" | "9:16" | "1:1">>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Modals state
  const [detailsModalScene, setDetailsModalScene] = useState<Scene | null>(null);
  const [regenModalScene, setRegenModalScene] = useState<Scene | null>(null);
  const [regenInstructions, setRegenInstructions] = useState("");
  const [regeneratingPrompt, setRegeneratingPrompt] = useState(false);

  const [previewImage, setPreviewImage] = useState<{
    url: string;
    sceneNumber: number;
    caption: string;
    metadata?: any;
  } | null>(null);

  // Smart Clustering modal
  const [clusteringModalOpen, setClusteringModalOpen] = useState(false);
  const [clusterTargetDuration, setClusterTargetDuration] = useState<number>(15.0);
  const [clusterMode, setClusterMode] = useState<"fixed_duration" | "smart_llm">("fixed_duration");
  const [clusteringInProgress, setClusteringInProgress] = useState(false);
  const [dismissRapidAlert, setDismissRapidAlert] = useState(false);

  // Variations modal
  const [variationsModalScene, setVariationsModalScene] = useState<Scene | null>(null);
  const [variations, setVariations] = useState<SceneVariationItem[]>([]);
  const [variationsByScene, setVariationsByScene] = useState<Record<string, SceneVariationItem[]>>({});
  const [variationsLoading, setVariationsLoading] = useState(false);
  const [variationsError, setVariationsError] = useState<string | null>(null);

  // Graphic template modal
  const [graphicModalScene, setGraphicModalScene] = useState<Scene | null>(null);
  const [graphicTemplateType, setGraphicTemplateType] = useState<
    "title_card" | "quote_card" | "stats_card" | "step_card" | "split_layout"
  >("title_card");
  const [graphicHeadline, setGraphicHeadline] = useState("");
  const [graphicSubtext, setGraphicSubtext] = useState("");
  const [graphicAccent, setGraphicAccent] = useState("#FF6B00");
  const [graphicApplying, setGraphicApplying] = useState(false);

  const projectAspectRatio = project.canvas_settings?.aspect_ratio || "16:9";
  // Project aspect ratio CSS helper: aspectRatio: projectAspectRatio.replace(":", " / ")

  // Sync scenes if project prop updates
  useEffect(() => {
    setScenes(project.scenes || []);
  }, [project.scenes]);

  useEffect(() => {
    setVariationsByScene({});
    setVariations([]);
    setVariationsModalScene(null);
  }, [project.id]);

  // Load model catalog and provider usage on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
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

  const modelCategories = useMemo(() => {
    const groupDefs: Record<string, { label: string; items: ModelCatalogItem[] }> = {
      free_cloud: { label: "⚡ Free Cloud (Zero Setup / Unlimited)", items: [] },
      quota_cloud: { label: "☁️ Cloudflare Workers AI (Daily Quota)", items: [] },
      local: { label: "💻 Local Machine (Offline GPU)", items: [] },
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

    return Object.entries(groupDefs).filter(([, g]) => g.items.length > 0);
  }, [models]);

  // Statistics
  const storyboardedCount = useMemo(
    () => scenes.filter((s) => Boolean(s.image_prompt)).length,
    [scenes]
  );
  const imagesCompletedCount = useMemo(
    () => scenes.filter((s) => s.image_status === "completed" && Boolean(s.image_url)).length,
    [scenes]
  );
  const imagesFailedCount = useMemo(
    () => scenes.filter((s) => s.image_status === "failed").length,
    [scenes]
  );
  const isAllImagesCompleted = scenes.length > 0 && imagesCompletedCount === scenes.length;

  const totalVideoDuration = useMemo(() => {
    if (!scenes.length) return 0;
    return scenes.reduce((sum, s) => sum + s.duration, 0);
  }, [scenes]);

  const avgSceneDuration = useMemo(() => {
    if (!scenes.length) return 0;
    return totalVideoDuration / scenes.length;
  }, [scenes, totalVideoDuration]);

  const isRapidPaced = scenes.length > 3 && avgSceneDuration < 8.0;

  // Filtered scenes
  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      if (statusFilter === "completed") {
        if (!(scene.image_status === "completed" && Boolean(scene.image_url))) return false;
      } else if (statusFilter === "pending") {
        if (scene.image_status === "completed" && Boolean(scene.image_url)) return false;
        if (scene.image_status === "failed") return false;
      } else if (statusFilter === "failed") {
        if (scene.image_status !== "failed") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inCaption = (scene.caption || "").toLowerCase().includes(q);
        const inPrompt = (scene.image_prompt || "").toLowerCase().includes(q);
        const inId = scene.id.toLowerCase().includes(q);
        if (!inCaption && !inPrompt && !inId) return false;
      }

      return true;
    });
  }, [scenes, statusFilter, searchQuery]);

  // Selection handlers
  const toggleSelectScene = (sceneId: string) => {
    setSelectedSceneIds((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedSceneIds(new Set(filteredScenes.map((s) => s.id)));
  };

  const clearSelection = () => {
    setSelectedSceneIds(new Set());
  };

  // Helper to apply single scene updates
  const applySingleScene = (sceneId: string, updatedScene: Scene) => {
    setScenes((previous) => previous.map((scene) => (scene.id === sceneId ? updatedScene : scene)));
    onProjectUpdated?.((previous) => ({
      ...previous,
      scenes: previous.scenes.map((scene) => (scene.id === sceneId ? updatedScene : scene)),
    }));
  };

  // Helper to apply scene collection
  const applySceneCollection = (updatedScenes: Scene[], replace = false) => {
    const updatedById = new Map(updatedScenes.map((scene) => [scene.id, scene]));
    setScenes((previous) =>
      replace ? updatedScenes : previous.map((scene) => updatedById.get(scene.id) || scene)
    );
    onProjectUpdated?.((previous) => ({
      ...previous,
      scenes: replace
        ? updatedScenes
        : previous.scenes.map((scene) => updatedById.get(scene.id) || scene),
    }));
  };

  // 1. Synthesize Storyboard for all scenes
  const handleGenerateAllStoryboard = async () => {
    if (generatingAllStoryboard || scenes.length === 0) return;
    setGeneratingAllStoryboard(true);
    setError(null);

    try {
      const res = await api.generateStoryboard(project.id);
      applySceneCollection(res.scenes);
    } catch (err: any) {
      setError(`Storyboard generation failed: ${err.message || "Unknown error"}`);
    } finally {
      setGeneratingAllStoryboard(false);
    }
  };

  // 2. Generate Single Scene Visual
  const handleGenerateSceneImage = async (sceneId: string, isRegen = false) => {
    if (generatingSceneIds.has(sceneId)) return;

    const reqToken = (sceneRequestTokens.current.get(sceneId) || 0) + 1;
    sceneRequestTokens.current.set(sceneId, reqToken);

    setGeneratingSceneIds((prev) => new Set(prev).add(sceneId));
    setError(null);

    setScenes((prev) =>
      prev.map((s) =>
        s.id === sceneId ? { ...s, image_status: "generating", image_error: undefined } : s
      )
    );

    try {
      const targetAspect =
        sceneAspectRatios[sceneId] || (projectAspectRatio as "16:9" | "9:16" | "1:1");
      const updated = await api.generateSceneImage(project.id, sceneId, {
        force: isRegen,
        style_mode: styleMode,
        provider: selectedProvider,
        model_id: selectedModelId,
        aspect_ratio: targetAspect,
      });

      if (sceneRequestTokens.current.get(sceneId) === reqToken) {
        applySingleScene(sceneId, updated);
      }
      refreshUsageStats();
    } catch (err: any) {
      if (sceneRequestTokens.current.get(sceneId) === reqToken) {
        setScenes((prev) =>
          prev.map((s) =>
            s.id === sceneId
              ? { ...s, image_status: "failed", image_error: err.message || "Synthesis error" }
              : s
          )
        );
      }
      setError(`Failed to generate visual for scene ${sceneId}: ${err.message}`);
    } finally {
      setGeneratingSceneIds((prev) => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  };

  // 3. Generate All Scene Images in Batch
  const handleGenerateAllImages = async (isRegen = false) => {
    if (generatingAllImages || scenes.length === 0) return;
    setGeneratingAllImages(true);
    setError(null);

    try {
      const res = await api.generateAllSceneImages(project.id, {
        force: isRegen,
        style_mode: styleMode,
        provider: selectedProvider,
        model_id: selectedModelId,
      });
      applySceneCollection(res.scenes);
      refreshUsageStats();

      if (res.failed_count > 0) {
        setError(
          `Batch completed: ${res.completed_count} images ready, ${res.failed_count} scenes failed.`
        );
      }
    } catch (err: any) {
      setError(err.message || "Batch image generation failed");
    } finally {
      setGeneratingAllImages(false);
    }
  };

  // 4. Retry Failed Images
  const handleRetryFailedImages = async () => {
    if (retryingFailed || scenes.length === 0) return;
    setRetryingFailed(true);
    setError(null);

    try {
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
    }
  };

  // 5. Inline Editing handlers
  const startEditing = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setEditPrompt(scene.image_prompt || "");
    setEditDescription(scene.visual_description || "");
    setEditMotion(scene.suggested_motion || scene.motion || "");
    setEditTransition(scene.suggested_transition || scene.transition || "");
    setEditAspectRatio(
      sceneAspectRatios[scene.id] ||
      (scene.image_metadata?.aspect_ratio as "16:9" | "9:16" | "1:1") ||
      (projectAspectRatio as "16:9" | "9:16" | "1:1") ||
      "16:9"
    );
  };

  const cancelEditing = () => {
    setEditingSceneId(null);
  };

  const handleSaveEdit = async (sceneId: string) => {
    setSavingEdit(true);
    setError(null);
    try {
      const updated = await api.updateSceneStoryboard(project.id, sceneId, {
        image_prompt: editPrompt.trim(),
        visual_description: editDescription.trim(),
        suggested_motion: editMotion.trim(),
        suggested_transition: editTransition.trim(),
      });

      setSceneAspectRatios((prev) => ({
        ...prev,
        [sceneId]: editAspectRatio,
      }));

      applySingleScene(sceneId, updated);
      setEditingSceneId(null);
    } catch (err: any) {
      setError(`Failed to save scene directives: ${err.message || "Unknown error"}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // 6. Copy Prompt
  const handleCopyPrompt = async (sceneId: string, promptText: string) => {
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedSceneId(sceneId);
      setTimeout(() => setCopiedSceneId(null), 2500);
    } catch {
      setError("Clipboard write failed");
    }
  };

  // 7. Prompt Tweak Modal
  const openRegenModal = (scene: Scene) => {
    setRegenModalScene(scene);
    setRegenInstructions("");
  };

  const handleRegeneratePrompt = async () => {
    if (!regenModalScene) return;
    setRegeneratingPrompt(true);
    setError(null);
    try {
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

  // 8. Smart Scene Clustering
  const handleClusterScenes = async () => {
    setClusteringInProgress(true);
    setError(null);
    try {
      const res = await api.clusterScenes(project.id, {
        mode: clusterMode,
        target_duration: clusterTargetDuration,
      });
      applySceneCollection(res.scenes, true);
      setClusteringModalOpen(false);
    } catch (err: any) {
      setError(`Scene clustering failed: ${err.message || "Unknown error"}`);
    } finally {
      setClusteringInProgress(false);
    }
  };

  // 9. Merge Selected Scenes
  const handleMergeSelected = async () => {
    if (selectedSceneIds.size < 2 || mergingInProgress) return;
    setMergingInProgress(true);
    setError(null);
    try {
      const res = await api.mergeScenes(project.id, Array.from(selectedSceneIds));
      applySceneCollection(res.scenes, true);
      clearSelection();
    } catch (err: any) {
      setError(`Failed to merge selected scenes: ${err.message || "Unknown error"}`);
    } finally {
      setMergingInProgress(false);
    }
  };

  // 10. Variations Modal
  const handleOpenVariations = async (scene: Scene, forceGenerate = false) => {
    setVariationsModalScene(scene);
    setVariationsError(null);

    const cachedVariations = variationsByScene[scene.id];
    if (!forceGenerate && cachedVariations?.length) {
      setVariations(cachedVariations);
      return;
    }

    setVariations([]);
    setVariationsLoading(true);

    try {
      const res = await api.generateSceneVariations(project.id, scene.id, {
        style_mode: styleMode,
        provider: selectedProvider,
        model_id: selectedModelId,
      });
      const nextVariations = res.variations || [];
      setVariations(nextVariations);
      setVariationsByScene((previous) => ({ ...previous, [scene.id]: nextVariations }));
    } catch (err: any) {
      setVariationsError(err.message || "Failed to generate variations");
    } finally {
      setVariationsLoading(false);
    }
  };

  const handleApplyVariation = async (sceneId: string, variation: SceneVariationItem) => {
    try {
      const updated = await api.updateSceneTimeline(project.id, sceneId, {
        image_url: variation.image_url,
        image_status: "completed",
        image_metadata: variation.metadata || undefined,
      });
      applySceneCollection(updated.scenes);
      setVariationsModalScene(null);
    } catch (err: any) {
      setError(`Failed to apply candidate visual: ${err.message || "Unknown error"}`);
    }
  };

  // 11. Graphic Template Modal
  const handleOpenGraphicModal = (scene: Scene) => {
    setGraphicModalScene(scene);
    setGraphicHeadline(scene.caption || "");
    setGraphicSubtext("");
  };

  const handleApplyGraphicTemplate = async () => {
    if (!graphicModalScene || !graphicHeadline.trim()) return;
    setGraphicApplying(true);
    setError(null);
    try {
      const updated = await api.applyGraphicTemplate(project.id, graphicModalScene.id, {
        template_type: graphicTemplateType,
        headline: graphicHeadline.trim(),
        subtext: graphicSubtext.trim(),
        accent_color: graphicAccent,
      });

      applySingleScene(graphicModalScene.id, updated);
      setGraphicModalScene(null);
    } catch (err: any) {
      setError(`Failed to render graphic card: ${err.message || "Unknown error"}`);
    } finally {
      setGraphicApplying(false);
    }
  };

  // Lightbox Next/Prev scene helpers
  const currentLightboxIndex = useMemo(() => {
    if (!previewImage) return -1;
    return scenes.findIndex((_s, i) => i + 1 === previewImage.sceneNumber);
  }, [previewImage, scenes]);

  const handlePrevLightbox = () => {
    if (currentLightboxIndex > 0) {
      const prevScene = scenes[currentLightboxIndex - 1];
      if (prevScene.image_url) {
        setPreviewImage({
          url: api.getMediaUrl(prevScene.image_url),
          sceneNumber: currentLightboxIndex,
          caption: prevScene.caption,
          metadata: prevScene.image_metadata,
        });
      }
    }
  };

  const handleNextLightbox = () => {
    if (currentLightboxIndex >= 0 && currentLightboxIndex < scenes.length - 1) {
      const nextScene = scenes[currentLightboxIndex + 1];
      if (nextScene.image_url) {
        setPreviewImage({
          url: api.getMediaUrl(nextScene.image_url),
          sceneNumber: currentLightboxIndex + 2,
          caption: nextScene.caption,
          metadata: nextScene.image_metadata,
        });
      }
    }
  };

  return (
    <div className="sb-canvas">
      {/* 1. Storyboard Command Header */}
      <StoryboardHeader
        scenesCount={scenes.length}
        storyboardedCount={storyboardedCount}
        imagesCompletedCount={imagesCompletedCount}
        imagesFailedCount={imagesFailedCount}
        projectAspectRatio={projectAspectRatio}
        models={models}
        modelCategories={modelCategories}
        selectedModelId={selectedModelId}
        selectedProvider={selectedProvider}
        onSelectModel={(mid, prov) => {
          setSelectedModelId(mid);
          setSelectedProvider(prov);
        }}
        usageStats={usageStats}
        styleMode={styleMode}
        onChangeStyleMode={setStyleMode}
        styleModes={STYLE_MODES}
        generatingAllImages={generatingAllImages}
        generatingAllStoryboard={generatingAllStoryboard}
        retryingFailed={retryingFailed}
        isAllImagesCompleted={isAllImagesCompleted}
        onGenerateAllImages={handleGenerateAllImages}
        onRetryFailedImages={handleRetryFailedImages}
        isRapidPaced={isRapidPaced}
        avgSceneDuration={avgSceneDuration}
        dismissRapidAlert={dismissRapidAlert}
        onDismissRapidAlert={() => setDismissRapidAlert(true)}
        onOpenClusteringModal={() => setClusteringModalOpen(true)}
      />

      {/* Non-blocking Inline Error Banner */}
      {error && (
        <div className="sb-error-banner">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span style={{ flex: 1, fontWeight: 500 }}>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-0.5 rounded transition-opacity hover:opacity-60"
            aria-label="Dismiss error"
            style={{ color: "var(--sb-danger)" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Empty State: If no prompts synthesized yet */}
      {storyboardedCount === 0 && !generatingAllStoryboard ? (
        <StoryboardEmptyState
          scenesCount={scenes.length}
          onSynthesize={handleGenerateAllStoryboard}
          onSwitchToBible={onSwitchToBible}
          synthesizing={generatingAllStoryboard}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* 2. Search, Filter & Bulk Actions Toolbar */}
          <StoryboardToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery("")}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            counts={{
              total: scenes.length,
              completed: imagesCompletedCount,
              pending: scenes.length - imagesCompletedCount - imagesFailedCount,
              failed: imagesFailedCount,
            }}
            selectedCount={selectedSceneIds.size}
            onMergeSelected={handleMergeSelected}
            onClearSelection={clearSelection}
            onSelectAllFiltered={selectAllFiltered}
            mergingInProgress={mergingInProgress}
            viewLayout={viewLayout}
            onViewLayoutChange={setViewLayout}
            canMerge={selectedSceneIds.size >= 2}
          />

          {/* 3. Render Storyboard Scene Grid */}
          {filteredScenes.length === 0 ? (
            <div className="sb-no-results">
              {searchQuery.trim()
                ? "No scenes match your search terms."
                : "No scenes match the selected status filter."}
            </div>
          ) : (
            <div className={`sb-scene-grid ${viewLayout === "compact" ? "is-compact" : ""}`}>
              {filteredScenes.map((scene) => {
                const index = scenes.findIndex((s) => s.id === scene.id);
                const isSelected = selectedSceneIds.has(scene.id);
                const isEditing = editingSceneId === scene.id;
                const sceneAspectRatio =
                  sceneAspectRatios[scene.id] ||
                  (scene.image_metadata?.aspect_ratio as "16:9" | "9:16" | "1:1") ||
                  (projectAspectRatio as "16:9" | "9:16" | "1:1") ||
                  "16:9";
                const isCopied = copiedSceneId === scene.id;
                const isSceneGenerating =
                  generatingSceneIds.has(scene.id) ||
                  scene.image_status === "generating" ||
                  (generatingAllImages && scene.image_status !== "completed");
                const isCompleted = scene.image_status === "completed" && Boolean(scene.image_url);
                const isFailed = scene.image_status === "failed";

                return (
                  <StoryboardSceneCard
                    key={scene.id}
                    scene={scene}
                    index={index}
                    isSelected={isSelected}
                    onToggleSelect={toggleSelectScene}
                    viewLayout={viewLayout}
                    isSceneGenerating={isSceneGenerating}
                    isCompleted={isCompleted}
                    isFailed={isFailed}
                    projectAspectRatio={projectAspectRatio}
                    sceneAspectRatio={sceneAspectRatio}
                    onGenerateSceneImage={handleGenerateSceneImage}
                    generatingAllImages={generatingAllImages}
                    onOpenLightbox={setPreviewImage}
                    onCopyPrompt={handleCopyPrompt}
                    isCopied={isCopied}
                    onOpenDetails={(s) => setDetailsModalScene(s)}
                    onOpenTweakModal={openRegenModal}
                    onOpenVariations={handleOpenVariations}
                    onOpenGraphicModal={handleOpenGraphicModal}
                    variationsLoading={variationsLoading && variationsModalScene?.id === scene.id}
                    isEditing={isEditing}
                    onStartEditing={startEditing}
                    onCancelEditing={cancelEditing}
                    onSaveEdit={handleSaveEdit}
                    editPrompt={editPrompt}
                    setEditPrompt={setEditPrompt}
                    editDescription={editDescription}
                    setEditDescription={setEditDescription}
                    editMotion={editMotion}
                    setEditMotion={setEditMotion}
                    editTransition={editTransition}
                    setEditTransition={setEditTransition}
                    editAspectRatio={editAspectRatio}
                    setEditAspectRatio={setEditAspectRatio}
                    savingEdit={savingEdit}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Dedicated Root-Level Modals */}

      {/* Scene Details Telemetry Modal */}
      <StoryboardDetailsModal
        scene={detailsModalScene}
        sceneIndex={
          detailsModalScene
            ? scenes.findIndex((s) => s.id === detailsModalScene.id)
            : 0
        }
        isOpen={Boolean(detailsModalScene)}
        onClose={() => setDetailsModalScene(null)}
        onEditScene={(sceneToEdit) => startEditing(sceneToEdit)}
        onTweakPrompt={(s) => openRegenModal(s)}
        projectAspectRatio={projectAspectRatio}
      />

      {/* Direct Prompt Guidance & Tweak Modal */}
      <StoryboardTweakModal
        scene={regenModalScene}
        isOpen={Boolean(regenModalScene)}
        onClose={() => setRegenModalScene(null)}
        regenInstructions={regenInstructions}
        onChangeInstructions={setRegenInstructions}
        onRegenerate={handleRegeneratePrompt}
        regenerating={regeneratingPrompt}
      />

      {/* Fullscreen Cinema Image Lightbox Modal */}
      <StoryboardLightboxModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
        onPrevScene={handlePrevLightbox}
        onNextScene={handleNextLightbox}
        hasPrev={currentLightboxIndex > 0 && Boolean(scenes[currentLightboxIndex - 1]?.image_url)}
        hasNext={currentLightboxIndex >= 0 && currentLightboxIndex < scenes.length - 1 && Boolean(scenes[currentLightboxIndex + 1]?.image_url)}
      />

      {/* Smart Scene Clustering Modal */}
      <StoryboardClusteringModal
        isOpen={clusteringModalOpen}
        onClose={() => setClusteringModalOpen(false)}
        clusterMode={clusterMode}
        onChangeClusterMode={setClusterMode}
        clusterTargetDuration={clusterTargetDuration}
        onChangeTargetDuration={setClusterTargetDuration}
        onRunClustering={handleClusterScenes}
        clusteringInProgress={clusteringInProgress}
        scenesCount={scenes.length}
        totalDuration={totalVideoDuration}
      />

      {/* A/B Candidate Variations Modal */}
      <StoryboardVariationsModal
        scene={variationsModalScene}
        isOpen={Boolean(variationsModalScene)}
        onClose={() => setVariationsModalScene(null)}
        variations={variations}
        variationsLoading={variationsLoading}
        variationsError={variationsError}
        onApplyVariation={handleApplyVariation}
        onRerollVariations={(scene) => handleOpenVariations(scene, true)}
        projectAspectRatio={projectAspectRatio}
      />

      {/* Graphic Template Card Modal */}
      <StoryboardGraphicModal
        scene={graphicModalScene}
        isOpen={Boolean(graphicModalScene)}
        onClose={() => setGraphicModalScene(null)}
        graphicTemplateType={graphicTemplateType}
        onChangeTemplateType={setGraphicTemplateType}
        headline={graphicHeadline}
        onChangeHeadline={setGraphicHeadline}
        subtext={graphicSubtext}
        onChangeSubtext={setGraphicSubtext}
        accentColor={graphicAccent}
        onChangeAccentColor={setGraphicAccent}
        onApplyTemplate={handleApplyGraphicTemplate}
        applying={graphicApplying}
      />
    </div>
  );
};
