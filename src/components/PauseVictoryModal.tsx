import React from 'react';
import { Play, RotateCcw, Wrench, ArrowRight, Home, Star, LocateFixed } from 'lucide-react';
import { ActiveGameStats, LevelConfig } from '../types/game';
import { synthAudio } from '../audio/synthAudio';

interface PauseVictoryModalProps {
  isVictory: boolean;
  stats: ActiveGameStats;
  level: LevelConfig;
  hasNextLevel: boolean;
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onOpenGarage: () => void;
  onBackToTitle: () => void;
  onResetCar?: () => void;
}

export const PauseVictoryModal: React.FC<PauseVictoryModalProps> = ({
  isVictory,
  stats,
  level,
  hasNextLevel,
  onResume,
  onRestart,
  onNextLevel,
  onOpenGarage,
  onBackToTitle,
  onResetCar,
}) => {
  // Compute star rating
  const starsEarned = stats.clearedPercent >= 95 ? 3 : stats.clearedPercent >= level.targetPercent ? 2 : 1;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 select-none">
      <div className="w-full max-w-md bg-[#0f172a] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center text-slate-100">
        {isVictory ? (
          <>
            {/* Victory Celebration Header */}
            <div className="flex gap-2 my-2">
              {[1, 2, 3].map((starIdx) => (
                <div
                  key={starIdx}
                  className={`p-2 rounded-2xl ${
                    starIdx <= starsEarned
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-400/50 scale-110 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-black tracking-wide text-white mt-2">
              NEIGHBORHOOD CLEARED!
            </h2>
            <p className="text-xs text-sky-200/80 mt-1">
              Cozy winter roads are safe and open for everyone.
            </p>

            {/* Stats Summary Card */}
            <div className="w-full my-5 bg-[#162238] border border-slate-700/60 rounded-2xl p-4 grid grid-cols-2 gap-3 text-left">
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Road Cleared</div>
                <div className="text-lg font-bold text-cyan-300 tabular-nums font-mono">
                  {stats.clearedPercent}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Snowflakes Won</div>
                <div className="text-lg font-bold text-amber-300 tabular-nums font-mono">
                  +{stats.coinsEarned + 25} ❄
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Total Score</div>
                <div className="text-lg font-bold text-white tabular-nums font-mono">
                  {stats.score}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Plowing Time</div>
                <div className="text-lg font-bold text-slate-300 tabular-nums font-mono">
                  {Math.floor(stats.elapsedTime)}s
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 w-full">
              {hasNextLevel ? (
                <button
                  onClick={() => {
                    synthAudio.ensureAudio();
                    onNextLevel();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <span>NEXT DISTRICT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onRestart}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>PLAY AGAIN</span>
                </button>
              )}

              <div className="flex gap-2 w-full">
                <button
                  onClick={onOpenGarage}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1e293b] hover:bg-[#2d3a4f] text-cyan-200 border border-cyan-500/30 rounded-2xl text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Garage</span>
                </button>

                <button
                  onClick={onBackToTitle}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1e293b] hover:bg-[#2d3a4f] text-slate-300 border border-slate-700 rounded-2xl text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Main Menu</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Pause Screen */}
            <h2 className="text-xl font-bold tracking-wide text-white mb-1">GAME PAUSED</h2>
            <p className="text-xs text-slate-400 mb-6">Take a warm cup of cocoa and relax</p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={onResume}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold rounded-2xl shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>

              {onResetCar && (
                <button
                  onClick={() => {
                    onResetCar();
                    onResume();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#162338] hover:bg-[#20324e] text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  <LocateFixed className="w-4 h-4 text-amber-400" />
                  <span>Reset Car to Center [R]</span>
                </button>
              )}

              <button
                onClick={onRestart}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1e293b] hover:bg-[#2d3a4f] text-slate-200 border border-slate-700 rounded-2xl text-xs font-semibold transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart District</span>
              </button>

              <button
                onClick={onOpenGarage}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1e293b] hover:bg-[#2d3a4f] text-cyan-200 border border-cyan-500/30 rounded-2xl text-xs font-semibold transition active:scale-95 cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                <span>Snowcat Garage</span>
              </button>

              <button
                onClick={onBackToTitle}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-2xl text-xs font-medium transition active:scale-95 cursor-pointer mt-1"
              >
                <Home className="w-4 h-4" />
                <span>Exit to Title</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
