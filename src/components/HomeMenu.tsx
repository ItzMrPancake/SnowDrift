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
  Calendar,
  Monitor,
  Download,
  Smartphone,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';
import { synthAudio } from '../audio/synthAudio';
import { LevelConfig, SaveGameData, VehicleSkin, GraphicsSettings, DailyChallenge } from '../types/game';

interface HomeMenuProps {
  levels: LevelConfig[];
  currentLevel: LevelConfig;
  saveData: SaveGameData;
  activeSkin: VehicleSkin;
  dailyChallenge?: DailyChallenge;
  graphicsSettings: GraphicsSettings;
  forcedMobileControls: boolean;
  onSelectLevel: (lvl: LevelConfig) => void;
  onPlayGame: () => void;
  onOpenGarage: () => void;
  onResetSave: () => void;
  onClaimDailyReward?: (coins: number) => void;
  onUpdateGraphicsSettings: (settings: GraphicsSettings) => void;
  onToggleForcedMobileControls: () => void;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({
  levels,
  currentLevel,
  saveData,
  activeSkin,
  dailyChallenge,
  graphicsSettings,
  forcedMobileControls,
  onSelectLevel,
  onPlayGame,
  onOpenGarage,
  onResetSave,
  onClaimDailyReward,
  onUpdateGraphicsSettings,
  onToggleForcedMobileControls,
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'daily' | 'graphics' | 'career' | 'export' | 'settings'>('play');
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
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-6 md:p-8 select-none bg-gradient-to-b from-[#0a111c]/85 via-[#0b1424]/70 to-[#0a111c]/95 pointer-events-auto overflow-y-auto font-sans">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-[#121c2d]/90 border border-cyan-500/40 rounded-2xl px-4 py-2 shadow-lg">
            <span className="text-xl">🚜</span>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">SNOWDRIFT</div>
              <div className="text-[10px] text-cyan-300 font-mono">Town Plowing Headquarters</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#121c2d]/80 border border-slate-700/60 rounded-xl text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Progress Saved Locally</span>
          </div>
        </div>

        {/* Currency & Audio & Save Status */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 bg-[#121c2d]/90 border border-amber-500/40 rounded-2xl px-3.5 py-1.5 sm:px-4 sm:py-2 text-amber-200 shadow-md">
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
            className="p-2 sm:p-2.5 bg-[#1b263b]/90 hover:bg-[#253552] border border-slate-700 text-slate-200 rounded-xl transition active:scale-95 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
          </button>
        </div>
      </div>

      {/* Main Home Hub Card */}
      <div className="my-auto w-full max-w-2xl mx-auto bg-[#0d1626]/95 border border-slate-700/70 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col gap-4 sm:gap-6 max-h-[85vh] overflow-y-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'play', label: 'Districts', icon: Compass },
            { id: 'daily', label: 'Daily Challenge', icon: Calendar },
            { id: 'graphics', label: 'Graphics & 4K', icon: Monitor },
            { id: 'export', label: 'Standalone .EXE', icon: Download },
            { id: 'career', label: 'Career', icon: Trophy },
            { id: 'settings', label: 'Controls', icon: Wrench },
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
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
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
          <div className="flex flex-col gap-4">
            {/* Daily Challenge Quick Banner */}
            {dailyChallenge && (
              <div
                onClick={() => setActiveTab('daily')}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-950/70 via-[#182030] to-cyan-950/70 border border-amber-500/40 rounded-2xl cursor-pointer hover:border-amber-400 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                      Today's Daily Challenge · +{dailyChallenge.rewardCoins} ❄ Coins
                    </div>
                    <div className="text-xs font-semibold text-slate-200">{dailyChallenge.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-300 font-mono">
                  <span>{dailyChallenge.isCompleted ? 'Completed' : 'View'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )}

            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-cyan-300 font-bold mb-1">
                Select Your Winter District
              </div>
              <p className="text-xs text-slate-400">
                Choose a neighborhood to plow. Maintain town reputation above 75% for civic honors!
              </p>
            </div>

            {/* Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {levels.map((lvl) => {
                const isSelected = lvl.id === currentLevel.id;
                const isLocked = lvl.id > saveData.unlockedLevel;

                return (
                  <button
                    key={lvl.id}
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) {
                        synthAudio.playPickup();
                        onSelectLevel(lvl);
                      }
                    }}
                    className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-950/50'
                        : isLocked
                        ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                        : 'bg-[#121c2d]/70 hover:bg-[#1a263c] border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="text-cyan-400 font-bold">DISTRICT 0{lvl.id}</span>
                        {isSelected && <span className="text-[10px] text-amber-300 font-bold">ACTIVE</span>}
                      </div>
                      <div className="text-sm font-bold text-white leading-tight mb-1">{lvl.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2">{lvl.subtitle}</div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">Goal: {lvl.targetPercent}%</span>
                      {isSelected ? (
                        <span className="text-cyan-300 font-bold">Selected ✓</span>
                      ) : (
                        <span className="text-slate-500">Select</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onPlayGame}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black rounded-2xl text-sm tracking-wide shadow-xl shadow-cyan-500/20 transition active:scale-98 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Plowing Road</span>
              </button>

              <button
                onClick={onOpenGarage}
                className="flex items-center gap-2 px-5 py-3.5 bg-[#1b263b] hover:bg-[#253552] border border-cyan-500/30 text-cyan-200 font-bold rounded-2xl text-sm transition active:scale-95 cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-cyan-300" />
                <span>Garage</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Daily Challenge */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-amber-300 font-bold mb-1">
                Daily Civic Challenge · Date: {dailyChallenge?.dateString}
              </div>
              <p className="text-xs text-slate-400">
                Fresh challenges rotate every midnight. Complete specific road objectives to earn coin bounties!
              </p>
            </div>

            {dailyChallenge ? (
              <div className="p-5 bg-gradient-to-br from-amber-950/40 via-[#121c2d] to-cyan-950/30 border border-amber-500/40 rounded-3xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-bold text-white">{dailyChallenge.title}</div>
                    <div className="text-xs text-amber-300 font-mono mt-0.5">District: {dailyChallenge.levelName}</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-xl text-xs font-bold font-mono">
                    <span>+{dailyChallenge.rewardCoins} ❄ Coins</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0b121e]/60 p-3.5 rounded-2xl border border-slate-700/60">
                  {dailyChallenge.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Target Clearance</div>
                    <div className="text-sm font-bold text-cyan-300">{dailyChallenge.targetPercent}% Road</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Required Weather</div>
                    <div className="text-sm font-bold text-amber-300 uppercase">
                      {dailyChallenge.requiredWeather || 'Any Weather'}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Time Constraint</div>
                    <div className="text-sm font-bold text-slate-200">
                      {dailyChallenge.timeLimitSeconds ? `${dailyChallenge.timeLimitSeconds}s Limit` : 'No Limit'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  {dailyChallenge.isCompleted ? (
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-950/70 border border-emerald-400/50 text-emerald-200 font-bold rounded-2xl text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Today's Daily Bounty Already Claimed!</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const targetLvl = levels.find((l) => l.id === dailyChallenge.levelId) || levels[0];
                        onSelectLevel(targetLvl);
                        onPlayGame();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition active:scale-98 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Launch Daily Challenge ({dailyChallenge.levelName})</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">No active daily challenge found.</div>
            )}
          </div>
        )}

        {/* Tab 3: Graphics & Display Settings */}
        {activeTab === 'graphics' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-cyan-300 font-bold mb-1">
                Display & Graphics Quality Settings
              </div>
              <p className="text-xs text-slate-400">
                Tailor render resolution up to 4K Ultra, target refresh rate, and shadow fidelity.
              </p>
            </div>

            {/* Resolution Selector */}
            <div className="p-4 bg-[#141f33] border border-slate-700/60 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Rendering Resolution</span>
                <span className="font-mono text-cyan-300">{graphicsSettings.resolution.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['720p', '1080p', '1440p', '4k'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => {
                      synthAudio.playBump();
                      onUpdateGraphicsSettings({ ...graphicsSettings, resolution: res });
                    }}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                      graphicsSettings.resolution === res
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {res.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Target FPS Selector */}
            <div className="p-4 bg-[#141f33] border border-slate-700/60 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Target Refresh Rate</span>
                <span className="font-mono text-cyan-300">
                  {graphicsSettings.targetFps === 0 ? 'UNCAPPED' : `${graphicsSettings.targetFps} FPS`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {([30, 60, 120, 0] as const).map((fps) => (
                  <button
                    key={fps}
                    onClick={() => {
                      synthAudio.playBump();
                      onUpdateGraphicsSettings({ ...graphicsSettings, targetFps: fps });
                    }}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                      graphicsSettings.targetFps === fps
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fps === 0 ? 'Max/Uncapped' : `${fps} FPS`}
                  </button>
                ))}
              </div>
            </div>

            {/* Shadows Quality */}
            <div className="p-4 bg-[#141f33] border border-slate-700/60 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">PCFSoft Shadow Quality</span>
                <span className="font-mono text-cyan-300">{graphicsSettings.shadows.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['off', 'medium', 'ultra'] as const).map((shd) => (
                  <button
                    key={shd}
                    onClick={() => {
                      synthAudio.playBump();
                      onUpdateGraphicsSettings({ ...graphicsSettings, shadows: shd });
                    }}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                      graphicsSettings.shadows === shd
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {shd.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Snow Particle Density */}
            <div className="p-4 bg-[#141f33] border border-slate-700/60 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Snowfall Particle Density</span>
                <span className="font-mono text-cyan-300">{graphicsSettings.snowParticles.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((den) => (
                  <button
                    key={den}
                    onClick={() => {
                      synthAudio.playBump();
                      onUpdateGraphicsSettings({ ...graphicsSettings, snowParticles: den });
                    }}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                      graphicsSettings.snowParticles === den
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {den.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Standalone .EXE & Mobile Guide (NO GITHUB) */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold mb-1">
                How to Get a Standalone .EXE & Mobile App (Without GitHub)
              </div>
              <p className="text-xs text-slate-400">
                You do NOT need GitHub to build an .EXE. Follow these two simple local steps on your PC:
              </p>
            </div>

            {/* Method 1: Instant Nativefier .EXE */}
            <div className="p-4 bg-[#141f33] border border-emerald-500/40 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <span className="px-2 py-0.5 bg-emerald-500/20 rounded font-mono">Option 1 (Easiest)</span>
                <span>One-Line Local .EXE Generator</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Open your terminal/command prompt and run this single command. It packages the game into a self-contained Windows folder with a <code className="text-cyan-300 font-bold">SnowDrift.exe</code> ready to copy to a USB drive or share via Discord/Drive:
              </p>
              <pre className="p-3 bg-[#0a0f18] text-cyan-300 rounded-xl text-[11px] font-mono overflow-x-auto select-all border border-slate-800">
                npx nativefier "http://localhost:3000" --name "SnowDrift" --single-instance
              </pre>
            </div>

            {/* Method 2: Offline Dist Build */}
            <div className="p-4 bg-[#141f33] border border-slate-700/60 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span className="px-2 py-0.5 bg-slate-700 rounded font-mono text-[10px]">Option 2</span>
                <span>Local Electron Packager (100% Offline .EXE)</span>
              </div>
              <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside font-mono">
                <li>Run <code className="text-amber-300">npm run build</code> to compile the assets into the <code className="text-amber-300">dist/</code> folder.</li>
                <li>Run <code className="text-amber-300">npx electron-packager . SnowDrift --platform=win32 --arch=x64 --out=builds</code></li>
                <li>Open the <code className="text-cyan-300">builds/SnowDrift-win32-x64/</code> folder and double click <code className="text-emerald-400 font-bold">SnowDrift.exe</code>!</li>
              </ol>
            </div>

            {/* How to Install on Mobile */}
            <div className="p-4 bg-[#141f33] border border-cyan-500/40 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>How to Install on Mobile (Enables Mobile Controls)</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
                <div>
                  <strong className="text-white">On iPhone / iPad (Safari):</strong> Tap the <span className="text-cyan-300">Share icon</span> at the bottom of Safari, scroll down and tap <span className="text-cyan-300">"Add to Home Screen"</span>.
                </div>
                <div>
                  <strong className="text-white">On Android (Chrome):</strong> Tap the <span className="text-cyan-300">three dots menu (⋮)</span> in Chrome and tap <span className="text-cyan-300">"Install App"</span> or <span className="text-cyan-300">"Add to Home screen"</span>.
                </div>
                <div className="text-amber-300 text-[10px] bg-amber-950/40 p-2 rounded-xl border border-amber-900/40">
                  ★ Mobile touch controls are automatically activated when opened from your Home Screen!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Career & Stats */}
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

        {/* Tab 6: Controls & Saves */}
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

            {/* Mobile Controls Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#141f33] border border-slate-700/60 rounded-2xl">
              <div>
                <div className="text-xs font-bold text-white">Force Mobile Touch Controls on Screen</div>
                <div className="text-[11px] text-slate-400">
                  {forcedMobileControls ? 'Touch buttons enabled on desktop/screen' : 'Touch buttons hidden (only shows when installed on mobile)'}
                </div>
              </div>
              <button
                onClick={onToggleForcedMobileControls}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  forcedMobileControls ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {forcedMobileControls ? 'Enabled' : 'Disabled'}
              </button>
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
