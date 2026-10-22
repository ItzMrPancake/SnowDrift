import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { LevelConfig } from '../types/game';

interface LoadingScreenProps {
  level: LevelConfig;
  onFinish?: () => void;
  durationMs?: number;
}

const COZY_TIPS = [
  'Plowing down snowmen drops +25 bonus coins and carrot puffs!',
  'Press "R" or tap the Reset button anytime to instantly return to the center of town.',
  'Keep roads clear in all 4 districts to raise overall Town Reputation and earn bonus payouts.',
  'Upgrade your Plow Blade Width in the Garage to clear entire two-lane roads in a single pass!',
  'Blizzards bring heavy snow squalls—clear emergency lanes near the clinic first.',
  'Nitro Boost recharges automatically. Save it for high-combo straightaways!',
  'Town buildings and chalets are solid structures—steer through cozy driveways and intersections.',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  level,
  onFinish,
  durationMs = 900,
}) => {
  const [progress, setProgress] = useState(15);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * COZY_TIPS.length));
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.round(15 + (elapsed / durationMs) * 85));
      setProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        const timeout = setTimeout(() => {
          onFinish?.();
        }, 250);
        return () => clearTimeout(timeout);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs, onFinish]);

  // Rotate tip every few seconds if loading lingers
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % COZY_TIPS.length);
    }, 2800);
    return () => clearInterval(tipTimer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070d18] text-white select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* Background ambient snowflakes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute top-1/4 left-1/5 text-4xl animate-pulse">❄</div>
        <div className="absolute top-3/5 right-1/4 text-5xl animate-bounce">❅</div>
        <div className="absolute bottom-1/4 left-1/3 text-3xl animate-pulse">❄</div>
        <div className="absolute top-1/3 right-1/6 text-2xl animate-spin-slow">✻</div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* Animated Snowplow Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#121f35] to-[#1e3458] border border-cyan-500/40 flex items-center justify-center shadow-xl shadow-cyan-950/60 animate-bounce">
            <span className="text-4xl select-none">🚜</span>
          </div>
          {/* Glowing snow puff behind */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-cyan-400/20 blur-md animate-ping" />
        </div>

        {/* Level Title & Subtitle */}
        <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold tracking-widest uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>Clearing Town Roads</span>
        </div>
        <h2 className="text-2xl font-black tracking-wide text-white mb-1">
          {level.name}
        </h2>
        <p className="text-xs text-slate-400 mb-8 max-w-xs">{level.subtitle}</p>

        {/* Progress Bar */}
        <div className="w-full bg-[#131d2e] border border-cyan-500/30 rounded-full h-3 p-0.5 overflow-hidden shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-300 rounded-full transition-all duration-75 shadow-lg shadow-cyan-400/50"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Details */}
        <div className="flex justify-between items-center w-full text-[11px] font-mono text-slate-400 mb-6 px-1">
          <span>Warming up snowplow blades...</span>
          <span className="text-cyan-300 font-bold">{progress}%</span>
        </div>

        {/* Cozy Tip Card */}
        <div className="w-full bg-[#0d1624]/90 border border-slate-700/60 rounded-xl p-3.5 shadow-lg text-left">
          <div className="text-[10px] font-bold text-amber-400 tracking-wider uppercase mb-1 flex items-center gap-1.5">
            <span>❄ Driver Tip</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {COZY_TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};
