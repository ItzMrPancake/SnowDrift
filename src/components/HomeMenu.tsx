import React, { useState } from 'react';
import {
  Play,
  Wrench,
  Award,
  Save,
  RotateCcw,
  Volume2,
  VolumeX,
  Compass,
  Trophy,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { synthAudio } from '../audio/synthAudio';
import { LevelConfig, SaveGameData, VehicleSkin, VehicleUpgrades } from '../types/game';

interface HomeMenuProps {
  levels: LevelConfig[];
  currentLevel: LevelConfig;
  saveData: SaveGameData;
  activeSkin: VehicleSkin;
  onSelectLevel: (lvl: LevelConfig) => void;
  onPlayGame: () => void;
  onOpenGarage: () => void;
  onResetSave: () => void;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({
  levels,
  currentLevel,
  saveData,
  activeSkin,
  onSelectLevel,
  onPlayGame,
  onOpenGarage,
  onResetSave,
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'districts' | 'career' | 'settings'>('play');
  const [muted, setMuted] = useState(synthAudio.getMuted());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const toggleSound = () => {
    synthAudio.ensureAudio();
    const isM = synthAudio.toggleMute();
    setMuted(isM);
  };

  const handleManualSave = () => {
    setSaveToast(true);
    synthAudio.playPickup();
    setTimeout(() => setSaveToast(false), 2200);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-6 md:p-8 select-none bg-gradient-to-b from-[#0a111c]/80 via-transparent to-[#0a111c]/90 pointer-events-auto overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#121c2d]/90 border border-cyan-500/40 rounded-2xl px-4 py-2 shadow-lg">
            <span className="text-xl">🚜</span>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">SNOWDRIFT</div>
              <div className="text-[10px] text-cyan-300 font-mono">Winter Edition</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#121c2d]/80 border border-slate-700/60 rounded-xl text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Progress Saved Locally</span>
          </div>
        </div>

        {/* Currency & Audio & Save Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#121c2d]/90 border border-amber-500/40 rounded-2xl px-4 py-2 text-amber-200 shadow-md">
            <span className="text-amber-400 font-bold">❄</span>
            <span className="text-sm font-bold tabular-nums font-mono">{saveData.coins}</span>
          </div>

          <button
            onClick={handleManualSave}
            title="Save Game to Local Disk"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1b263b]/90 hover:bg-[#253552] border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-2.5 bg-[#1b263b]/90 hover:bg-[#253552] border border-slate-700 text-slate-200 rounded-xl transition active:scale-95 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
          </button>
        </div>
      </div>

      {/* Main Home Hub Card */}
      <div className="my-auto w-full max-w-2xl mx-auto bg-[#0d1626]/95 border border-slate-700/70 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col gap-4 sm:gap-6 max-h-[85vh] overflow-y-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'play', label: 'Play / Districts', icon: Compass },
            { id: 'career', label: 'Career & Stats', icon: Trophy },
            { id: 'settings', label: 'Controls & Saves', icon: Wrench },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  synthAudio.playPickup();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Play & District Select */}
        {activeTab === 'play' && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-cyan-300 font-bold mb-1">
                Select Your Winter District
              </div>
              <p className="text-xs text-slate-400">
                Plow roads, clear town plazas, and build high town reputation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {levels.map((lvl) => {
                const isSelected = currentLevel.id === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      synthAudio.playPickup();
                      onSelectLevel(lvl);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-950/70 to-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : 'bg-[#152033]/70 border-slate-700/60 hover:bg-[#1a283f]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span>{lvl.name}</span>
                        {isSelected && <span className="text-[10px] text-cyan-300 font-mono font-bold">ACTIVE</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug">{lvl.subtitle}</div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                      <span className="text-amber-300">Goal: {lvl.targetPercent}%</span>
                      <span className="capitalize text-slate-400">{lvl.ambientMood.replace('_', ' ')}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  synthAudio.ensureAudio();
                  onPlayGame();
                }}
                className="flex-1 flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl shadow-[0_8px_20px_rgba(245,158,11,0.35)] transition transform active:scale-95 cursor-pointer text-sm"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START SNOW-PLOWING</span>
              </button>

              <button
                onClick={() => {
                  synthAudio.playPickup();
                  onOpenGarage();
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1e2c45] hover:bg-[#283b5c] text-cyan-200 border border-cyan-500/30 rounded-2xl font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-cyan-300" />
                <span>Garage & Livery</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Career & Stats */}
        {activeTab === 'career' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-amber-300 font-bold mb-1">
                Career Snowplow Service Records
              </div>
              <p className="text-xs text-slate-400">
                Persistent statistics saved across game restarts and installations.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 bg-[#141f33] border border-slate-700/60 rounded-2xl">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Snowflakes Bank</div>
                <div className="text-xl font-bold text-amber-300 font-mono mt-1">{saveData.coins} ❄</div>
              </div>

              <div className="p-3.5 bg-[#141f33] border border-slate-700/60 rounded-2xl">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Top High Score</div>
                <div className="text-xl font-bold text-white font-mono mt-1">{saveData.highScore}</div>
              </div>

              <div className="p-3.5 bg-[#141f33] border border-slate-700/60 rounded-2xl">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Highest Combo</div>
                <div className="text-xl font-bold text-amber-400 font-mono mt-1">{saveData.highestCombo}x</div>
              </div>

              <div className="p-3.5 bg-[#141f33] border border-slate-700/60 rounded-2xl">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Equipped Paint</div>
                <div className="text-xs font-bold text-cyan-300 font-mono mt-2 truncate">{activeSkin.name}</div>
              </div>
            </div>

            {/* Town Reputation Overview */}
            <div className="p-4 bg-[#141f33] border border-slate-700/60 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>District Reputation Records</span>
                </span>
                <span className="text-amber-300 text-[10px] font-mono">Saved in Storage</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                <div>Maple Residential: <span className="text-cyan-300">Respected (70%)</span></div>
                <div>Town Center Commercial: <span className="text-cyan-300">Active (65%)</span></div>
                <div>Highland Clinic Zone: <span className="text-cyan-300">Priority (60%)</span></div>
                <div>Pine Ridge Trail: <span className="text-cyan-300">Town Hero (85%)</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Controls & Saves */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-cyan-300 font-bold mb-1">
                Controls & Offline Save System
              </div>
              <p className="text-xs text-slate-400">
                All coins, garage upgrades, and unlocked districts are saved to your browser/desktop storage.
              </p>
            </div>

            {/* Controls Guide */}
            <div className="p-4 bg-[#141f33] border border-slate-700/60 rounded-2xl text-xs space-y-2">
              <div className="font-bold text-white mb-1">Keyboard Shortcuts:</div>
              <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                <div><span className="text-cyan-300 font-bold">W / ↑</span> : Drive Forward</div>
                <div><span className="text-cyan-300 font-bold">S / ↓</span> : Reverse / Brake</div>
                <div><span className="text-cyan-300 font-bold">A / D</span> : Steer Left / Right</div>
                <div><span className="text-cyan-300 font-bold">Space</span> : Nitro Turbo Boost</div>
                <div><span className="text-amber-300 font-bold">R</span> : Reset Car to Center</div>
                <div><span className="text-cyan-300 font-bold">Esc</span> : Pause / Main Menu</div>
              </div>
            </div>

            {/* Save Data Management */}
            <div className="flex items-center justify-between p-4 bg-[#141f33] border border-slate-700/60 rounded-2xl">
              <div>
                <div className="text-xs font-bold text-white">Installed & Offline Save File</div>
                <div className="text-[11px] text-slate-400">Auto-saves every upgrade and district victory.</div>
              </div>

              {showResetConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onResetSave();
                      setShowResetConfirm(false);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Reset Progress
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-emerald-950/95 border border-emerald-400/70 text-emerald-200 rounded-2xl text-xs font-bold shadow-2xl z-50 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Game & Upgrades Successfully Saved to Disk!</span>
        </div>
      )}

      {/* Footer bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-mono tracking-wide w-full pt-3 border-t border-slate-800">
        <div>SnowDrift v1.2 · 3D Isometric Snowplow</div>
        <div>Press Space or Enter to Play</div>
      </div>
    </div>
  );
};
