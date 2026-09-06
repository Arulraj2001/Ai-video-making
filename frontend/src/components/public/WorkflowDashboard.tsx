import React, { useState } from 'react';
import { Film, Clock, Cpu, DollarSign, ArrowRight, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from '../../router/Router';

interface ProjectProfile {
  id: string;
  name: string;
  genre: string;
  scenes: number;
  duration: string;
  words: number;
  characters: number;
  estTime: string;
  cloudSavings: string;
}

export const WorkflowDashboard: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState<string>('explainer');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(5);

  const profiles: Record<string, ProjectProfile> = {
    explainer: {
      id: 'explainer',
      name: 'Educational Deep-Dive',
      genre: 'Tech / Science Explainer',
      scenes: 36,
      duration: '04:30',
      words: 680,
      characters: 2,
      estTime: '29.5s',
      cloudSavings: '$28.80',
    },
    documentary: {
      id: 'documentary',
      name: 'Historical Documentary',
      genre: 'Longform Narrative',
      scenes: 94,
      duration: '11:45',
      words: 1850,
      characters: 4,
      estTime: '1m 17s',
      cloudSavings: '$75.20',
    },
    cinematic: {
      id: 'cinematic',
      name: 'Sci-Fi Lore Series',
      genre: 'Cinematic Storytelling',
      scenes: 120,
      duration: '15:00',
      words: 2300,
      characters: 5,
      estTime: '1m 38s',
      cloudSavings: '$96.00',
    },
  };

  const current = profiles[selectedProfile];

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimStep(1);
    const interval = setInterval(() => {
      setSimStep((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          setIsSimulating(false);
          return 5;
        }
        return prev + 1;
      });
    }, 600);
  };

  const steps = [
    { num: 1, label: 'Script Ingestion', status: simStep >= 1 ? 'done' : 'pending' },
    { num: 2, label: 'Video Bible Lock', status: simStep >= 2 ? 'done' : 'pending' },
    { num: 3, label: 'SANA-Sprint DiT Batch', status: simStep >= 3 ? 'done' : 'pending' },
    { num: 4, label: 'Timeline & Audio Ducking', status: simStep >= 4 ? 'done' : 'pending' },
    { num: 5, label: '1080p Master Render', status: simStep >= 5 ? 'done' : 'pending' },
  ];

  return (
    <div className="bg-white border border-[#244855]/15 rounded-lg overflow-hidden shadow-xs">
      {/* Simulation Header */}
      <div className="bg-[#182C34] text-white p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#244855]/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-[#8BA4AE] uppercase tracking-wider">
              Interactive Production Estimator
            </span>
          </div>
          <h3 className="text-lg lg:text-xl font-serif font-bold text-white mt-1">
            Simulate Your Video Pipeline Performance
          </h3>
        </div>

        {/* Profile Switcher */}
        <div className="flex items-center gap-2 bg-[#0E171B] p-1.5 rounded-md border border-[#244855]/60 self-start md:self-auto">
          {Object.values(profiles).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProfile(p.id)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                selectedProfile === p.id
                  ? 'bg-[#E64833] text-white font-semibold'
                  : 'text-[#8BA4AE] hover:text-white'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#244855]/10 bg-[#FAF8F5]">
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#244855]/70 mb-1">
            <Film className="w-3.5 h-3.5 text-[#E64833]" />
            <span>SCENE DENSITY</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#182C34]">{current.scenes} Scenes</div>
          <div className="text-[11px] text-[#244855]/70 font-sans mt-0.5">
            Duration: {current.duration} ({current.words} words)
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#244855]/70 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>EST. RENDERING TIME</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#182C34]">{current.estTime}</div>
          <div className="text-[11px] text-emerald-700 font-sans mt-0.5">
            Local RTX 4060 / Apple Silicon
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#244855]/70 mb-1">
            <Cpu className="w-3.5 h-3.5 text-[#244855]" />
            <span>VRAM FOOTPRINT</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#182C34]">3.42 GB</div>
          <div className="text-[11px] text-[#244855]/70 font-sans mt-0.5">
            {current.characters} persistent character seeds
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#244855]/70 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>CLOUD API SAVINGS</span>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-700">{current.cloudSavings}</div>
          <div className="text-[11px] text-[#244855]/70 font-sans mt-0.5">
            Saved per video produced
          </div>
        </div>
      </div>

      {/* Production Pipeline Progress Simulation */}
      <div className="p-6 lg:p-8 bg-white border-t border-[#244855]/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#244855]/10 gap-3">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#244855]/70 font-semibold">
              Automated Pipeline Execution Sequence
            </div>
            <div className="text-xs text-[#244855]/80 font-sans">
              Watch how each phase executes sequentially without human intervention.
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#F8F4ED] hover:bg-[#eae4d8] border border-[#244855]/20 text-[#182C34] text-xs font-mono transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E64833]" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#E64833]" />
                <span>Re-run Pipeline Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* 5-Phase Pipeline Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-6">
          {steps.map((st) => (
            <div
              key={st.num}
              className={`p-3.5 rounded border transition-all ${
                st.status === 'done'
                  ? 'border-[#244855]/30 bg-[#F8F4ED]/60 text-[#182C34]'
                  : 'border-dashed border-gray-200 bg-gray-50/50 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold text-[#E64833]">
                  PHASE 0{st.num}
                </span>
                {st.status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-300" />
                )}
              </div>
              <div className="text-xs font-semibold font-sans">{st.label}</div>
              <div className="text-[10px] text-[#244855]/60 font-mono mt-1">
                {st.status === 'done' ? 'Completed (OK)' : 'Queued'}
              </div>
            </div>
          ))}
        </div>

        {/* Live CTA Footer inside dashboard */}
        <div className="mt-6 pt-6 border-t border-[#244855]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#244855]/80 font-sans">
            Ready to render your next video in under 30 seconds?
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#E64833] hover:bg-[#d03d29] text-white text-xs font-medium font-sans transition-colors shadow-xs"
          >
            <span>Start Producing Video</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
