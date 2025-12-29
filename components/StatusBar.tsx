
import React from 'react';
import { MAX_STATS } from '../constants';
import { FontSize, Language } from '../types';

interface StatusBarProps {
  health: number;
  hunger: number;
  fontSize?: FontSize;
  lang?: Language;
}

const StatusBar: React.FC<StatusBarProps> = ({ health, hunger, fontSize = 'medium', lang = 'en' }) => {
  const isCN = lang === 'cn';
  const iconSize = fontSize === 'large' ? 'text-4xl' : fontSize === 'small' ? 'text-2xl' : 'text-3xl';
  const labelSize = fontSize === 'large' ? (isCN ? 'text-[16px]' : 'text-[14px]') : fontSize === 'small' ? (isCN ? 'text-[12px]' : 'text-[10px]') : (isCN ? 'text-[14px]' : 'text-[12px]');

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < MAX_STATS; i++) {
      hearts.push(
        <span key={i} className={`${iconSize} leading-none transition-all duration-300 ${i < health ? 'animate-pulse scale-110' : 'grayscale opacity-10 scale-90'}`}>
          ❤️
        </span>
      );
    }
    return hearts;
  };

  const renderHunger = () => {
    const legs = [];
    for (let i = 0; i < MAX_STATS; i++) {
      legs.push(
        <span key={i} className={`${iconSize} leading-none transition-all duration-300 ${i < hunger ? 'scale-110' : 'grayscale opacity-10 scale-90'}`}>
          🍗
        </span>
      );
    }
    return legs;
  };

  return (
    <div className="p-6 bg-slate-900/60 backdrop-blur-2xl pixel-border mb-6 space-y-8 shadow-xl">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className={`pixel-font ${labelSize} text-white font-black tracking-widest`}>{isCN ? '生命能量 (HP)' : 'HEALTH (HP)'}</span>
          <div className="h-5 w-48 bg-black/50 pixel-border border-white overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" style={{ width: `${(health / MAX_STATS) * 100}%` }}></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {renderHearts()}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className={`pixel-font ${labelSize} text-white font-black tracking-widest`}>{isCN ? '饱食程度 (F)' : 'ENERGY (F)'}</span>
          <div className="h-5 w-48 bg-black/50 pixel-border border-white overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" style={{ width: `${(hunger / MAX_STATS) * 100}%` }}></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {renderHunger()}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
