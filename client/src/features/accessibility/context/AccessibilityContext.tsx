import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { type Settings, DEFAULT_SETTINGS } from '../types';
import { localAccessibilityPreferences } from '../api/accessibilityApi';

interface AccessibilityContextType {
  settings: Settings;
  loading: boolean;
  error: string;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  error: '',
  updateSettings: async () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

export function applyAccessibilityToDOM(settings: Settings) {
  // Apply font size
  const sizeMap: Record<Settings['textSize'], string> = {
    small: '14.5px',
    medium: '16px',
    large: '19px',
  };
  const size = sizeMap[settings.textSize] || '16px';
  document.documentElement.style.setProperty('--app-text-size', size);

  document.documentElement.toggleAttribute('data-reduced-motion', settings.reducedMotion);
  document.documentElement.toggleAttribute('data-high-contrast', settings.highContrast);
  // Apply high contrast
  if (settings.highContrast) {
    document.body.setAttribute('data-contrast', 'high');
    document.documentElement.classList.add('high-contrast');
  } else {
    document.body.removeAttribute('data-contrast');
    document.documentElement.classList.remove('high-contrast');
  }
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    localAccessibilityPreferences
      .getSettings()
      .then((s) => {
        setSettings(s);
        applyAccessibilityToDOM(s);
      })
      .catch((e) => { setError((e as Error).message); applyAccessibilityToDOM(DEFAULT_SETTINGS); })
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const updated = await localAccessibilityPreferences.updateSettings(patch);
    setSettings(updated);
    applyAccessibilityToDOM(updated);
  }, []);

  const value = useMemo(
    () => ({ settings, loading, error, updateSettings }),
    [settings, loading, error, updateSettings]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};
