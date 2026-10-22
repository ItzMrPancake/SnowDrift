export type GameState = 'TITLE' | 'HOME' | 'PLAYING' | 'PAUSED' | 'GARAGE' | 'VICTORY' | 'LEVEL_SELECT';

export type WeatherType = 'clear' | 'light_snow' | 'blizzard' | 'aurora';

export interface TownDistrict {
  id: string;
  name: string;
  icon: string;
  description: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  clearedPercent: number;
  reputation: number; // 0 to 100
  reputationTier: 'Neglected' | 'Neutral' | 'Respected' | 'Town Hero';
  payoutBonus: number; // multiplier e.g. 1.0 to 1.5
  urgentNotice?: string; // friendly citizen notice when low
}

export interface VehicleUpgrades {
  bladeWidth: number; // 1 to 5 (increases plow clearance width)
  engineSpeed: number; // 1 to 5 (top speed and acceleration)
  snowGrip: number; // 1 to 5 (handling, reduces sliding on ice)
  saltSpreader: number; // 0 to 4 (melts snow behind or in radius)
  boostTank: number; // 1 to 5 (boost capacity and recharge)
  heatedBlade?: number; // 0 to 3 (unlocked via high Town Reputation)
  blowerTurbine?: number; // 0 to 3 (unlocked via Town Hero status)
}

export interface VehicleSkin {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  bladeColor: string;
  unlocked: boolean;
  cost: number;
  requiredReputation?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  targetPercent: number;
  size: { width: number; length: number };
  snowDensity: 'light' | 'moderate' | 'blizzard';
  ambientMood: 'sunrise' | 'afternoon' | 'twilight' | 'night_aurora';
}

export interface ActiveGameStats {
  clearedPercent: number;
  totalSnowUnits: number;
  clearedUnits: number;
  combo: number;
  comboTimer: number;
  score: number;
  coinsEarned: number;
  boostFuel: number;
  maxBoostFuel: number;
  isBoosting: boolean;
  speed: number;
  elapsedTime: number;
  currentDistrictName: string;
  currentDistrictReputation: number;
  currentDistrictTier: string;
  overallTownReputation: number;
  activeWeather: WeatherType;
  weatherTimeRemaining: number;
  weatherNotification?: string;
}

export interface SaveGameData {
  version: number;
  coins: number;
  unlockedLevel: number;
  selectedLevelId: number;
  upgrades: VehicleUpgrades;
  activeSkinId: string;
  unlockedSkinIds: string[];
  districtReputations: { [districtId: string]: number };
  totalSnowMetersPlowed: number;
  highestCombo: number;
  highScore: number;
  lastSavedAt: number;
}
