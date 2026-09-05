import React, { useEffect, useState } from "react";
import { Eye, X, Copy, Check, Sparkles, Shield, User, MapPin, Package, RefreshCw } from "lucide-react";
import { api } from "../../services/api";
import type { VisualContext } from "../../types";

interface VisualContextDrawerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VisualContextDrawer: React.FC<VisualContextDrawerProps> = ({
  projectId,
  isOpen,
  onClose,
}) => {
  const [context, setContext] = useState<VisualContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchContext = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getVisualContext(projectId);
      setContext(res);
    } catch (err: any) {
      setError(err.message || "Failed to compile visual context");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      fetchContext();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                Normalized Visual Context
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
                  build_visual_context()
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Live output injected into downstream scene prompt synthesis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchContext}
              disabled={loading}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Refresh Context"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && !context && (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-zinc-400">Compiling visual consistency data...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {context && (
            <>
              {/* Style Prompt Fragment Card */}
              <div className="p-5 rounded-xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950/40 via-zinc-900/50 to-zinc-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Global Style Prefix Fragment
                  </span>
                  <button
                    onClick={() => copyToClipboard(context.style_prompt_fragment)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-black/50 border border-zinc-800 font-mono text-xs text-zinc-200 leading-relaxed break-words select-all">
                  {context.style_prompt_fragment || (
                    <span className="text-zinc-500 italic">No overall style specified yet.</span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  This string is automatically prepended to every scene prompt to enforce global lighting, color grading, and lens realism.
                </p>
              </div>

              {/* Active Rules */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Active Consistency Rules ({context.active_rules.length})
                </h4>
                {context.active_rules.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No global rules configured.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {context.active_rules.map((rule) => (
                      <span
                        key={rule}
                        className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs"
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Entity Catalogs */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Entity Catalogs (Named Entities)
                </h4>

                {/* Characters */}
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <User className="w-4 h-4 text-sky-400" />
                    Characters Catalog ({Object.keys(context.characters_catalog).length})
                  </div>
                  {Object.keys(context.characters_catalog).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No characters registered.</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(context.characters_catalog).map(([name, data]) => (
                        <div key={name} className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-xs">
                          <div className="flex items-center justify-between font-medium text-sky-300">
                            <span>{name}</span>
                            {data.age_range && (
                              <span className="text-[10px] text-zinc-400">Age: {data.age_range}</span>
                            )}
                          </div>
                          {data.appearance && (
                            <p className="text-zinc-300 text-[11px] mt-1">
                              <span className="text-zinc-500">Appearance:</span> {data.appearance}
                            </p>
                          )}
                          {data.clothing && (
                            <p className="text-zinc-300 text-[11px]">
                              <span className="text-zinc-500">Clothing:</span> {data.clothing}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Locations */}
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Locations Catalog ({Object.keys(context.locations_catalog).length})
                  </div>
                  {Object.keys(context.locations_catalog).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No locations registered.</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(context.locations_catalog).map(([name, data]) => (
                        <div key={name} className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-xs">
                          <span className="font-medium text-emerald-300">{name}</span>
                          {data.environment && (
                            <p className="text-zinc-300 text-[11px] mt-1">
                              <span className="text-zinc-500">Environment:</span> {data.environment}
                            </p>
                          )}
                          {data.lighting && (
                            <p className="text-zinc-300 text-[11px]">
                              <span className="text-zinc-500">Lighting:</span> {data.lighting}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Objects */}
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <Package className="w-4 h-4 text-amber-400" />
                    Objects Catalog ({Object.keys(context.objects_catalog).length})
                  </div>
                  {Object.keys(context.objects_catalog).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No objects registered.</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(context.objects_catalog).map(([name, data]) => (
                        <div key={name} className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-xs">
                          <span className="font-medium text-amber-300">{name}</span>
                          {data.description && (
                            <p className="text-zinc-300 text-[11px] mt-1">
                              <span className="text-zinc-500">Description:</span> {data.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reference Images Catalog */}
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                    <span>Reference Images Indexed</span>
                    <span className="text-zinc-500">{context.reference_images_catalog.length} files</span>
                  </div>
                  {context.reference_images_catalog.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No reference images attached yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {context.reference_images_catalog.map((ref) => (
                        <div
                          key={`${ref.entity_type}-${ref.entity_id}`}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800"
                        >
                          <img
                            src={api.getMediaUrl(ref.url)}
                            alt={ref.filename}
                            className="w-10 h-10 rounded object-cover border border-zinc-800"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-zinc-200 truncate">
                              {ref.filename}
                            </p>
                            <p className="text-[10px] text-zinc-500 uppercase">
                              {ref.entity_type} • {ref.entity_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
