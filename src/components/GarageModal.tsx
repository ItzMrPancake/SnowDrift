import React from 'react';
import { X, Check, Zap, Sparkles, SlidersHorizontal, ArrowUp, Award, Flame, Lock } from 'lucide-react';
import { VehicleUpgrades, VehicleSkin } from '../types/game';
import { synthAudio } from '../audio/synthAudio';

interface GarageModalProps {
  upgrades: VehicleUpgrades;
  skins: VehicleSkin[];
  activeSkinId: string;
  coins: number;
  townReputation: number;
  onUpgrade: (key: keyof VehicleUpgrades, cost: number) => void;
  onSelectSkin: (skinId: string) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  upgrades,
  skins,
  activeSkinId,
  coins,
  townReputation,
  onUpgrade,
  onSelectSkin,
  onClose,
}) => {
  const standardUpgradeItems: {
    key: keyof VehicleUpgrades;
    name: string;
    desc: string;
    icon: string;
    maxLevel: number;
    baseCost: number;
  }[] = [
    {
      key: 'bladeWidth',
      name: 'V-Blade Width',
      desc: 'Widens plow clearing swath for higher throughput',
      icon: '📐',
      maxLevel: 5,
      baseCost: 20,
    },
    {
      key: 'engineSpeed',
      name: 'Heavy Diesel Engine',
      desc: 'Increases top speed & snow-pushing torque',
      icon: '⚙️',
      maxLevel: 5,
      baseCost: 25,
    },
    {
      key: 'snowGrip',
      name: 'Tire Snow Chains',
      desc: 'Sharpens steering & prevents sliding on ice',
      icon: '⛓️',
      maxLevel: 5,
      baseCost: 20,
    },
    {
      key: 'saltSpreader',
      name: 'Rear Salt Spreader',
      desc: 'Automatically clears snow in a radius behind you',
      icon: '🧂',
      maxLevel: 4,
      baseCost: 35,
    },
    {
      key: 'boostTank',
      name: 'Nitro Turbo Tank',
      desc: 'Faster nitro recharge & extended boost duration',
      icon: '⚡',
      maxLevel: 5,
      baseCost: 30,
    },
  ];

  const reputationItems: {
    key: keyof VehicleUpgrades;
    name: string;
    desc: string;
    icon: string;
    reqRep: number;
    maxLevel: number;
    baseCost: number;
  }[] = [
    {
      key: 'heatedBlade',
      name: 'Council Heated Blade',
      desc: 'Thermal cutting edge melts packed snow 25% faster',
      icon: '🔥',
      reqRep: 60,
      maxLevel: 3,
      baseCost: 55,
    },
    {
      key: 'blowerTurbine',
      name: 'Highland Snowblower',
      desc: 'Auger throws snow deep off the curb for massive combos',
      icon: '🌪️',
      reqRep: 80,
      maxLevel: 3,
      baseCost: 75,
    },
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 select-none">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950 border border-cyan-500/40 rounded-2xl text-cyan-300">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-white">Snowcat Garage</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Vehicle tuning & reputation armory</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-amber-300 font-semibold">
                  <Award className="w-3.5 h-3.5" />
                  Town Rep: {townReputation}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#1e293b] border border-amber-500/40 rounded-2xl px-4 py-1.5 shadow-inner">
              <span className="text-amber-400 font-bold">❄</span>
              <span className="text-sm font-bold tabular-nums font-mono text-amber-200">
                {coins}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* 1. Standard Upgrades */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Standard Workshop Upgrades</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {standardUpgradeItems.map((item) => {
                const currentLevel = upgrades[item.key] || 0;
                const isMax = currentLevel >= item.maxLevel;
                const cost = isMax ? 0 : Math.round(item.baseCost * (1 + currentLevel * 0.8));
                const canAfford = coins >= cost;

                return (
                  <div
                    key={item.key}
                    className="p-3.5 bg-[#172236]/90 border border-slate-700/60 rounded-2xl flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-400 leading-tight">{item.desc}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <div className="flex gap-1.5">
                        {Array.from({ length: item.maxLevel }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full ${
                              i < currentLevel
                                ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                                : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>

                      {isMax ? (
                        <span className="text-xs font-mono font-bold text-cyan-300 uppercase px-2.5 py-1 bg-cyan-950/60 rounded-lg border border-cyan-800/40">
                          MAX
                        </span>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            if (canAfford) {
                              synthAudio.playUpgrade();
                              onUpgrade(item.key, cost);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>{cost} ❄</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Town Reputation Special Unlock Upgrades */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Town Reputation Special Gear</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reputationItems.map((item) => {
                const currentLevel = upgrades[item.key] || 0;
                const isUnlocked = townReputation >= item.reqRep;
                const isMax = currentLevel >= item.maxLevel;
                const cost = isMax ? 0 : Math.round(item.baseCost * (1 + currentLevel * 0.9));
                const canAfford = coins >= cost;

                return (
                  <div
                    key={item.key}
                    className={`p-3.5 border rounded-2xl flex flex-col justify-between gap-3 shadow-md ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-[#1a2538] to-[#121c2c] border-amber-500/40'
                        : 'bg-slate-900/60 border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {!isUnlocked && (
                              <span className="text-[10px] text-amber-400/80 font-mono bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/50 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> {item.reqRep}% Rep
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight">{item.desc}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <div className="flex gap-1.5">
                        {Array.from({ length: item.maxLevel }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full ${
                              i < currentLevel
                                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>

                      {!isUnlocked ? (
                        <span className="text-[11px] font-mono text-slate-500">
                          Requires {item.reqRep}% Rep
                        </span>
                      ) : isMax ? (
                        <span className="text-xs font-mono font-bold text-amber-300 uppercase px-2.5 py-1 bg-amber-950/60 rounded-lg border border-amber-800/40">
                          MAX
                        </span>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            if (canAfford) {
                              synthAudio.playUpgrade();
                              onUpgrade(item.key, cost);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>{cost} ❄</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Vehicle Paint Livery Skins */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Custom Winter Paint Livery</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {skins.map((skin) => {
                const isSelected = activeSkinId === skin.id;
                const isLocked = skin.requiredReputation && townReputation < skin.requiredReputation;

                return (
                  <button
                    key={skin.id}
                    disabled={Boolean(isLocked)}
                    onClick={() => {
                      if (!isLocked) {
                        synthAudio.playPickup();
                        onSelectSkin(skin.id);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : isLocked
                        ? 'bg-slate-900/60 border-slate-800 opacity-60 cursor-not-allowed'
                        : 'bg-[#172236]/80 border-slate-700/60 hover:bg-[#1f2e48]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: skin.primaryColor }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-white/40 shadow-sm -ml-2"
                        style={{ backgroundColor: skin.bladeColor }}
                      />
                      {isSelected && <Check className="w-4 h-4 text-cyan-300 ml-auto" />}
                      {isLocked && <Lock className="w-3.5 h-3.5 text-slate-500 ml-auto" />}
                    </div>
                    <div className="text-xs font-bold text-white leading-tight">{skin.name}</div>
                    {isLocked && (
                      <span className="text-[10px] text-amber-400 font-mono">
                        {skin.requiredReputation}% Rep
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-2xl shadow-lg transition active:scale-95 cursor-pointer"
          >
            Done & Return
          </button>
        </div>
      </div>
    </div>
  );
};
