import React, { useState } from "react";

interface DialControlProps {
  label: string;
  value: number; // e.g. 0 to 100
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange?: (val: number) => void;
  ticks?: number;
  className?: string;
}

export const DialControl: React.FC<DialControlProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  unit = "",
  onChange,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Map value to angle (-135deg to +135deg)
  const percentage = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -135 + percentage * 270;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clickX = e.clientX - centerX;
    const clickY = e.clientY - centerY;

    let deg = Math.atan2(clickY, clickX) * (180 / Math.PI) + 90;
    if (deg < -180) deg += 360;
    if (deg > 180) deg -= 360;

    // Clamp within -135 to 135
    const clampedDeg = Math.min(135, Math.max(-135, deg));
    const newPct = (clampedDeg + 135) / 270;
    const newVal = Math.round(min + newPct * (max - min));
    onChange(newVal);
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Outer Raised Bezel */}
      <div
        className="relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200"
        style={{
          background: "var(--neu-bg)",
          boxShadow: isHovered
            ? "7px 7px 18px var(--neu-shadow-dark), -7px -7px 18px var(--neu-shadow-light)"
            : "5px 5px 14px var(--neu-shadow-dark), -5px -5px 14px var(--neu-shadow-light)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
      >
        {/* Graduated Circular Tick Marks */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--neu-border-subtle)"
            strokeWidth="1.5"
            strokeDasharray="2 6"
          />
          {/* Active arc indicator */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--neu-accent)"
            strokeWidth="2.5"
            strokeDasharray="198"
            strokeDashoffset={198 - percentage * 148}
            transform="rotate(135 50 50)"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>

        {/* Inner Touchable Dial Knob */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-100 relative"
          style={{
            background: "var(--neu-bg)",
            boxShadow:
              "inset 2px 2px 5px var(--neu-shadow-light), inset -2px -2px 5px var(--neu-shadow-dark), 3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Dial Notch Indicator */}
          <div
            className="absolute top-2 w-1.5 h-3 rounded-full"
            style={{
              backgroundColor: "var(--neu-accent)",
              boxShadow: "0 0 6px rgba(235, 87, 87, 0.6)",
            }}
          />

          {/* Central Grip Ring */}
          <div
            className="w-8 h-8 rounded-full border border-[var(--neu-border-subtle)] opacity-60"
            style={{
              boxShadow: "inset 1px 1px 3px var(--neu-shadow-dark)",
            }}
          />
        </div>
      </div>

      {/* Monospace Digital Telemetry Readout */}
      <div className="mt-2.5 text-center">
        <div className="meta-mono text-xs font-bold text-[var(--neu-text)] flex items-center justify-center gap-0.5">
          <span>{value}</span>
          <span className="text-[var(--neu-accent)]">{unit}</span>
        </div>
        <span className="text-[11px] font-sans font-medium text-[var(--neu-text-muted)] tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
};
