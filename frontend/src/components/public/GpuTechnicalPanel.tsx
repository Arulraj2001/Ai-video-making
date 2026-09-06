import React, { useState } from 'react';
import { Cpu, Zap, Activity, HardDrive, ShieldCheck, Terminal, Layers } from 'lucide-react';

interface MetricItem {
  label: string;
  value: string;
  subtext: string;
  change?: string;
  status: 'optimal' | 'active' | 'ready';
}

export const GpuTechnicalPanel: React.FC = () => {
  const [activeEngine, setActiveEngine] = useState<'sana' | 'sdxl' | 'tensorrt'>('sana');

  const engineSpecs = {
    sana: {
      name: 'SANA-Sprint 1.6B DiT',
      speed: '0.82s',
      speedUnit: '/ frame (1024×1024)',
      vram: '3.42 GB',
      vramMax: '4.00 GB',
      vramPercent: 85,
      quant: 'INT8 Dynamic',
      fps: '1.22 it/s',
      cost: '$0.00',
      cloudComparison: '$0.04 - $0.08 / gen on cloud APIs',
    },
    sdxl: {
      name: 'SDXL Turbo Lightning',
      speed: '1.45s',
      speedUnit: '/ frame (1024×1024)',
      vram: '5.80 GB',
      vramMax: '8.00 GB',
      vramPercent: 72,
      quant: 'FP16',
      fps: '0.69 it/s',
      cost: '$0.00',
      cloudComparison: '$0.06 / gen on cloud APIs',
    },
    tensorrt: {
      name: 'TensorRT Acceleration',
      speed: '0.54s',
      speedUnit: '/ frame (1024×1024)',
      vram: '3.10 GB',
      vramMax: '4.00 GB',
      vramPercent: 77,
      quant: 'INT8 Engine',
      fps: '1.85 it/s',
      cost: '$0.00',
      cloudComparison: '$0.12 / gen cloud enterprise',
    },
  };

  const current = engineSpecs[activeEngine];

  const telemetryMetrics: MetricItem[] = [
    {
      label: 'Frame Latency',
      value: current.speed,
      subtext: current.speedUnit,
      change: '4.2x vs standard DiT',
      status: 'optimal',
    },
    {
      label: 'Active VRAM Footprint',
      value: current.vram,
      subtext: `Budget: ${current.vramMax} peak`,
      change: 'Runs on RTX 4060 & M1/M2/M3',
      status: 'optimal',
    },
    {
      label: 'Batch Throughput',
      value: current.fps,
      subtext: '4-step distilled sampling',
      change: 'Zero queuing latency',
      status: 'active',
    },
    {
      label: 'Inference Cost',
      value: current.cost,
      subtext: 'Unlimited local execution',
      change: current.cloudComparison,
      status: 'optimal',
    },
  ];

  return (
    <div className="panel-dark-technical p-6 sm:p-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-[#E64833]/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-10 w-72 h-40 bg-[#244855]/20 blur-3xl pointer-events-none rounded-full" />

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#244855]/60 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#244855]/60 border border-[#244855] flex items-center justify-center text-[#E64833]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-serif text-lg font-semibold tracking-tight">
                Local Hardware Telemetry & Acceleration Engine
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#1b323c] text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-xs text-[#8BA4AE] mt-0.5 font-sans">
              Real-time benchmarks running directly on local consumer hardware without third-party API rate limits.
            </p>
          </div>
        </div>

        {/* Engine switcher tabs */}
        <div className="flex items-center gap-1.5 bg-[#091014] p-1 rounded-md border border-[#244855]/70 self-start md:self-auto">
          {(['sana', 'sdxl', 'tensorrt'] as const).map((eng) => (
            <button
              key={eng}
              onClick={() => setActiveEngine(eng)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                activeEngine === eng
                  ? 'bg-[#244855] text-white font-medium shadow-sm'
                  : 'text-[#8BA4AE] hover:text-white'
              }`}
            >
              {eng === 'sana' ? 'SANA-Sprint (1.6B)' : eng === 'sdxl' ? 'SDXL Lightning' : 'TensorRT Engine'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
        {telemetryMetrics.map((metric, i) => (
          <div
            key={i}
            className="p-4 rounded-md bg-[#0D161A] border border-[#244855]/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[#8BA4AE] font-mono mb-1.5">
                <span>{metric.label}</span>
                {metric.status === 'optimal' ? (
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-[#E64833]" />
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight">
                  {metric.value}
                </span>
                <span className="text-[11px] text-[#8BA4AE] font-mono">{metric.subtext}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#244855]/40 text-[11px] font-sans text-emerald-400/90 flex items-center gap-1.5">
              <span className="text-xs">↑</span>
              <span>{metric.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Technical Specifications & Memory Breakdown */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-[#244855]/60">
        {/* Left: VRAM Allocation Breakdown */}
        <div className="lg:col-span-7 bg-[#0D161A] p-4 rounded-md border border-[#244855]/50">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-white flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-[#E64833]" />
              VRAM Allocation Breakdown ({current.name})
            </span>
            <span className="text-[#8BA4AE]">{current.vram} / {current.vramMax} ({current.vramPercent}%)</span>
          </div>

          {/* VRAM bar */}
          <div className="w-full h-3 bg-[#091014] rounded overflow-hidden flex border border-[#244855]/60">
            <div
              style={{ width: `${current.vramPercent * 0.65}%` }}
              className="h-full bg-[#E64833] relative group"
              title="Weights & KV Cache"
            />
            <div
              style={{ width: `${current.vramPercent * 0.25}%` }}
              className="h-full bg-amber-500/80"
              title="Latent Buffer"
            />
            <div
              style={{ width: `${current.vramPercent * 0.10}%` }}
              className="h-full bg-emerald-500/80"
              title="CUDA Overhead"
            />
            <div className="flex-1 bg-transparent" />
          </div>

          <div className="flex items-center gap-4 mt-3 text-[11px] font-mono text-[#8BA4AE]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E64833]" />
              DiT Weights (65%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500/80" />
              Latents & Attention (25%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              Overhead (10%)
            </span>
            <span className="ml-auto text-emerald-400 font-sans">Fits in 4GB VRAM</span>
          </div>
        </div>

        {/* Right: Technical Badges & Runtime Guarantees */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#0D161A] rounded-md border border-[#244855]/50 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium font-sans">100% Private & Air-Gapped</div>
                <div className="text-[11px] text-[#8BA4AE] mt-0.5">Zero script or prompt data leaves your workstation.</div>
              </div>
            </div>

            <div className="p-3 bg-[#0D161A] rounded-md border border-[#244855]/50 flex items-start gap-2.5">
              <Terminal className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium font-sans">Quantization Engine</div>
                <div className="text-[11px] text-[#8BA4AE] mt-0.5">{current.quant} precision with zero artifact degradation.</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#8BA4AE] px-2 font-mono">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#E64833]" />
              Pipelines: PyTorch 2.4 / ONNX Runtime / TensorRT 10.x
            </span>
            <span className="text-white font-medium">Batch Scale: 100+ Scenes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
