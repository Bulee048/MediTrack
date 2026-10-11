import { type Settings, DEFAULT_SETTINGS } from '../types';
const LOCAL_PREFERENCES_KEY = 'meditrack.localAccessibilityPreferences';
type LocalPreferences = Pick<Settings, 'textSize' | 'highContrast' | 'reducedMotion' | 'screenReader'>;
// Explicitly browser-local UI preferences. Account notification preferences are stored separately on the server.
export const localAccessibilityPreferences = {
  getSettings: async (): Promise<Settings> => {
    const raw = localStorage.getItem(LOCAL_PREFERENCES_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    let saved: Partial<LocalPreferences>;
    try { saved = JSON.parse(raw); } catch { return DEFAULT_SETTINGS; }
    return { ...DEFAULT_SETTINGS,
      textSize: saved && ['small', 'medium', 'large'].includes(saved.textSize ?? '') ? saved.textSize! : 'medium',
      highContrast: saved?.highContrast === true,
      reducedMotion: saved?.reducedMotion === true,
      screenReader: saved?.screenReader === true,
    };
  },
  updateSettings: async (patch: Partial<Settings>): Promise<Settings> => {
    if (Object.keys(patch).some(k => k !== 'textSize' && k !== 'highContrast' && k !== 'reducedMotion' && k !== 'screenReader'))
      throw new Error('This preference is not supported. Only accessibility preferences are stored locally.');
    const updated = { ...await localAccessibilityPreferences.getSettings(), ...patch };
    const local: LocalPreferences = { textSize: updated.textSize, highContrast: updated.highContrast, reducedMotion: updated.reducedMotion, screenReader: updated.screenReader };
    localStorage.setItem(LOCAL_PREFERENCES_KEY, JSON.stringify(local));
    return updated;
  },
};
