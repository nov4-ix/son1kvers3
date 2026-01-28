'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface KnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  color?: string;
  icon?: React.ReactNode;
  tooltip?: string;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  color = 'text-[#B84DFF]',
  icon,
  tooltip
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = (percentage / 100) * 270 - 135;
  const activeColor = color.replace('text-', '');

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFE7]/10 to-[#B84DFF]/10 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
      <div className="relative bg-[#0A0C10]/60 backdrop-blur-md rounded-2xl p-4 border border-[#00FFE7]/10 group-hover:border-[#00FFE7]/30 transition-all">
        <div className="flex items-center gap-2 mb-4">
          {icon && <div className={`${color} drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]`}>{icon}</div>}
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{label}</span>
          <span className="text-xs text-[#00FFE7] font-mono ml-auto">{value}/{max}</span>
        </div>

        <div className="relative w-full h-24 flex items-center justify-center mb-2">
          <div className="relative w-20 h-20">
            {/* Outer Ring (Static) */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1d29" strokeWidth="8" strokeDasharray="210 360" strokeLinecap="round" />
            </svg>

            {/* Value Ring (Dynamic) */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-[225deg]" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={`${(percentage / 100) * 210} 360`}
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(0,255,231,0.5)]"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00FFE7" />
                  <stop offset="100%" stopColor="#B84DFF" />
                </linearGradient>
              </defs>
            </svg>

            {/* Knob Center */}
            <div
              className="absolute top-1/2 left-1/2 w-14 h-14 bg-[#151820] rounded-full transform -translate-x-1/2 -translate-y-1/2 border border-[#333] shadow-inner flex items-center justify-center"
            >
              <div
                className="w-1 h-6 bg-gradient-to-b from-[#00FFE7] to-transparent rounded-full absolute top-1 transform -translate-x-1/2 origin-bottom transition-transform duration-200"
                style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
              />
              <span className="text-xl font-bold text-white font-mono z-10">{value}</span>
            </div>
          </div>
        </div>

        {/* Slider for precise control */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-[#1a1d29] accent-[#00FFE7]"
        />

        {tooltip && (
          <p className="text-[10px] text-gray-500 mt-2 text-center font-mono">{tooltip}</p>
        )}
      </div>
    </div>
  );
};
