
import React from 'react';
import { MAX_STATS } from '../constants';
import { FontSize, Language } from '../types';

interface StatusBarProps {
  health: number;
  hunger: number;
  experience: number;
  fontSize?: FontSize;
  lang?: Language;
}

const StatusBar: React.FC<StatusBarProps> = ({ health, hunger, experience, fontSize = 'medium', lang = 'en' }) => {
  const isCN = lang === 'cn';
  
  // Dynamic scaling for labels based on global font size setting
  const labelScale = fontSize === 'small' ? 'text-[0.65em]' : fontSize === 'large' ? 'text-[0.9em]' : 'text-[0.8em]';

  const SegmentedBar = ({ value, max, colorClass }: { value: number; max: number; colorClass: string }) => {
    return (
      <div className="flex gap-1.5 w-full justify-between">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-5 pixel-border border-black ${i < value ? colorClass : 'bg-[#1a1a1a] opacity-30 shadow-inner'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 bg-[#2a2a4a] pixel-border border-white/20 mb-8 space-y-8 shadow-2xl">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <span className={`pixel-font ${labelScale} text-gray-300 font-black tracking-widest uppercase`}>HEALTH (HP)</span>
          <span className="pixel-font text-[1.1em] text-red-400 font-black">{health}/10</span>
        </div>
        <SegmentedBar value={health} max={MAX_STATS} colorClass="bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <span className={`pixel-font ${labelScale} text-gray-300 font-black tracking-widest uppercase`}>ENERGY (F)</span>
          <span className="pixel-font text-[1.1em] text-orange-400 font-black">{hunger}/10</span>
        </div>
        <SegmentedBar value={hunger} max={MAX_STATS} colorClass="bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.7)]" />
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <span className={`pixel-font ${labelScale} text-gray-300 font-black tracking-widest uppercase`}>EXPERIENCE (XP)</span>
          <span className="pixel-font text-[1.1em] text-green-400 font-black">{experience}/10</span>
        </div>
        <SegmentedBar value={experience} max={MAX_STATS} colorClass="bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.7)]" />
      </div>
    </div>
  );
};

export default StatusBar;
