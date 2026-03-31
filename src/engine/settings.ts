/**
 * Game settings — persisted in localStorage.
 */

const SETTINGS_KEY = 'summoners-grid-settings';

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  colorBlindMode: boolean;
  showMinimap: boolean;
  showFloatingNumbers: boolean;
  showTurnBanners: boolean;
  gameSpeed: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  colorBlindMode: false,
  showMinimap: true,
  showFloatingNumbers: true,
  showTurnBanners: true,
  gameSpeed: 500,
};

let cachedSettings: GameSettings = { ...DEFAULT_SETTINGS };

export function getSettings(): GameSettings {
  if (cachedSettings !== DEFAULT_SETTINGS) return cachedSettings;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } else {
      cachedSettings = { ...DEFAULT_SETTINGS };
    }
  } catch {
    cachedSettings = { ...DEFAULT_SETTINGS };
  }

  return cachedSettings;
}

export function updateSettings(partial: Partial<GameSettings>): GameSettings {
  const current = getSettings();
  const updated = { ...current, ...partial };
  cachedSettings = updated;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }

  // Apply color blind mode
  document.body.classList.toggle('colorblind-mode', updated.colorBlindMode);

  return updated;
}

export function isSoundEnabled(): boolean {
  return getSettings().soundEnabled;
}
