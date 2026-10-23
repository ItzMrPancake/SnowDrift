import { DailyChallenge, WeatherType } from '../types/game';

// Simple deterministic hash from string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DISTRICT_NAMES: { [id: number]: string } = {
  1: 'Sugar Pine Cul-de-Sac',
  2: 'Alpine Village Pass',
  3: 'Blizzard Boulevard',
};

export function getDailyChallenge(completedDate?: string): DailyChallenge {
  const dateStr = getTodayDateString();
  const seed = hashString(dateStr);

  const levelId = (seed % 3) + 1;
  const levelName = DISTRICT_NAMES[levelId] || 'Sugar Pine Cul-de-Sac';

  const conditionType = seed % 3; // 0: Blizzard challenge, 1: Speed blitz, 2: Deep snow threshold

  let title = '';
  let description = '';
  let targetPercent = 75;
  let requiredWeather: WeatherType | undefined = undefined;
  let timeLimitSeconds: number | undefined = undefined;
  let rewardCoins = 300;

  if (conditionType === 0) {
    title = 'Blizzard Protocol';
    description = `Clear at least 70% of ${levelName} roads during harsh blizzard storms!`;
    targetPercent = 70;
    requiredWeather = 'blizzard';
    rewardCoins = 350;
  } else if (conditionType === 1) {
    title = 'Morning Commute Rush';
    description = `Clear 65% of ${levelName} before commuters depart (under 130s)!`;
    targetPercent = 65;
    timeLimitSeconds = 130;
    rewardCoins = 300;
  } else {
    title = 'Grand Thoroughfare Sweep';
    description = `Achieve a pristine 82% road clearance in ${levelName}!`;
    targetPercent = 82;
    rewardCoins = 400;
  }

  const isCompleted = completedDate === dateStr;

  return {
    id: `challenge-${dateStr}`,
    dateString: dateStr,
    title,
    description,
    levelId,
    levelName,
    targetPercent,
    requiredWeather,
    timeLimitSeconds,
    rewardCoins,
    isCompleted,
  };
}
