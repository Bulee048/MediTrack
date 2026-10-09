export interface Settings {
  userId: string;
  push: boolean;
  realtimeQueue: boolean;
  promo: boolean;
  reminder: '30m' | '1h' | '1d';
  textSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  language: string;
}

export const DEFAULT_SETTINGS: Settings = {
  userId: '',
  push: false,
  realtimeQueue: false,
  promo: false,
  reminder: '1h',
  textSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  language: 'English (United States)',
};
