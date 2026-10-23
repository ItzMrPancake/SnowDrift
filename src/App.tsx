import { GraphicsSettings, SaveGameData, VehicleUpgrades } from '../types/game';

const SAVE_KEY = 'snowdrift_save_v1';

export const DEFAULT_UPGRADES: VehicleUpgrades = {
  bladeWidth: 1,
  engineSpeed: 1,
  snowGrip: 1,
  saltSpreader: 0,
  boostTank: 1,
  heatedBlade: 0,
  blowerTurbine: 0,
};

export const DEFAULT_GRAPHICS_SETTINGS: GraphicsSettings = {
  resolution: '1080p',
  targetFps: 60,
  shadows: 'medium',
  snowParticles: 'medium',
  bloomAndGlow: true,
  vSync: true,
};

export const DEFAULT_SAVE_DATA: SaveGameData = {
  version: 1,
  coins: 60,
  unlockedLevel: 1,
  selectedLevelId: 1,
  upgrades: DEFAULT_UPGRADES,
  activeSkinId: 'nordic_yellow',
  unlockedSkinIds: ['nordic_yellow'],
  districtReputations: {
    maple_residential: 50,
    town_center: 50,
    clinic_route: 50,
    pine_overlook: 50,
  },
  totalSnowMetersPlowed: 0,
  highestCombo: 1,
  highScore: 0,
  lastSavedAt: Date.now(),
  graphicsSettings: DEFAULT_GRAPHICS_SETTINGS,
  dailyChallengeCompletedDate: '',
  mobileControlsForced: false,
};

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

class SaveManager {
  private currentSave: SaveGameData = { ...DEFAULT_SAVE_DATA };

  constructor() {
    this.load();
  }

  public load(): SaveGameData {
    const storage = getStorage();
    if (!storage) {
      this.currentSave = { ...DEFAULT_SAVE_DATA };
      return this.currentSave;
    }

    try {
      const raw = storage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.currentSave = {
          ...DEFAULT_SAVE_DATA,
          ...parsed,
          upgrades: {
            ...DEFAULT_UPGRADES,
            ...(parsed.upgrades || {}),
          },
          districtReputations: {
            ...DEFAULT_SAVE_DATA.districtReputations,
            ...(parsed.districtReputations || {}),
          },
        };
        return this.currentSave;
      }
    } catch (e) {
      console.warn('Failed to load save from localStorage:', e);
    }
    this.currentSave = { ...DEFAULT_SAVE_DATA };
    return this.currentSave;
  }

  public getSave(): SaveGameData {
    return this.currentSave;
  }

  public save(partial: Partial<SaveGameData>) {
    const storage = getStorage();
    if (!storage) return;

    try {
      this.currentSave = {
        ...this.currentSave,
        ...partial,
        lastSavedAt: Date.now(),
      };
      storage.setItem(SAVE_KEY, JSON.stringify(this.currentSave));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  public resetAllProgress(): SaveGameData {
    const storage = getStorage();
    try {
      storage?.removeItem(SAVE_KEY);
    } catch {}
    this.currentSave = { ...DEFAULT_SAVE_DATA };
    this.save(this.currentSave);
    return this.currentSave;
  }
}

export const saveManager = new SaveManager();
