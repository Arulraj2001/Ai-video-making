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
} from "lucide-react";
import { api } from "../../services/api";
import type { ApiKeyMetadata, TestApiKeyResponse } from "../../types";

export const ApiKeysPage: React.FC = () => {
  const [providers, setProviders] = useState<ApiKeyMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
      const res = await api.listApiKeys();
      setProviders(res.providers || []);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to load provider credentials from vault.",
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
      {/* Page Header */}
      <PageHeader
        title="Secure Credential Vault"
        subtitle="AES-256-GCM authenticated encryption for your personal third-party AI keys."
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

      {/* Security Guarantee Alert */}
      <Alert type="success" title="End-to-End Vault Security" className="mb-6 shadow-sm">
        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
          All API keys are encrypted at rest using <strong>AES-256-GCM</strong> authenticated encryption.
          Every key is cryptographically bound to your user identity with Authenticated Additional Data (AAD).
          Raw keys are <strong>never stored in plaintext</strong>, never returned to client web browsers, and
          are decrypted strictly in backend volatile memory during pipeline execution.
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
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] mb-6 overflow-x-auto pb-2">
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
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
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
                        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                          {p.category.replace("_", " ")}
                        </span>
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
                  <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                    {p.description}
                  </p>

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
          title={
            <div className="flex items-center gap-2">
              <Key size={18} className="text-[var(--color-primary)]" />
              <span>
                {editingProvider.configured ? "Update" : "Add"} {editingProvider.label} Key
              </span>
            </div>
          }
          description="Your credentials will be encrypted with AES-256-GCM before saving to your personal vault."
        >
          <form onSubmit={handleSaveKey} className="space-y-4 pt-2">
            {modalError && (
              <Alert type="error" className="mb-2">
                {modalError}
              </Alert>
            )}

            <div>
              <Input
                label={`${editingProvider.label} API Key`}
                type={showSecret ? "text" : "password"}
                placeholder="Enter secret API key..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                autoFocus
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="cursor-pointer hover:text-[var(--color-text)] transition-colors"
                  >
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Your key will be AES-256-GCM encrypted and never visible in plaintext again.
              </p>
            </div>

            {editingProvider.provider === "cloudflare" && (
              <div>
                <Input
                  label="Cloudflare Account ID"
                  placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                  value={accountIdInput}
                  onChange={(e) => setAccountIdInput(e.target.value)}
                  required
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Required for Cloudflare Workers AI edge inference.
                </p>
              </div>
            )}

            <div>
              <Input
                label="Custom Label (Optional)"
                placeholder="e.g. Personal Production Key"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
              />
            </div>

            <div className="p-3 bg-[var(--color-surface-elevated)] rounded-md border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-start gap-2">
              <Lock size={15} className="shrink-0 text-[var(--color-primary)] mt-0.5" />
              <span>
                Keys are authenticated against your personal UID via AES-GCM Authenticated Additional Data (AAD).
                They cannot be extracted or transferred between accounts.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                leftIcon={saving ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              >
                {saving ? "Encrypting & Saving..." : "Save to Vault"}
              </Button>
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
