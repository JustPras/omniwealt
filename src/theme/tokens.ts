import { Platform } from 'react-native';

export const color = {
  obsidian: '#080C14',
  glassFill: 'rgba(15,23,42,0.55)',
  glassFillRaised: 'rgba(15,23,42,0.72)',
  glassFillInset: 'rgba(255,255,255,0.04)',
  rim: 'rgba(255,255,255,0.10)',
  rimStrong: 'rgba(255,255,255,0.22)',
  hairline: 'rgba(255,255,255,0.06)',

  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textFaint: '#64748B', // hanya ikon atau teks >= 18px

  accent: '#E8C46A', // champagne
  accentSoft: 'rgba(232,196,106,0.14)',
  accentRim: 'rgba(232,196,106,0.32)',
  onAccent: '#1A1405',

  gain: '#10B981',
  loss: '#F43F5E',
  asset: {
    cash: '#CBD5E1',
    stock: '#38BDF8',
    crypto: '#A78BFA',
  },
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;
// radius dalam = radius luar dikurangi padding

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  row: 8,
  group: 16,
  section: 28,
} as const;

export const shadow = {
  e1: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  e2: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  count: 450,
  spring: {
    press: { tension: 220, friction: 16 },
    settle: { tension: 120, friction: 12 },
  },
} as const;

export const font = {
  ui: Platform.select({ ios: 'System', default: 'sans-serif' }),
  uiSemi: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  uiBold: Platform.select({ ios: 'System', default: 'sans-serif' }),
  num: Platform.select({ ios: 'System', default: 'sans-serif' }),
} as const;

export const fontWeights = {
  ui: '500' as const,
  uiSemi: '600' as const,
  uiBold: '700' as const,
  num: '800' as const,
};
