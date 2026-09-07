import React from "react";
import { Sliders, Clock, Mic, Image, Info } from "lucide-react";

export const TimelinePlaceholder: React.FC = () => {
  return (
    <div className="glass-panel p-6 border-dashed border-indigo-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sliders size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-display" style={{ color: "var(--text-primary)" }}>
                Master Timeline Area
              </h3>
              <span className="badge badge-info">Future Timeline (Phase 4)</span>
            </div>
            <p className="text-xs text-slate-400">
              Captions will serve as the Master Timeline locking narration to visual scene duration
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <Clock size={13} className="text-indigo-400" />
          <span>00:00.00 / 00:00.00</span>
        </div>
      </div>

      {/* Futuristic Timeline Mock Tracks */}
      <div className="rounded-xl bg-[#06090e] border border-white/5 p-4 space-y-3">
        {/* Time ruler */}
        <div className="h-6 border-b border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500 px-2 select-none">
          <span>00:00</span>
          <span>00:15</span>
          <span>00:30</span>
          <span>00:45</span>
          <span>01:00</span>
          <span>01:15</span>
          <span>01:30</span>
        </div>

        {/* Visual Scene Track Placeholder */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="w-24 text-xs font-semibold text-slate-400 flex items-center gap-1.5 flex-shrink-0">
            <Image size={13} className="text-purple-400" />
            <span>Scene Video</span>
          </div>
          <div className="flex-1 grid grid-cols-4 gap-2">
            <div className="h-10 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-300 font-medium">
              Scene 1 (Scheduled Phase 4)
            </div>
            <div className="h-10 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-300 font-medium">
              Scene 2 (Scheduled Phase 4)
            </div>
            <div className="h-10 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-300 font-medium">
              Scene 3 (Scheduled Phase 4)
            </div>
            <div className="h-10 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-300 font-medium">
              Scene 4 (Scheduled Phase 4)
            </div>
          </div>
        </div>

        {/* Audio Track Placeholder */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="w-24 text-xs font-semibold text-slate-400 flex items-center gap-1.5 flex-shrink-0">
            <Mic size={13} className="text-cyan-400" />
            <span>Voice Track</span>
          </div>
          <div className="flex-1 h-10 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between px-3 text-[10px] text-cyan-300">
            <span>Narration Audio & Timestamped Captions Track</span>
            <span className="font-mono text-slate-400">Master Synchronizer</span>
          </div>
        </div>
      </div>

      {/* Architectural note */}
      <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-2 text-xs text-slate-400">
        <Info size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Phase 1 Architecture Note:</strong> As per design specifications, the active Master Timeline, caption syncing, and Ken Burns camera motion will be implemented in Phase 4 once the Video Bible (Phase 2) and Image Engine (Phase 3) foundations are ready.
        </div>
      </div>
    </div>
  );
};
