import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Wrench,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Zap,
  Flame,
  Sun,
  CloudSnow,
  Wind,
  Sparkles,
  ShieldAlert,
  Award,
  LocateFixed,
  Smartphone,
} from 'lucide-react';
import { synthAudio } from '../audio/synthAudio';
import { ActiveGameStats, LevelConfig, WeatherType } from '../types/game';
import { MobileControls } from './MobileControls';

interface GameHUDProps {
  stats: ActiveGameStats;
  level: LevelConfig;
  onPause: () => void;
  onOpenGarage: () => void;
  onRestart: () => void;
  onResetCar: () => void;
  onVirtualKey?: (action: 'forward' | 'backward' | 'left' | 'right' | 'boost', isHeld: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  level,
  onPause,
  onOpenGarage,
  onRestart,
  onResetCar,
  onVirtualKey,
}) => {
  const [muted, setMuted] = useState(synthAudio.getMuted());
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 850)
    );
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        setIsDockCollapsed((prev) => !prev);
      } else if (e.code === 'KeyM') {
        const isM = synthAudio.toggleMute();
        setMuted(isM);
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        onResetCar();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onResetCar]);

  const toggleSound = () => {
    synthAudio.ensureAudio();
    const isM = synthAudio.toggleMute();
    setMuted(isM);
  };

  const comboScale = stats.combo > 1 ? Math.min(1.35, 1 + stats.combo * 0.04) : 1;

  // Weather icon and styling helper
  const renderWeatherBadge = (weather: WeatherType) => {
    switch (weather) {
      case 'clear':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 border border-amber-400/50 text-amber-200 rounded-xl text-xs font-semibold shadow-md">
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Crisp Sun (+15% Spd)</span>
          </div>
        );
      case 'blizzard':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-950/90 border border-cyan-400/70 text-cyan-200 rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/40">
            <Wind className="w-3.5 h-3.5 text-cyan-300" />
            <span>BLIZZARD (+75% Score)</span>
          </div>
        );
      case 'aurora':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-400/60 text-emerald-200 rounded-xl text-xs font-semibold shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Aurora Night</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#131d2e]/80 border border-sky-500/30 text-sky-200 rounded-xl text-xs font-medium shadow-md">
            <CloudSnow className="w-3.5 h-3.5 text-sky-300" />
            <span>Light Flurries</span>
          </div>
        );
    }
  };

  // Reputation tier color styling
  const getReputationBadge = (tier: string) => {
    switch (tier) {
      case 'Town Hero':
        return 'text-amber-300 bg-amber-950/80 border-amber-400/50';
      case 'Respected':
        return 'text-emerald-300 bg-emerald-950/80 border-emerald-400/50';
      case 'Neglected':
        return 'text-red-300 bg-red-950/80 border-red-500/50';
      default:
        return 'text-sky-300 bg-sky-950/80 border-sky-400/40';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-2.5 sm:p-4 md:p-6 z-10 overflow-hidden">
      {/* Top Perimeter Status Cluster */}
      <div className="flex justify-between items-start w-full gap-2 sm:gap-4">
        {/* Left: District Reputation & Accurate Road Clearance Progress Bar */}
        <div className="pointer-events-auto flex flex-col gap-2 sm:gap-2.5 bg-[#0e1724]/90 border border-slate-700/80 rounded-2xl p-2.5 sm:p-4 shadow-xl min-w-[190px] sm:min-w-[240px] max-w-[280px] sm:max-w-[320px]">
          {/* Active Town District Header */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sky-100 tracking-wide truncate max-w-[170px]">
                {stats.currentDistrictName || level.name}
              </span>
            </div>
            <span
              className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-lg border font-bold ${getReputationBadge(
                stats.currentDistrictTier
              )}`}
            >
              {stats.currentDistrictTier}
            </span>
          </div>

          {/* Accurate Responsive Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-400 font-medium">Road Cleared</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-cyan-300 tabular-nums font-mono">
                  {stats.clearedPercent}%
                </span>
                <span className="text-[11px] text-slate-500 font-mono">/ {level.targetPercent}% goal</span>
              </div>
            </div>

            {/* Visual Bar with Target Pin Marker */}
            <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className={`h-full transition-all duration-150 rounded-full ${
                  stats.clearedPercent >= level.targetPercent
                    ? 'bg-gradient-to-r from-emerald-400 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    : 'bg-gradient-to-r from-sky-400 via-cyan-400 to-amber-400'
                }`}
                style={{ width: `${Math.min(100, stats.clearedPercent)}%` }}
              />
              {/* Target Goal Tick Marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/70 shadow-sm"
                style={{ left: `${level.targetPercent}%` }}
                title={`Target Goal: ${level.targetPercent}%`}
              />
            </div>
          </div>

          {/* District Reputation Meter & Citizen Feedback */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Town Rep</span>
              </span>
              <span className="font-mono font-bold text-amber-300 tabular-nums">
                {stats.overallTownReputation}%
              </span>
            </div>

            {/* Urgent Citizen Notice if neglected */}
            {stats.currentDistrictTier === 'Neglected' && (
              <div className="flex items-center gap-1.5 text-[10px] text-red-300 bg-red-950/60 border border-red-900/60 rounded-lg px-2 py-1">
                <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
                <span className="truncate">Residents filing complaints! Prioritize this street.</span>
              </div>
            )}
          </div>

          {/* Boost Fuel Meter */}
          <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-2">
            <Zap className={`w-3.5 h-3.5 ${stats.isBoosting ? 'text-amber-400' : 'text-slate-400'}`} />
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  stats.isBoosting ? 'bg-amber-400' : 'bg-sky-400'
                }`}
                style={{ width: `${stats.boostFuel}%` }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-slate-400">
              {Math.round(stats.boostFuel)}%
            </span>
          </div>
        </div>

        {/* Center: Dynamic Weather Badge & Weather Warning Notification */}
        <div className="flex flex-col items-center gap-2">
          {/* Weather Status Badge */}
          {renderWeatherBadge(stats.activeWeather)}

          {/* Incoming Weather Warning Banner */}
          {stats.weatherNotification && (
            <div className="animate-bounce flex items-center gap-2 px-4 py-1.5 bg-red-950/90 border border-red-400/60 text-red-200 rounded-2xl text-xs font-bold shadow-xl">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{stats.weatherNotification}</span>
            </div>
          )}

          {/* Dynamic Combo Multiplier Banner */}
          {stats.combo > 1 && (
            <div
              className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-950/90 to-orange-950/90 border border-amber-500/50 rounded-2xl shadow-lg transition-transform duration-100"
              style={{ transform: `scale(${comboScale})` }}
            >
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">COMBO</span>
                <span className="text-lg font-black text-amber-200 tabular-nums font-mono">
                  {stats.combo}x
                </span>
              </div>
              <div className="w-12 h-1 bg-amber-900 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${(stats.comboTimer / 2.5) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Score, Coins & Top Controls */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <div className="flex flex-col items-end bg-[#0e1724]/90 border border-slate-700/80 rounded-2xl px-3.5 py-2 shadow-xl">
            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="text-xs">❄</span>
              <span className="text-xs font-bold tabular-nums font-mono">{stats.coinsEarned}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 tabular-nums">
              Score: <span className="text-slate-200 font-bold">{stats.score}</span>
            </div>
          </div>

          <button
            onClick={onPause}
            aria-label="Pause"
            className="p-2.5 bg-[#0e1724]/90 hover:bg-[#1a2538] border border-slate-700 text-slate-200 rounded-2xl transition shadow-lg active:scale-95 cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unified Bottom Control Dock */}
      <div
        className={`flex flex-col items-center pointer-events-auto self-center transition-all duration-300 ${
          showTouchControls ? 'mb-20 sm:mb-22' : 'mb-1 sm:mb-2'
        }`}
      >
        <button
          onClick={() => setIsDockCollapsed((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#0e1724]/95 border-t border-x border-slate-700/80 rounded-t-xl text-[11px] font-mono text-slate-300 hover:text-cyan-200 transition shadow-md cursor-pointer"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Dock [H]</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Dock [H]</span>
            </>
          )}
        </button>

        {!isDockCollapsed && (
          <div className="flex items-center gap-3 bg-[#0e1724]/95 border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl">
            {/* Speed Readout */}
            <div className="flex items-baseline gap-1 font-mono text-xs text-slate-400 border-r border-slate-800 pr-3">
              <span className="text-slate-200 font-bold tabular-nums text-sm">
                {(stats.speed * 4.5).toFixed(1)}
              </span>
              <span className="text-[10px]">KM/H</span>
            </div>

            {/* Garage Upgrades Button */}
            <button
              onClick={onOpenGarage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#162338] hover:bg-[#20324e] border border-cyan-500/30 text-cyan-200 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-300" />
              <span>Garage Upgrades</span>
            </button>

            {/* Reset Car to Center Button */}
            <button
              onClick={onResetCar}
              title="Reset Car to Middle of Town [R]"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#162338] hover:bg-[#20324e] border border-amber-500/30 text-amber-200 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <LocateFixed className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Car [R]</span>
            </button>

            {/* Restart Level Button */}
            <button
              onClick={onRestart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#162338] hover:bg-[#20324e] border border-slate-600/40 text-slate-200 rounded-xl text-xs font-medium transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
              <span>Restart</span>
            </button>

            {/* Mobile Touch Controls Toggle */}
            <button
              onClick={() => setShowTouchControls((prev) => !prev)}
              aria-label="Toggle Mobile Touch Controls"
              title={showTouchControls ? 'Hide Touch Buttons' : 'Show Touch Buttons'}
              className={`p-1.5 border rounded-xl transition active:scale-95 cursor-pointer ${
                showTouchControls
                  ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200'
                  : 'bg-[#162338] hover:bg-[#20324e] border-slate-600/40 text-slate-400'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              aria-label="Toggle Sound"
              className="p-1.5 bg-[#162338] hover:bg-[#20324e] border border-slate-600/40 text-slate-200 rounded-xl transition active:scale-95 cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-300" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile On-Screen Touch Controls */}
      {showTouchControls && onVirtualKey && (
        <MobileControls
          onVirtualKey={onVirtualKey}
          onResetCar={onResetCar}
          boostFuel={stats.boostFuel}
        />
      )}
    </div>
  );
};
