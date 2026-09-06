import React from 'react';
import { Check, X, Clock, Layers, DollarSign, Users, Cpu, ArrowRight } from 'lucide-react';
import { Link } from '../../router/Router';

export const ComparisonSection: React.FC = () => {
  const comparisonRows = [
    {
      metric: 'Character & Subject Consistency',
      icon: <Users className="w-4 h-4" />,
      fragmented: {
        title: 'Severe Face Drift Across Scenes',
        detail: 'Characters morph facial structures, clothing colors, and age between adjacent clips. Manual inpainting required.',
        status: 'fail',
      },
      scenora: {
        title: 'Video Bible Seed Lock (100% Consistent)',
        detail: 'Deterministic multi-attribute character registry locks facial geometry, color palette, and wardrobe across all 100+ scenes.',
        status: 'pass',
      },
    },
    {
      metric: 'Production Pipeline & Toolchain',
      icon: <Layers className="w-4 h-4" />,
      fragmented: {
        title: '5 to 7 Disconnected Web Apps',
        detail: 'Juggling Midjourney Discord tabs, ElevenLabs web portals, Premiere Pro timelines, and third-party subtitle generators.',
        status: 'fail',
      },
      scenora: {
        title: 'Unified Local Studio Architecture',
        detail: 'End-to-end pipeline: Audio generation → Video Bible → SANA-Sprint DiT → Multi-track Timeline → 1080p FFMPEG Master.',
        status: 'pass',
      },
    },
    {
      metric: 'Generation Turnaround & Latency',
      icon: <Clock className="w-4 h-4" />,
      fragmented: {
        title: '18 – 36 Hours per Video',
        detail: 'Hours wasted prompting repeatedly to get usable frames, export/import rounds, and manual audio alignment.',
        status: 'fail',
      },
      scenora: {
        title: '< 30 Minutes Automated Render',
        detail: '4-step distilled SANA-Sprint generates 100+ scenes at 0.82s/frame with automated word-level subtitle alignment.',
        status: 'pass',
      },
    },
    {
      metric: 'Operating & Infrastructure Cost',
      icon: <DollarSign className="w-4 h-4" />,
      fragmented: {
        title: '$150 – $400 / month in Subscriptions',
        detail: 'Recurring cloud credit burn per generation, paywalls for fast GPU queues, and expensive export licenses.',
        status: 'fail',
      },
      scenora: {
        title: '$0 Cloud API Fees (Local Execution)',
        detail: 'Runs directly on your local GPU (RTX 4060, Apple Silicon M-series) with zero cloud meter ticks.',
        status: 'pass',
      },
    },
    {
      metric: 'Hardware & Data Privacy',
      icon: <Cpu className="w-4 h-4" />,
      fragmented: {
        title: 'Public Cloud Storage & Telemetry',
        detail: 'Your scripts, concepts, and voice recordings are sent to third-party cloud servers for processing and logging.',
        status: 'fail',
      },
      scenora: {
        title: '100% Air-Gapped Local Workstation',
        detail: 'Everything runs on localhost. Zero sensitive assets or creative drafts leave your device without explicit consent.',
        status: 'pass',
      },
    },
  ];

  return (
    <div className="bg-white border border-[#244855]/15 rounded-lg overflow-hidden shadow-xs">
      {/* Editorial Comparison Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#244855]/15">
        <div className="p-6 lg:p-8 bg-[#F8F4ED]/40 border-b lg:border-b-0 lg:border-r border-[#244855]/15">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-red-100 text-red-800 text-xs font-mono font-medium mb-3">
            <X className="w-3.5 h-3.5" />
            FRAGMENTED MANUAL STACK
          </div>
          <h3 className="text-xl lg:text-2xl font-serif font-bold text-[#182C34] tracking-tight">
            How creators struggle today
          </h3>
          <p className="text-xs text-[#244855]/80 mt-1.5 font-sans leading-relaxed">
            Copy-pasting between disconnected cloud apps with constant character drift and escalating subscription invoices.
          </p>
        </div>

        <div className="p-6 lg:p-8 bg-[#182C34] text-white">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#E64833] text-white text-xs font-mono font-medium mb-3">
            <Check className="w-3.5 h-3.5" />
            THE SCENORAEDITS STUDIO STANDARD
          </div>
          <h3 className="text-xl lg:text-2xl font-serif font-bold text-white tracking-tight">
            The automated neural pipeline
          </h3>
          <p className="text-xs text-[#8BA4AE] mt-1.5 font-sans leading-relaxed">
            Deterministic consistency, local GPU inference speeds, and unified timeline mastering in one seamless workflow.
          </p>
        </div>
      </div>

      {/* Comparison Rows */}
      <div className="divide-y divide-[#244855]/10">
        {comparisonRows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Fragmented */}
            <div className="p-5 lg:p-6 bg-[#FAF8F5]/50 border-b lg:border-b-0 lg:border-r border-[#244855]/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#244855]/60 mb-2">
                  {row.icon}
                  <span className="uppercase tracking-wider font-semibold">{row.metric}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#182C34]">{row.fragmented.title}</h4>
                    <p className="text-xs text-[#244855]/75 mt-1 font-sans leading-relaxed">
                      {row.fragmented.detail}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: ScenoraEdits */}
            <div className="p-5 lg:p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#E64833] mb-2">
                  {row.icon}
                  <span className="uppercase tracking-wider font-semibold">{row.metric}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#182C34]">{row.scenora.title}</h4>
                    <p className="text-xs text-[#244855]/75 mt-1 font-sans leading-relaxed">
                      {row.scenora.detail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Summary Banner */}
      <div className="bg-[#F8F4ED] p-5 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#244855]/15">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#182C34] text-white flex items-center justify-center font-mono font-bold text-xs">
            30m
          </div>
          <div>
            <div className="text-xs font-bold text-[#182C34] uppercase font-mono">
              Net Efficiency Multiplier
            </div>
            <div className="text-xs text-[#244855]/70">
              Produce 10x more high-retention video content without expanding your team or budget.
            </div>
          </div>
        </div>

        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#182C34] hover:bg-[#244855] text-white text-xs font-medium font-sans transition-colors shrink-0"
        >
          <span>Experience the Pipeline</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#E64833]" />
        </Link>
      </div>
    </div>
  );
};
