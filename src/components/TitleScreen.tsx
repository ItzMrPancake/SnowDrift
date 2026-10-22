import React, { useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Trophy, Wrench, Play } from 'lucide-react';
import { synthAudio } from '../audio/synthAudio';
import { LevelConfig, VehicleSkin } from '../types/game';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenGarage: () => void;
  onOpenHomeMenu?: () => void;
  onSelectLevel: (lvl: LevelConfig) => void;
  levels: LevelConfig[];
  currentLevel: LevelConfig;
  currentSkin: VehicleSkin;
  coins: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenGarage,
  onOpenHomeMenu,
  onSelectLevel,
  levels,
  currentLevel,
  coins,
}) => {
  const [muted, setMuted] = React.useState(synthAudio.getMuted());

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        synthAudio.ensureAudio();
        onStartGame();
      } else if (e.code === 'KeyM') {
        const isM = synthAudio.toggleMute();
        setMuted(isM);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartGame]);

  const toggleSound = () => {
    synthAudio.ensureAudio();
    const isM = synthAudio.toggleMute();
    setMuted(isM);
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-6 md:p-10 select-none z-20">
      {/* Top Bar Status */}
      <div className="flex justify-between items-center w-full">
        {/* Winter Snow Badge */}
        <div className="pointer-events-auto flex items-center gap-3 bg-[#131b26]/90 border border-cyan-500/30 rounded-xl px-4 py-2 text-cyan-100 shadow-lg">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span className="text-xs font-semibold tracking-wider uppercase text-cyan-300">Winter Season</span>
          <span className="text-xs text-cyan-200/60">·</span>
          <span className="text-xs font-medium text-cyan-200">60 FPS Synth Physics</span>
        </div>

        {/* Audio & Garage Buttons */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#131b26]/90 border border-amber-500/30 rounded-xl px-3.5 py-1.5 text-amber-200 shadow-md">
            <span className="text-amber-400 font-bold text-sm">❄</span>
            <span className="text-sm font-bold tabular-nums">{coins}</span>
          </div>

          {onOpenHomeMenu && (
            <button
              onClick={onOpenHomeMenu}
              className="flex items-center gap-2 bg-[#1e293b]/90 hover:bg-[#334155] border border-slate-600/50 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium transition shadow-md active:scale-95 cursor-pointer"
            >
              <span>Home Menu</span>
            </button>
          )}

          <button
            onClick={onOpenGarage}
            className="flex items-center gap-2 bg-[#1e293b]/90 hover:bg-[#334155] border border-cyan-400/40 text-cyan-100 px-3.5 py-2 rounded-xl text-xs font-medium transition shadow-md active:scale-95 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-300" />
            <span>Garage</span>
          </button>

          <button
            onClick={toggleSound}
            aria-label="Toggle Mute"
            className="p-2 bg-[#1e293b]/90 hover:bg-[#334155] border border-cyan-400/30 text-cyan-200 rounded-xl transition shadow-md active:scale-95 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece Lockup with Bespoke Inline SVG Title */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        <div className="relative mb-3 flex flex-col items-center">
          {/* Bespoke Inline SVG Title Lockup */}
          <svg className="w-[300px] md:w-[460px] h-[90px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]" viewBox="0 0 460 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
              <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Snow Drifting Crest Graphic */}
            <path
              d="M 20 62 Q 70 48, 130 58 T 240 50 T 360 56 T 440 52"
              stroke="#67e8f9"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 4"
              opacity="0.7"
            />

            {/* Main Title Typography */}
            <text
              x="230"
              y="48"
              textAnchor="middle"
              fill="url(#snowGrad)"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="44"
              letterSpacing="3"
            >
              SNOWDRIFT
            </text>

            {/* Plow Blade Underline Accent */}
            <rect x="85" y="66" width="290" height="6" rx="3" fill="url(#bladeGrad)" />
            <circle cx="85" cy="69" r="5" fill="#f59e0b" />
            <circle cx="375" cy="69" r="5" fill="#f59e0b" />

            {/* Sub-label */}
            <text
              x="230"
              y="82"
              textAnchor="middle"
              fill="#bae6fd"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              fontSize="11"
              letterSpacing="5"
            >
              COZY ISOMETRIC SNOW-PLOWING
            </text>
          </svg>

          {/* Subtitle description badge */}
          <div className="mt-2 bg-[#0c1524]/80 border border-sky-400/20 rounded-full px-4 py-1 text-sky-200 text-xs font-medium">
            Clear streets · Build combos · Chill to cozy synth chimes
          </div>
        </div>

        {/* Primary Start CTA */}
        <div className="pointer-events-auto mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              synthAudio.ensureAudio();
              onStartGame();
            }}
            className="group relative flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base rounded-2xl shadow-[0_8px_24px_rgba(245,158,11,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950 transition-transform group-hover:scale-110" />
            <span>START PLOWING</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-400/40 rounded-md ml-1">
              Space / Enter
            </span>
          </button>

          {/* Level Switcher Quick Selector */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mt-3 bg-[#111927]/90 border border-slate-700/60 rounded-xl p-1.5 shadow-lg max-w-sm sm:max-w-md">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => onSelectLevel(lvl)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentLevel.id === lvl.id
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {lvl.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flat Control-Hint Line Bottom Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400/90 font-mono tracking-wide w-full pt-4 border-t border-slate-700/40 bg-gradient-to-t from-slate-950/40 to-transparent">
        <div>
          WASD Move · Space Boost · R Reset to Center · Esc Pause
        </div>
        <div className="mt-2 sm:mt-0 flex items-center gap-2 text-cyan-300/80">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Target: {currentLevel.targetPercent}% cleared road</span>
        </div>
      </div>
    </div>
  );
};
