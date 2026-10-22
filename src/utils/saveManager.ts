import { SaveGameData, VehicleUpgrades } from '../types/game';

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
};

class SaveManager {
  private currentSave: SaveGameData = { ...DEFAULT_SAVE_DATA };

  constructor() {
    this.load();
  }

  public load(): SaveGameData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
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
    try {
      this.currentSave = {
        ...this.currentSave,
        ...partial,
        lastSavedAt: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.currentSave));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  public resetAllProgress(): SaveGameData {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
    this.currentSave = { ...DEFAULT_SAVE_DATA };
    this.save(this.currentSave);
    return this.currentSave;
  }
}

export const saveManager = new SaveManager();
