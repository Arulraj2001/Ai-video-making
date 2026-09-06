import React from "react";
import { FileAudio, BookOpen, Cpu, Sliders, Download, ArrowRight } from "lucide-react";

export const PipelineDiagram: React.FC = () => {
  const steps = [
    {
      num: "01",
      name: "VOICEOVER",
      desc: "Timestamped audio slicing",
      icon: <FileAudio size={16} />,
      accent: "var(--color-primary)",
    },
    {
      num: "02",
      name: "VIDEO BIBLE",
      desc: "Character anchors injected",
      icon: <BookOpen size={16} />,
      accent: "var(--scenora-petrol)",
    },
    {
      num: "03",
      name: "SANA-SPRINT",
      desc: "Sub-second 1-step diffusion",
      icon: <Cpu size={16} />,
      accent: "var(--scenora-rust)",
    },
    {
      num: "04",
      name: "TIMELINE",
      desc: "Multi-track audio sync",
      icon: <Sliders size={16} />,
      accent: "var(--scenora-sage)",
    },
    {
      num: "05",
      name: "EXPORT",
      desc: "1080p FFmpeg master",
      icon: <Download size={16} />,
      accent: "var(--color-primary)",
    },
  ];

  return (
    <div className="w-full py-2">
      {/* Horizontal on desktop, column on mobile */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-2.5">
        {steps.map((st, i) => (
          <React.Fragment key={st.num}>
            <div className="flex-1 w-full md:w-auto p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1.5 text-left transition-all hover:border-[var(--color-border)] hover:-translate-y-0.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] meta-mono font-bold text-[var(--color-primary)] bg-[var(--color-primary-subtle)] px-2 py-0.5 rounded">
                  {st.num}
                </span>
                <span className="text-[var(--color-text-secondary)]">{st.icon}</span>
              </div>
              <div className="text-xs font-bold font-display text-[var(--color-text)] pt-1">
                {st.name}
              </div>
              <div className="text-[11px] text-[var(--color-text-secondary)] leading-snug">
                {st.desc}
              </div>
            </div>

            {i < steps.length - 1 && (
              <div className="hidden md:flex items-center justify-center text-[var(--color-text-muted)] opacity-50 px-0.5">
                <ArrowRight size={14} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
