import { useColorScheme, Platform } from 'react-native';

export const themes = {
  light: {
    canvas: '#F5F5F7',
    text: '#1D1D1F',
    textMuted: '#6E6E73',
    textFaint: '#AAAAAA',
    tint: '#007AFF',
    tintText: '#0066CC', // tautan dan teks biru
    onTint: '#FFFFFF',
    glass: {
      frost: 'rgba(255,255,255,0.62)', // kartu konten
      lens: 'rgba(255,255,255,0.48)', // hero, tab bar, sheet, tombol melayang
      inset: 'rgba(29,29,31,0.05)', // input, chip, segmen di dalam kartu
      tint: 'rgba(0,122,255,0.88)', // tombol utama, kapsul aktif
    },
    rim: {
      hi: 'rgba(255,255,255,0.95)',
      mid: 'rgba(255,255,255,0.35)',
      lo: 'rgba(0,122,255,0.35)',
    },
    hairline: 'rgba(29,29,31,0.08)',
    gain: '#1E7A37',
    loss: '#D70015',
    asset: {
      cash: '#AAAAAA',
      stock: '#1D1D1F',
      crypto: '#FF9500',
    },
    lights: [
      { color: '#007AFF', alpha: 0.16, at: 'topLeft' },
      { color: '#AAAAAA', alpha: 0.22, at: 'bottomRight' },
    ],
    elev: { e1: 0.1, e2: 0.16 }, // opacity shadow hitam
  },
  dark: {
    canvas: '#1D1D1F',
    text: '#F5F5F7',
    textMuted: '#AAAAAA',
    textFaint: '#6E6E73',
    tint: '#007AFF',
    tintText: '#0A84FF',
    onTint: '#FFFFFF',
    glass: {
      frost: 'rgba(245,245,247,0.07)',
      lens: 'rgba(245,245,247,0.12)',
      inset: 'rgba(245,245,247,0.06)',
      tint: 'rgba(0,122,255,0.80)',
    },
    rim: {
      hi: 'rgba(245,245,247,0.70)',
      mid: 'rgba(245,245,247,0.14)',
      lo: 'rgba(0,122,255,0.60)',
    },
    hairline: 'rgba(245,245,247,0.08)',
    gain: '#30D158',
    loss: '#FF453A',
    asset: {
      cash: '#AAAAAA',
      stock: '#F5F5F7',
      crypto: '#FF9F0A',
    },
    lights: [
      { color: '#007AFF', alpha: 0.35, at: 'bottomRight' },
      { color: '#F5F5F7', alpha: 0.08, at: 'topLeft' },
    ],
    elev: { e1: 0.28, e2: 0.42 },
  },
} as const;

export type Theme = (typeof themes)['light'] | (typeof themes)['dark'];

export const useTheme = (): Theme => {
  const scheme = useColorScheme();
  return scheme === 'light' ? themes.light : themes.dark;
};

// Default static active theme (dark as core default, matching app.json background)
const activeTheme = themes.dark;

// Unified color exports for seamless compatibility with DESIGN.md
export const color = {
  obsidian: activeTheme.canvas,
  canvas: activeTheme.canvas,
  text: activeTheme.text,
  textMuted: activeTheme.textMuted,
  textFaint: activeTheme.textFaint,

  tint: activeTheme.tint,
  tintText: activeTheme.tintText,
  onTint: activeTheme.onTint,

  // Apple Modern accent mappings
  accent: activeTheme.tint, // #007AFF
  accentSoft: activeTheme.glass.inset,
  accentRim: activeTheme.rim.mid,
  onAccent: activeTheme.onTint,

  glassFill: activeTheme.glass.frost,
  glassFillRaised: activeTheme.glass.lens,
  glassFillInset: activeTheme.glass.inset,
  rim: activeTheme.rim.mid,
  rimStrong: activeTheme.rim.hi,
  hairline: activeTheme.hairline,

  gain: activeTheme.gain,
  loss: activeTheme.loss,
  asset: activeTheme.asset,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

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
    shadowOpacity: activeTheme.elev.e1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  e2: {
    shadowColor: '#000',
    shadowOpacity: activeTheme.elev.e2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  morph: 320,
  bloom: 420,
  count: 450,
  spring: {
    press: { tension: 220, friction: 12 },
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
  ui: '400' as const,
  uiSemi: '600' as const,
  uiBold: '700' as const,
  num: '700' as const,
};
