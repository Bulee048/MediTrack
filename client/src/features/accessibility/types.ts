export interface Settings {
  userId: string;
  push: boolean;
  realtimeQueue: boolean;
  promo: boolean;
  reminder: '30m' | '1h' | '1d';
  textSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  screenReader: boolean;
  language: string;
}

export const DEFAULT_SETTINGS: Settings = {
  userId: 'patient-default',
  push: true,
  realtimeQueue: true,
  promo: false,
  reminder: '1h',
  textSize: 'medium',
  highContrast: false,
  screenReader: true,
  language: 'English (United States)',
};
