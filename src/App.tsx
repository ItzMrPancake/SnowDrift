/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameState, VehicleUpgrades, VehicleSkin, LevelConfig, ActiveGameStats, SaveGameData } from './types/game';
import { SnowScene } from './three/SnowScene';
import { TitleScreen } from './components/TitleScreen';
import { HomeMenu } from './components/HomeMenu';
import { GameHUD } from './components/GameHUD';
import { GarageModal } from './components/GarageModal';
import { PauseVictoryModal } from './components/PauseVictoryModal';
import { LoadingScreen } from './components/LoadingScreen';
import { synthAudio } from './audio/synthAudio';
import { saveManager } from './utils/saveManager';

const AVAILABLE_SKINS: VehicleSkin[] = [
  {
    id: 'nordic_yellow',
    name: 'Nordic Safety Gold',
    primaryColor: '#f59e0b',
    secondaryColor: '#1e293b',
    bladeColor: '#fbbf24',
    unlocked: true,
    cost: 0,
  },
  {
    id: 'alpine_red',
    name: 'Alpine Rescue Red',
    primaryColor: '#dc2626',
    secondaryColor: '#ffffff',
    bladeColor: '#e2e8f0',
    unlocked: true,
    cost: 50,
  },
  {
    id: 'glacier_mint',
    name: 'Glacier Mint Frost',
    primaryColor: '#06b6d4',
    secondaryColor: '#0f172a',
    bladeColor: '#67e8f9',
    unlocked: true,
    cost: 75,
  },
  {
    id: 'midnight_cyber',
    name: 'Midnight Blizzard',
    primaryColor: '#312e81',
    secondaryColor: '#f59e0b',
    bladeColor: '#818cf8',
    unlocked: true,
    cost: 100,
  },
  {
    id: 'town_hero_gold',
    name: 'Town Hero Gold Livery',
    primaryColor: '#eab308',
    secondaryColor: '#fef08a',
    bladeColor: '#fde047',
    unlocked: true,
    cost: 150,
    requiredReputation: 80,
  },
];

