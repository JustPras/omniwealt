import { useColorScheme, Platform, TextStyle } from 'react-native';
import { Colors } from './colors';

export { Colors };

export const themes = {
  light: {
    canvas: Colors.palette.appleBg, // #F5F5F7
    text: Colors.palette.appleInk, // #1D1D1F
    textMuted: Colors.palette.appleMuted, // #AAAAAA
    textFaint: '#BBBBBF',
    tint: Colors.palette.appleBlue, // #007AFF
    tintText: '#0066CC',
    onTint: '#FFFFFF',
    glass: {
      frost: 'rgba(255, 255, 255, 0.72)',
      lens: 'rgba(255, 255, 255, 0.52)',
      inset: 'rgba(228, 228, 234, 0.65)',
      tint: 'rgba(0, 122, 255, 0.88)',
    },
    rim: {
      hi: 'rgba(255, 255, 255, 0.95)',
      mid: 'rgba(255, 255, 255, 0.45)',
      lo: 'rgba(0, 122, 255, 0.35)',
    },
    hairline: 'rgba(29, 29, 31, 0.08)',
    gain: '#007AFF',
    loss: '#FF3B30',
    asset: {
      cash: Colors.palette.appleMuted,
      stock: Colors.palette.appleInk,
      crypto: Colors.palette.appleBlue,
    },
    lights: [
      { color: Colors.palette.appleBlue, alpha: 0.18, at: 'topLeft' },
      { color: Colors.palette.appleMuted, alpha: 0.22, at: 'bottomRight' },
    ],
    elev: { e1: 0.08, e2: 0.14 },
  },
  dark: {
    canvas: Colors.palette.appleInk, // #1D1D1F
    text: Colors.palette.appleBg, // #F5F5F7
    textMuted: Colors.palette.appleMuted, // #AAAAAA
    textFaint: '#6E6E73',
    tint: Colors.palette.appleBlue, // #007AFF
    tintText: '#0A84FF',
    onTint: '#FFFFFF',
    glass: {
      frost: 'rgba(46, 46, 50, 0.75)',
      lens: 'rgba(29, 29, 31, 0.70)',
      inset: 'rgba(255, 255, 255, 0.06)',
      tint: 'rgba(0, 122, 255, 0.82)',
    },
    rim: {
      hi: 'rgba(255, 255, 255, 0.70)',
      mid: 'rgba(255, 255, 255, 0.16)',
      lo: 'rgba(0, 122, 255, 0.60)',
    },
    hairline: 'rgba(255, 255, 255, 0.10)',
    gain: '#30D158',
    loss: '#FF453A',
    asset: {
      cash: Colors.palette.appleMuted,
      stock: Colors.palette.appleBg,
      crypto: '#FF9F0A',
    },
    lights: [
      { color: Colors.palette.appleBlue, alpha: 0.30, at: 'bottomRight' },
      { color: Colors.palette.appleBg, alpha: 0.08, at: 'topLeft' },
    ],
    elev: { e1: 0.28, e2: 0.42 },
  },
} as const;

export type Theme = (typeof themes)['light'] | (typeof themes)['dark'];

export const useTheme = (): Theme => {
  const scheme = useColorScheme();
  return scheme === 'light' ? themes.light : themes.dark;
};

// Default active theme based on dark/light
const activeTheme = themes.dark;

export const color = {
  obsidian: Colors.palette.appleInk,
  canvas: activeTheme.canvas,
  text: activeTheme.text,
  textMuted: Colors.palette.appleMuted,
  textFaint: activeTheme.textFaint,

  tint: Colors.palette.appleBlue,
  tintText: activeTheme.tintText,
  onTint: activeTheme.onTint,

  // Apple Modern palette direct access
  appleBg: Colors.palette.appleBg,
  appleInk: Colors.palette.appleInk,
  appleMuted: Colors.palette.appleMuted,
  appleBlue: Colors.palette.appleBlue,

  // Accent mappings
  accent: Colors.palette.appleBlue,
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
  lg: 20,
  xl: 24, // Card container radius per DESIGN.md Section 4.1
  pill: 9999, // Pill & capsule buttons per DESIGN.md Section 4.1
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
    shadowColor: Colors.palette.appleInk,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  e2: {
    shadowColor: Colors.palette.appleInk,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  azure: {
    shadowColor: Colors.palette.appleBlue,
    shadowOpacity: 0.40,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;

export const motion = {
  fast: 110,
  base: 200,
  slow: 320,
  morph: 320,
  bloom: 420,
  count: 450,
  spring: {
    press: { tension: 160, friction: 4 }, // per DESIGN.md Section 5.1
    settle: { tension: 160, friction: 4 },
    segment: { damping: 14, stiffness: 150, mass: 0.8 }, // per DESIGN.md Section 5.2
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
  extraBold: '800' as const,
};

// Typography hierarchy per DESIGN.md Section 3
export const typography: Record<string, TextStyle> = {
  heroNetWorth: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Colors.palette.appleInk,
    fontVariant: ['tabular-nums'],
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Colors.palette.appleInk,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: Colors.palette.appleInk,
  },
  bodyStrong: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
    color: Colors.palette.appleInk,
    fontVariant: ['tabular-nums'],
  },
  captionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: Colors.palette.appleMuted,
  },
  microBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.palette.appleBlue,
  },
};
