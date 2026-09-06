import React, { useState } from "react";
import { useRouter } from "../../router/Router";
import { useSEO, PAGE_SEO } from "../../utils/seo";
import { Button } from "../../components/ui/Button";
import { SiteContainer } from "../../components/public/SiteContainer";
import { SectionHeader } from "../../components/public/SectionHeader";
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  ArrowRight,
  GitBranch,
  Check,
  Code2,
} from "lucide-react";

export const FeaturesPage: React.FC = () => {
  const { navigate } = useRouter();
  useSEO(PAGE_SEO.features);
  const [activeModule, setActiveModule] = useState<number>(0);

  const modules = [
    {
      id: "bible",
      title: "Video Bible & Entity Persistence Engine",
      tag: "CORE ARCHITECTURE",
      summary:
        "Anchors characters, locations, wardrobes, and branded objects into a unified JSON registry. Every scene prompt automatically injects persistent visual descriptors to prevent the style and facial drift common in multi-scene generative AI.",
      highlights: [
        "Dynamic character descriptor injection per scene segment",
        "Recurring object, vehicle, and prop consistency anchors",
        "Visual style and aesthetic lock maintained across 60+ consecutive scenes",
        "Structured entity registry reusable across multiple video series",
      ],
      techSpecs: "JSON schema validation • Token weighting • Weighted prompt injector",
    },
    {
      id: "storyboard",
      title: "3-Branch Neural Storyboarding & Variants",
      tag: "CREATIVE DIRECTION",
      summary:
        "Generate 3 parallel artistic branches (Cinematic Wide, Macro Close-up, Technical Cutaway) per scene. Creators can iterate on negative prompts, compare variants side-by-side, and switch styles mid-project without losing audio sync.",
      highlights: [
        "1-click regeneration with custom positive and negative prompt overrides",
        "Side-by-side A/B/C branch comparison with instant active cut assignment",
        "Batch generation for all pending scene slots in a single automated pass",
        "Style presets: Cinematic, Anime, 3D Render, Watercolor, and Storyboard Sketch",
      ],
      techSpecs: "Sub-second branch generation • Non-destructive variant history",
    },
    {
      id: "timeline",
      title: "Multi-Track Audio-Synced Timeline Editor",
      tag: "PRECISION EDITING",
      summary:
        "A frame-accurate non-linear editor built directly around voiceover timestamps. Three independent tracks—Visual clips, Speech narration, and Ambient BGM—with real-time playhead scrubbing and full Cinema Preview.",
      highlights: [
        "Three synchronized tracks: Visual clips, Voiceover speech, and Ambient music",
        "Real-time playhead scrub with millisecond waveform alignment",
        "Cinema Preview mode with high-retention burned-in subtitle overlay",
        "Non-destructive clip trimming and keyboard editing shortcuts",
      ],
      techSpecs: "Audio waveform canvas rendering • Dynamic audio ducking filter",
    },
    {
      id: "inference",
      title: "Dual Local RTX GPU & Cloud Failover Inference",
      tag: "HYBRID COMPUTE",
      summary:
        "Run SANA-Sprint 1.6B directly on consumer RTX hardware with 4GB VRAM at sub-second speeds with zero API cost. For cloud creators, automatic failover routes between Cloudflare Workers AI and Pollinations.ai.",
      highlights: [
        "Offline local GPU generation via HuggingFace Diffusers (RTX 3060/4060 ready)",
        "Zero-cost unlimited generation on local hardware",
        "Cloudflare Workers AI cloud inference (~25 high-quality calls/day free)",
        "Zero-setup Pollinations.ai backup provider with automatic failover",
      ],
      techSpecs: "PyTorch 2.0 • CUDA 12 acceleration • Int8 quantization support",
    },
    {
      id: "export",
      title: "Hardware-Accelerated 1080p FFmpeg Rendering",
      tag: "OUTPUT PIPELINE",
      summary:
        "FFmpeg backend coordinates visual clips, synced narration, ducked background music, and burned-in styled subtitles to produce broadcast-quality 1080p MP4 exports across 16:9, 9:16, and 1:1 aspect ratios.",
      highlights: [
        "1920×1080 Full HD output with high-profile H.264 video encoding",
        "Multi-aspect exports: 16:9 YouTube, 9:16 Shorts/TikTok, and 1:1 Instagram",
        "Burned-in styled subtitles with custom font sizing and outline contrast",
        "Frame-accurate audio ducking for crisp voiceover clarity over music",
      ],
      techSpecs: "NVENC hardware acceleration • Multi-stream FFmpeg filtergraph",
    },
    {
      id: "quota",
      title: "Real-Time Quota Intelligence & Guard",
      tag: "RELIABILITY",
      summary:
        "Monitors Cloudflare and third-party rate limits in real time. Automatically switches unrendered scenes to local GPU or fallback cloud endpoints before quota throttles can interrupt your production deadline.",
      highlights: [
        "Live Cloudflare daily quota gauge in studio topbar",
        "Preemptive automatic provider failover before throttles occur",
        "Seamless retry queue for intermittent network drops",
        "Per-scene provider overrides without restarting projects",
      ],
      techSpecs: "Automated exponential backoff • Multi-provider health check",
    },
  ];

  const benchmarks = [
    {
      backend: "SANA-Sprint 1.6B (Local)",
      type: "Local RTX GPU",
      speed: "0.8–1.5s / frame",
      vram: "4GB VRAM (RTX 3060+)",
      cost: "$0.00 (Unlimited)",
      offline: "100% Offline",
      recommended: "Primary Creator Choice",
    },
    {
      backend: "Cloudflare Workers AI",
      type: "Hosted Cloud GPU",
      speed: "2.2–3.5s / frame",
      vram: "0MB (Cloud Serverless)",
      cost: "Free (~25/day)",
      offline: "Requires Internet",
      recommended: "Laptops & Thin Clients",
    },
    {
      backend: "Pollinations.ai",
      type: "Community Cloud",
      speed: "3.0–5.0s / frame",
      vram: "0MB (Cloud Hosted)",
      cost: "$0.00 (Free Tier)",
      offline: "Requires Internet",
      recommended: "Zero-Config Fallback",
    },
  ];

  const roadmap = [
    { phase: "Phase 12", title: "Video Bible & SANA-Sprint Local GPU", status: "Active Now", done: true },
    { phase: "Phase 13", title: "Stripe Billing & Cloud LoRA Style Blending", status: "In Development", done: false },
    { phase: "Phase 13", title: "Direct 1-Click YouTube & TikTok Publishing API", status: "Planned", done: false },
    { phase: "Phase 14", title: "Multi-User Collaborative Video Bibles", status: "Upcoming", done: false },
    { phase: "Phase 14", title: "WebSocket Real-Time Generation Progress Stream", status: "Upcoming", done: false },
  ];

  return (
    <div className="space-y-0">
      {/* ─── HERO HEADER ─────────────────────────────────────────────────────────── */}
      <section className="site-section-compact border-b border-[var(--color-border-subtle)]">
        <SiteContainer>
          <SectionHeader
            align="left"
            eyebrow="Engine Architecture"
            eyebrowIcon={<Sparkles size={12} />}
            title="The Complete AI Video Pipeline"
            description="Engineered to eliminate AI character drift, timeline de-sync, and high cloud compute bills. Here is every subsystem powering ScenoraEdits."
            action={
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight size={14} />}
                onClick={() => navigate("/app")}
                className="font-bold shadow-sm"
              >
                Launch Studio
              </Button>
            }
          />
        </SiteContainer>
      </section>

      {/* ─── INTERACTIVE MODULE EXPLORER ────────────────────────────────────────── */}
      <section className="site-section bg-[var(--color-surface)]">
        <SiteContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Module Switcher */}
            <div className="lg:col-span-5 space-y-1.5">
              <span className="text-[11px] meta-mono uppercase text-[var(--color-text-muted)] font-bold block mb-2">
                PRODUCTION MODULES
              </span>
              {modules.map((m, idx) => {
                const isActive = activeModule === idx;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(idx)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                      isActive
                        ? "bg-[var(--color-background)] border-[var(--color-primary)] shadow-sm"
                        : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] meta-mono text-[var(--color-text-muted)] font-bold mb-0.5">
                      <span>MODULE 0{idx + 1}</span>
                      <span className={isActive ? "text-[var(--color-primary)]" : ""}>{m.tag}</span>
                    </div>
                    <div className={`text-xs sm:text-sm font-bold truncate ${isActive ? "text-[var(--color-text)]" : ""}`}>
                      {m.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Active Specification Card */}
            <div className="lg:col-span-7 card-feature p-7 sm:p-9 space-y-5">
              <div className="space-y-2">
                <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
                  {modules[activeModule].tag} // SPECIFICATION
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-[var(--color-text)]">
                  {modules[activeModule].title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {modules[activeModule].summary}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <h4 className="text-[11px] meta-mono uppercase text-[var(--color-text-muted)] font-bold">
                  Key Capabilities
                </h4>
                <div className="space-y-2">
                  {modules[activeModule].highlights.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2 text-xs text-[var(--color-text)]">
                      <CheckCircle2 size={14} className="text-[var(--color-success)] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs meta-mono">
                <span className="text-[var(--color-text-muted)]">Engine Stack:</span>
                <span className="text-[var(--color-text)] font-semibold">{modules[activeModule].techSpecs}</span>
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── PROMPT INJECTION VISUALIZER ────────────────────────────────────────── */}
      <section className="site-section border-y border-[var(--color-border-subtle)]">
        <SiteContainer>
          <SectionHeader
            eyebrow="Prompt Augmentation"
            eyebrowIcon={<Code2 size={12} />}
            title="How the Prompt Engine Injects Anchors"
            description="Raw script text is automatically augmented with Video Bible descriptors before diffusion:"
            className="mb-10"
          />

          <div className="card-feature p-6 sm:p-8 space-y-5 meta-mono text-xs max-w-4xl mx-auto">
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">
                1. RAW NARRATION SCRIPT SEGMENT
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] leading-relaxed font-sans text-xs">
                "Dr. Vance enters the hydrothermal basalt chasm to retrieve core specimen seven."
              </div>
            </div>

            <div className="flex justify-center text-[var(--color-primary)]">
              <span className="text-xs font-bold meta-mono">↓ INJECTING VIDEO BIBLE DESCRIPTOR ANCHORS ↓</span>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--color-success)] mb-1">
                2. AUGMENTED DIFFUSION PROMPT
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text)] leading-relaxed space-y-2 font-sans text-xs">
                <p>
                  <strong className="text-[var(--color-primary)] font-mono">[CHARACTER: Dr. Elena Vance]</strong>{" "}
                  marine astrobiologist mid-30s, copper short hair, matte obsidian hazmat exosuit with amber telemetry visor HUD,{" "}
                  <strong className="text-[var(--color-secondary)] font-mono">[LOCATION: Europa Abyssal Chasm]</strong>{" "}
                  10km beneath ice shelf, basalt rock vents emitting cyan bioluminescent smoke plumes,{" "}
                  <strong className="text-[var(--scenora-rust)] font-mono">[PROPS: Titan-IV Specimen Arm]</strong>{" "}
                  holding titanium cylindrical extraction canister, cinematic 50mm anamorphic lighting.
                </p>
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── HARDWARE & ENGINE BENCHMARK MATRIX ─────────────────────────────────── */}
      <section className="site-section bg-[var(--color-surface)]">
        <SiteContainer>
          <SectionHeader
            eyebrow="Performance Matrix"
            eyebrowIcon={<Cpu size={12} />}
            title="Inference Engine Comparison"
            description="Choose the compute backend that fits your hardware setup:"
            className="mb-10"
          />

          <div className="card-feature overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs meta-mono">
                <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 font-bold">Inference Engine</th>
                    <th className="p-3.5 font-bold">Speed / Frame</th>
                    <th className="p-3.5 font-bold">Hardware / VRAM</th>
                    <th className="p-3.5 font-bold">Cost</th>
                    <th className="p-3.5 font-bold">Offline?</th>
                    <th className="p-3.5 font-bold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {benchmarks.map((b, i) => (
                    <tr key={i} className="hover:bg-[var(--color-surface-sunken)]/40 transition-colors">
                      <td className="p-3.5 font-bold text-[var(--color-text)] font-sans">
                        {b.backend}
                        <span className="block text-[10px] text-[var(--color-text-muted)] meta-mono">{b.type}</span>
                      </td>
                      <td className="p-3.5 text-[var(--color-success)] font-bold">{b.speed}</td>
                      <td className="p-3.5 text-[var(--color-text-secondary)]">{b.vram}</td>
                      <td className="p-3.5 text-[var(--color-primary)] font-bold">{b.cost}</td>
                      <td className="p-3.5 text-[var(--color-text)]">{b.offline}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                          {b.recommended}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ─── ENGINEERING ROADMAP ────────────────────────────────────────────────── */}
      <section className="site-section border-t border-[var(--color-border-subtle)] pb-24">
        <SiteContainer>
          <SectionHeader
            eyebrow="Milestones"
            eyebrowIcon={<GitBranch size={12} />}
            title="Engineering Roadmap"
            description="ScenoraEdits evolves across structured production phases:"
            className="mb-10"
          />

          <div className="space-y-2.5 max-w-3xl mx-auto">
            {roadmap.map((r, i) => (
              <div
                key={i}
                className="card-content p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      r.done
                        ? "bg-[var(--color-success)] text-white"
                        : "bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] font-bold"
                    }`}
                  >
                    {r.done ? <Check size={13} /> : i + 1}
                  </div>
                  <div>
                    <div className="text-[10px] meta-mono text-[var(--color-text-muted)] font-bold">{r.phase}</div>
                    <div className="text-xs sm:text-sm font-bold text-[var(--color-text)] font-sans">{r.title}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] meta-mono font-bold px-2.5 py-0.5 rounded-full ${
                    r.done
                      ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                      : "bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>
    </div>
  );
};