const GAME_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Sugar Pine Cul-de-Sac',
    subtitle: 'Warm cabins & gentle suburban snow',
    description: 'Clear the looping cul-de-sac and residential driveways before morning commuters leave!',
    targetPercent: 75,
    size: { width: 55, length: 55 },
    snowDensity: 'light',
    ambientMood: 'sunrise',
  },
  {
    id: 2,
    name: 'Alpine Village Pass',
    subtitle: 'Charming chalets & frozen roads',
    description: 'Winding mountain curves, frozen slippery ice ponds, and heavier snowdrifts.',
    targetPercent: 80,
    size: { width: 68, length: 68 },
    snowDensity: 'moderate',
    ambientMood: 'afternoon',
  },
  {
    id: 3,
    name: 'Blizzard Boulevard',
    subtitle: 'Deep snowdrifts & downtown avenue',
    description: 'Intense snow squalls in the town square. Massive snow mounds and hidden golden gifts!',
    targetPercent: 85,
    size: { width: 80, length: 80 },
    snowDensity: 'blizzard',
    ambientMood: 'twilight',
  },
];

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const snowSceneRef = useRef<SnowScene | null>(null);
  const previousStateRef = useRef<GameState>('TITLE');

  // Load persistent save data (auto-retained on restart / installation)
  const [saveData, setSaveData] = useState<SaveGameData>(() => saveManager.load());

  // Game flow states
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [levelIndex, setLevelIndex] = useState<number>(() => Math.max(0, (saveData.selectedLevelId || 1) - 1));
  const [coins, setCoins] = useState<number>(() => saveData.coins);
  const [upgrades, setUpgrades] = useState<VehicleUpgrades>(() => saveData.upgrades);
  const [activeSkinId, setActiveSkinId] = useState<string>(() => saveData.activeSkinId);

  // Real-time Stats from simulation
  const [activeStats, setActiveStats] = useState<ActiveGameStats>({
    clearedPercent: 0,
    totalSnowUnits: 1000,
    clearedUnits: 0,
    combo: 1,
    comboTimer: 0,
    score: 0,
    coinsEarned: 0,
    boostFuel: 100,
    maxBoostFuel: 100,
    isBoosting: false,
    speed: 0,
    elapsedTime: 0,
    currentDistrictName: 'Maple Residential Loop',
    currentDistrictReputation: 50,
    currentDistrictTier: 'Neutral',
    overallTownReputation: 50,
    activeWeather: 'light_snow',
    weatherTimeRemaining: 45,
    weatherNotification: '',
  });

  const currentLevel = GAME_LEVELS[levelIndex] || GAME_LEVELS[0];
  const activeSkin = AVAILABLE_SKINS.find((s) => s.id === activeSkinId) || AVAILABLE_SKINS[0];

  // Auto-persist coins, upgrades, skins, and high score
  useEffect(() => {
    saveManager.save({
      coins,
      upgrades,
      activeSkinId,
      selectedLevelId: levelIndex + 1,
      highScore: Math.max(saveData.highScore, activeStats.score),
      highestCombo: Math.max(saveData.highestCombo, activeStats.combo),
    });
    setSaveData(saveManager.getSave());
  }, [coins, upgrades, activeSkinId, levelIndex, activeStats.score, activeStats.combo]);

  // Initialize and tear down Three.js scene (only when level changes)
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const scene = new SnowScene(
      canvasMountRef.current,
      currentLevel,
      upgrades,
      activeSkin,
      (stats) => {
        setActiveStats(stats);
      },
      () => {
        setGameState('VICTORY');
        setCoins((prev) => {
          const next = prev + 35;
          saveManager.save({ coins: next, unlockedLevel: Math.max(saveData.unlockedLevel, levelIndex + 2) });
          return next;
        });
      }
    );

    snowSceneRef.current = scene;

    return () => {
      scene.destroy();
      snowSceneRef.current = null;
    };
  }, [levelIndex]);

  // Safely update vehicle upgrades/skin in scene WITHOUT resetting position or reloading
  useEffect(() => {
    if (snowSceneRef.current) {
      snowSceneRef.current.updateUpgradesAndSkin(upgrades, activeSkin);
    }
  }, [upgrades, activeSkin]);

  // Global key bindings
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        } else if (gameState === 'GARAGE') {
          handleCloseGarage();
        } else if (gameState === 'HOME') {
          setGameState('PLAYING');
        }
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        if (gameState === 'PLAYING') {
          handleResetCar();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState]);

  // Handlers
  const handleStartGame = () => {
    synthAudio.ensureAudio();
    setIsLoading(true);
    if (gameState === 'TITLE' && snowSceneRef.current) {
      snowSceneRef.current.restartLevel();
    }
  };

  const handleLoadingFinish = () => {
    setIsLoading(false);
    setGameState('PLAYING');
  };

  const handlePause = () => {
    setGameState('PAUSED');
  };

  const handleResume = () => {
    setGameState('PLAYING');
  };

  const handleRestart = () => {
    if (snowSceneRef.current) {
      snowSceneRef.current.restartLevel();
    }
    setIsLoading(true);
  };

  const handleResetCar = () => {
    if (snowSceneRef.current) {
      snowSceneRef.current.resetVehicleToCenter();
    }
  };

  const handleNextLevel = () => {
    const nextIdx = (levelIndex + 1) % GAME_LEVELS.length;
    setLevelIndex(nextIdx);
    setIsLoading(true);
  };

  const handleVirtualKey = (action: 'forward' | 'backward' | 'left' | 'right' | 'boost', isHeld: boolean) => {
    if (snowSceneRef.current) {
      snowSceneRef.current.setVirtualKey(action, isHeld);
    }
  };

  const handleUpgrade = (key: keyof VehicleUpgrades, cost: number) => {
    if (coins < cost) return;
    setCoins((c) => c - cost);
    setUpgrades((u) => ({
      ...u,
      [key]: (u[key] || 0) + 1,
    }));
  };

  const handleSelectSkin = (skinId: string) => {
    setActiveSkinId(skinId);
  };

  const handleOpenGarage = () => {
    previousStateRef.current = gameState;
    setGameState('GARAGE');
  };

  const handleCloseGarage = () => {
    const targetState = previousStateRef.current === 'HOME' ? 'HOME' : previousStateRef.current === 'PLAYING' ? 'PLAYING' : 'TITLE';
    setGameState(targetState);
  };

  const handleOpenHomeMenu = () => {
    previousStateRef.current = gameState;
    setGameState('HOME');
  };

  const handleBackToTitle = () => {
    setGameState('HOME');
    if (snowSceneRef.current) {
      snowSceneRef.current.restartLevel();
    }
  };

  const handleResetSave = () => {
    const fresh = saveManager.resetAllProgress();
    setSaveData(fresh);
    setCoins(fresh.coins);
    setUpgrades(fresh.upgrades);
    setActiveSkinId(fresh.activeSkinId);
    setLevelIndex(0);
    if (snowSceneRef.current) {
      snowSceneRef.current.restartLevel();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c131f] font-sans">
      {/* Isolated Three.js Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenGarage={handleOpenGarage}
          onOpenHomeMenu={handleOpenHomeMenu}
          onSelectLevel={(lvl) => {
            const idx = GAME_LEVELS.findIndex((l) => l.id === lvl.id);
            if (idx !== -1) {
              setLevelIndex(idx);
              setIsLoading(true);
            }
          }}
          levels={GAME_LEVELS}
          currentLevel={currentLevel}
          currentSkin={activeSkin}
          coins={coins}
        />
      )}

      {/* Dedicated Cozy Home Menu */}
      {gameState === 'HOME' && (
        <HomeMenu
          levels={GAME_LEVELS}
          currentLevel={currentLevel}
          saveData={saveData}
          activeSkin={activeSkin}
          onSelectLevel={(lvl) => {
            const idx = GAME_LEVELS.findIndex((l) => l.id === lvl.id);
            if (idx !== -1) {
              setLevelIndex(idx);
              setIsLoading(true);
            }
          }}
          onPlayGame={() => {
            synthAudio.ensureAudio();
            setIsLoading(true);
          }}
          onOpenGarage={handleOpenGarage}
          onResetSave={handleResetSave}
        />
      )}

      {/* In-Game World-Matched HUD */}
      {gameState === 'PLAYING' && (
        <GameHUD
          stats={activeStats}
          level={currentLevel}
          onPause={handlePause}
          onOpenGarage={handleOpenGarage}
          onRestart={handleRestart}
          onResetCar={handleResetCar}
          onVirtualKey={handleVirtualKey}
        />
      )}

      {/* Dynamic Animated Loading Screen */}
      {isLoading && (
        <LoadingScreen
          level={currentLevel}
          onFinish={handleLoadingFinish}
          durationMs={850}
        />
      )}

      {/* Garage Upgrades Modal (Does not send player back to start!) */}
      {gameState === 'GARAGE' && (
        <GarageModal
          upgrades={upgrades}
          skins={AVAILABLE_SKINS}
          activeSkinId={activeSkinId}
          coins={coins}
          townReputation={activeStats.overallTownReputation}
          onUpgrade={handleUpgrade}
          onSelectSkin={handleSelectSkin}
          onClose={handleCloseGarage}
        />
      )}

      {/* Pause & Victory Modals */}
      {(gameState === 'PAUSED' || gameState === 'VICTORY') && (
        <PauseVictoryModal
          isVictory={gameState === 'VICTORY'}
          stats={activeStats}
          level={currentLevel}
          hasNextLevel={levelIndex < GAME_LEVELS.length - 1}
          onResume={handleResume}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
          onOpenGarage={handleOpenGarage}
          onBackToTitle={handleBackToTitle}
          onResetCar={handleResetCar}
        />
      )}
    </div>
  );
}
