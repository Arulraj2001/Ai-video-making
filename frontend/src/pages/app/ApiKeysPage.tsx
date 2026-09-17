import React, { useEffect, useState, useCallback } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Feedback";
import { Modal } from "../../components/ui/Modal";
import {
  Key,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sparkles,
  Cpu,
  Layers,
  Server,
  ExternalLink,
} from "lucide-react";
import { api } from "../../services/api";
import type { ApiKeyMetadata, TestApiKeyResponse } from "../../types";

const providerUrlMap: Record<string, { label: string; url: string }> = {
  openai: { label: "OpenAI Platform", url: "https://platform.openai.com/api-keys" },
  gemini: { label: "Google AI Studio", url: "https://aistudio.google.com/app/apikey" },
  fal: { label: "Fal.ai Dashboard", url: "https://fal.ai/dashboard/keys" },
  cloudflare: { label: "Cloudflare Dashboard", url: "https://dash.cloudflare.com/profile/api-tokens" },
  anthropic: { label: "Anthropic Console", url: "https://console.anthropic.com/settings/keys" },
  elevenlabs: { label: "ElevenLabs Console", url: "https://elevenlabs.io/app/speech-synthesis" },
};

export const ApiKeysPage: React.FC = () => {
  const [providers, setProviders] = useState<ApiKeyMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit / Add Modal State
  const [editingProvider, setEditingProvider] = useState<ApiKeyMetadata | null>(null);
  const [keyInput, setKeyInput] = useState<string>("");
  const [accountIdInput, setAccountIdInput] = useState<string>("");
  const [labelInput, setLabelInput] = useState<string>("");
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingProvider, setDeletingProvider] = useState<ApiKeyMetadata | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Test Connection State
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestApiKeyResponse>>({});

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await api.listApiKeys();
      setProviders(res.providers || []);
    } catch (err: any) {
      const message = err.message || "Failed to load provider credentials from vault.";
      setLoadError(message);
      setNotification({
        type: "error",
        message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleOpenAddEdit = (p: ApiKeyMetadata) => {
    setEditingProvider(p);
    setKeyInput("");
    setAccountIdInput("");
    setLabelInput(p.label || "");
    setShowSecret(false);
    setModalError(null);
  };

  const handleCloseModal = () => {
    setEditingProvider(null);
    setKeyInput("");
    setAccountIdInput("");
    setLabelInput("");
    setShowSecret(false);
    setModalError(null);
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    const trimmedKey = keyInput.trim();
    if (!trimmedKey) {
      setModalError("Please enter a valid API key.");
      return;
    }
    if (trimmedKey.length < 4) {
      setModalError("API key must be at least 4 characters.");
      return;
    }

    if (editingProvider.provider === "cloudflare" && !accountIdInput.trim()) {
      setModalError("Cloudflare requires both an API Token and Account ID.");
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      await api.saveApiKey({
        provider: editingProvider.provider,
        api_key: trimmedKey,
        label: labelInput.trim() || undefined,
        account_id: editingProvider.provider === "cloudflare" ? accountIdInput.trim() : undefined,
      });

      setNotification({
        type: "success",
        message: `Securely encrypted and saved credentials for ${editingProvider.label}.`,
      });
      handleCloseModal();
      await loadProviders();
    } catch (err: any) {
      setModalError(err.message || "Failed to save API key.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!deletingProvider) return;
    try {
      setDeleting(true);
      await api.deleteApiKey(deletingProvider.provider);
      setNotification({
        type: "success",
        message: `Successfully removed saved credentials for ${deletingProvider.label}.`,
      });
      setDeletingProvider(null);
      await loadProviders();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to remove API key.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleTestKey = async (p: ApiKeyMetadata) => {
    try {
      setTestingProvider(p.provider);
      const res = await api.testApiKey(p.provider);
      setTestResults((prev) => ({ ...prev, [p.provider]: res }));
      if (res.valid) {
        setNotification({
          type: "success",
          message: `${p.label}: Connection verified successfully!`,
        });
      } else {
        setNotification({
          type: "error",
          message: `${p.label}: ${res.message}`,
        });
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [p.provider]: { provider: p.provider, valid: false, message: err.message || "Test failed" },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "multimodal") return p.category === "multimodal";
    if (activeTab === "llm") return p.category === "llm";
    if (activeTab === "image") return p.category === "image";
    if (activeTab === "free") return p.category === "local_gpu" || p.provider === "pollinations";
    return true;
  });

  const configuredCount = providers.filter((p) => p.configured).length;
  const availableCount = providers.filter((p) => p.has_app_default || p.category === "local_gpu" || p.provider === "pollinations").length;
  const healthyCount = providers.filter((p) => p.validation_status === "valid").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
      {/* Page Header */}
      <PageHeader
        title="AI Connections"
        subtitle="Connect your own providers when you need more control over generation and inference."
        badge={
          <Badge variant="success" className="px-2.5 py-0.5 text-xs flex items-center gap-1.5 shadow-sm">
            <ShieldCheck size={13} />
            Zero Plaintext at Rest
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadProviders}
            disabled={loading}
            leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
        }
      />

      {/* Explainer Hero & Security Reassurance */}
      <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--surface-alt)] mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 mb-1.5">
              <Sparkles size={16} className="text-[#FF6B00]" />
              <span>API Keys Are 100% Optional</span>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed m-0">
              Free image generators (Flux &amp; Pollinations) work with zero configuration. Add your own key to unlock OpenAI DALL-E 3 or Gemini Imagen 3 at raw developer cost.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold shrink-0">
            <ShieldCheck size={14} />
            <span>Encrypted with AES-256 in client-isolated Firebase vault</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card variant="default" className="p-4 border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[var(--color-text-muted)]">Your keys</span>
            <Key size={15} className="text-[var(--color-primary)]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display text-[var(--color-text)]">{configuredCount}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Encrypted credentials saved</p>
        </Card>
        <Card variant="default" className="p-4 border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[var(--color-text-muted)]">Ready now</span>
            <Server size={15} className="text-[var(--color-secondary)]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display text-[var(--color-text)]">{availableCount}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Providers with an available route</p>
        </Card>
        <Card variant="default" className="p-4 border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[var(--color-text-muted)]">Verified</span>
            <CheckCircle2 size={15} className="text-[var(--color-success)]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display text-[var(--color-text)]">{healthyCount}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Successful connection checks</p>
        </Card>
      </div>

      {/* Security Guarantee Alert */}
      <Alert type="success" title="Encrypted personal vault & studio integration" className="mb-6 shadow-sm">
        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
          Keys are encrypted with <strong>AES-256-GCM</strong>, bound to your account, and never returned to the browser in plaintext.
          Connecting an <strong>OpenAI</strong> or <strong>Google Gemini</strong> key activates high-resolution image synthesis (including <strong>DALL-E 3</strong>) in your Storyboard Studio.
          Use <strong>Test</strong> after saving to verify the provider without running a billable generation.
        </p>
      </Alert>

      {/* Global Notification Banner */}
      {notification && (
        <Alert
          type={notification.type}
          className="mb-6"
          onDismiss={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      {/* Category Navigation Tabs */}
      <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--surface-alt)] p-1.5 mb-6 overflow-x-auto shadow-sm">
        {[
          { id: "all", label: "All Providers" },
          { id: "multimodal", label: "Multimodal & Unified" },
          { id: "llm", label: "Story LLMs" },
          { id: "image", label: "Image Generation" },
          { id: "free", label: "Keyless / Local" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 ${
              activeTab === tab.id
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)] border-[var(--color-primary)] shadow-sm"
                : "border-transparent bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]/70 hover:text-[var(--color-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Providers Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw size={32} className="animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading secure credentials from vault...</p>
        </div>
      ) : loadError ? (
        <Card variant="default" className="p-10 text-center border border-[var(--color-error)]/30">
          <AlertCircle size={28} className="mx-auto mb-3 text-[var(--color-error)]" />
          <h2 className="text-base font-bold text-[var(--color-text)]">Could not load your connections</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{loadError}</p>
          <Button variant="outline" size="sm" className="mt-5" onClick={loadProviders} leftIcon={<RefreshCw size={13} />}>
            Try again
          </Button>
        </Card>
      ) : filteredProviders.length === 0 ? (
        <Card variant="default" className="p-10 text-center border border-dashed border-[var(--color-border-strong)]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
            <Key size={22} />
          </div>
          <h2 className="text-base font-bold text-[var(--color-text)]">No providers in this view</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Choose another category or return to all providers.</p>
          <Button variant="outline" size="sm" className="mt-5" onClick={() => setActiveTab("all")}>Show all providers</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProviders.map((p) => {
            const isFree = p.category === "local_gpu" || p.provider === "pollinations";
            const testResult = testResults[p.provider];
            const isTesting = testingProvider === p.provider;

            return (
              <Card
                key={p.provider}
                variant="default"
                className="p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md border border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-primary)]">
                        {p.category === "local_gpu" ? (
                          <Cpu size={18} />
                        ) : p.category === "image" ? (
                          <Layers size={18} />
                        ) : p.category === "multimodal" ? (
                          <Sparkles size={18} />
                        ) : (
                          <Key size={18} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--color-text)] font-display flex items-center gap-2">
                          {p.label}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                            {p.category.replace("_", " ")}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                              p.provider === "openai" || p.provider === "gemini"
                                ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                                : p.category === "image" || p.provider === "sana_local"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                : "border-purple-500/30 bg-purple-500/10 text-purple-400"
                            }`}
                          >
                            {p.provider === "openai" || p.provider === "gemini"
                              ? "Image Gen + Storyboard LLM"
                              : p.category === "image" || p.provider === "sana_local"
                              ? "Image Generation"
                              : "Storyboard LLM"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isFree ? (
                        <Badge variant="secondary">Free / Zero Config</Badge>
                      ) : p.configured ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Active in Vault
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Configured</Badge>
                      )}

                      {p.has_app_default && !isFree && (
                        <span className="text-[10px] text-[var(--color-accent)] font-medium flex items-center gap-1">
                          <Server size={10} /> App Default Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2 leading-relaxed">
                    {p.description}
                  </p>

                  {providerUrlMap[p.provider] && (
                    <div className="mb-3">
                      <a
                        href={providerUrlMap[p.provider].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-[#FF6B00] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Get your {providerUrlMap[p.provider].label} API key →</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}

                  {/* Key Hint / Status */}
                  <div className="p-3 mb-4 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <Lock size={12} /> Stored Key Hint:
                      </span>
                      <span className="font-mono font-semibold text-[var(--color-text)]">
                        {isFree
                          ? "Keyless Provider"
                          : p.configured
                          ? p.key_hint
                          : p.has_app_default
                          ? "Using Server Default"
                          : "None"}
                      </span>
                    </div>

                    {p.provider === "cloudflare" && p.account_id_hint && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-border)]">
                        <span className="text-[var(--color-text-muted)]">Account ID:</span>
                        <span className="font-mono font-semibold text-[var(--color-text)]">
                          {p.account_id_hint}
                        </span>
                      </div>
                    )}

                    {p.updated_at && (
                      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]">
                        <span>Last Updated:</span>
                        <span>{new Date(p.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Supported Models Chips */}
                  {p.supported_models && p.supported_models.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5">
                        Supported Models
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {p.supported_models.map((model) => (
                          <span
                            key={model}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connection Test Result Feedback */}
                  {testResult && (
                    <div
                      className={`p-2.5 mb-4 rounded-[var(--radius-md)] text-xs flex items-start gap-2 border ${
                        testResult.valid
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {testResult.valid ? (
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2 mt-2">
                  {isFree ? (
                    <span className="text-xs text-[var(--color-text-muted)] italic">
                      Zero configuration needed
                    </span>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={p.configured ? "outline" : "primary"}
                          size="sm"
                          onClick={() => handleOpenAddEdit(p)}
                        >
                          {p.configured ? "Update Key" : "Add Key"}
                        </Button>

                        {(p.configured || p.has_app_default) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isTesting}
                            onClick={() => handleTestKey(p)}
                            leftIcon={
                              isTesting ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={13} />
                              )
                            }
                          >
                            {isTesting ? "Testing..." : "Test"}
                          </Button>
                        )}
                      </div>

                      {p.configured && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingProvider(p)}
                          className="text-[var(--color-error)] hover:bg-red-500/10 hover:text-red-600"
                          leftIcon={<Trash2 size={13} />}
                        >
                          Remove
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Key Modal */}
      {editingProvider && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          size="lg"
          title={
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                <Key size={17} />
              </div>
              <span>
                {editingProvider.configured ? "Update" : "Connect"} {editingProvider.label}
              </span>
            </div>
          }
          description="Add a provider connection for your personal workspace."
        >
          <form onSubmit={handleSaveKey} className="space-y-5">
            {modalError && (
              <Alert type="error">
                {modalError}
              </Alert>
            )}

            <div className="flex items-start gap-3 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-subtle)] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm">
                {editingProvider.category === "image" ? <Layers size={18} /> : <Sparkles size={18} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--color-text)]">{editingProvider.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {editingProvider.description || "Use this provider for your workspace generation pipeline."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 shadow-sm sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={`${editingProvider.label} API Key`}
                  type={showSecret ? "text" : "password"}
                  placeholder="Paste your secret key"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  autoFocus
                  required
                  className="bg-[var(--color-surface)] border-[var(--color-border-strong)] font-mono text-xs shadow-sm"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      aria-label={showSecret ? "Hide API key" : "Show API key"}
                      className="cursor-pointer hover:text-[var(--color-text)] transition-colors"
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <Input
                  label="Connection label (optional)"
                  placeholder="e.g. Production images"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  className="bg-[var(--color-surface)] border-[var(--color-border-strong)] shadow-sm"
                />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                The key is encrypted before storage and only a masked hint will be shown after saving.
              </p>
              {editingProvider.provider === "cloudflare" && (
                <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                  <Input
                    label="Cloudflare Account ID"
                    placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                    value={accountIdInput}
                    onChange={(e) => setAccountIdInput(e.target.value)}
                    required
                    className="bg-[var(--color-surface)] border-[var(--color-border-strong)] font-mono text-xs shadow-sm"
                  />
                  <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
                    Required for Cloudflare Workers AI edge inference.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-[var(--color-success)]/25 bg-[var(--color-success-subtle)] p-4 text-xs text-[var(--color-text-secondary)]">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
              <p className="leading-relaxed">
                This connection is tied to your account. ScenoraEdits does not display or return the complete secret after it is saved.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">AES-256-GCM encrypted</span>
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  leftIcon={saving ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                >
                  {saving ? "Encrypting..." : "Save connection"}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProvider && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingProvider(null)}
          title={`Remove ${deletingProvider.label} API Key?`}
          description="Are you sure you want to remove this key from your vault?"
          size="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Once removed, ScenoraEdits will no longer be able to use your custom key for image or storyboard
              generation. If a server default is available, the system will fall back to it.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                onClick={() => setDeletingProvider(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteKey}
                disabled={deleting}
                leftIcon={deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              >
                {deleting ? "Removing..." : "Remove Key"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
