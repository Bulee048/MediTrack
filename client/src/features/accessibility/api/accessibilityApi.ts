import { type Settings, DEFAULT_SETTINGS } from '../types';
const LOCAL_PREFERENCES_KEY = 'meditrack.localAccessibilityPreferences';
type LocalPreferences = Pick<Settings, 'textSize' | 'highContrast' | 'reducedMotion'>;
// Explicitly browser-local UI preferences. There is no settings API or account sync.
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
    };
  },
  updateSettings: async (patch: Partial<Settings>): Promise<Settings> => {
    if (Object.keys(patch).some(k => k !== 'textSize' && k !== 'highContrast' && k !== 'reducedMotion'))
      throw new Error('This preference is not supported. Only text size, contrast and reduced motion are stored locally.');
    const updated = { ...await localAccessibilityPreferences.getSettings(), ...patch };
    const local: LocalPreferences = { textSize: updated.textSize, highContrast: updated.highContrast, reducedMotion: updated.reducedMotion };
    localStorage.setItem(LOCAL_PREFERENCES_KEY, JSON.stringify(local));
    return updated;
  },
};
