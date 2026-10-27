import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme, Platform, TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './colors';

export { Colors };

export const themes = {
  light: {
    id: 'light',
    canvas: 'transparent',
    text: '#0F172A', // Deep dark obsidian ink (High-contrast for daytime)
    textMuted: '#334155', // Slate 700
    textFaint: '#64748B', // Slate 500
    textSecondary: '#334155',
    tint: Colors.palette.appleBlue, // #007AFF
    tintText: '#0066CC',
    onTint: '#FFFFFF',
    glass: {
      frost: 'rgba(255, 255, 255, 0.40)',
      lens: 'rgba(255, 255, 255, 0.20)',
      inset: 'rgba(255, 255, 255, 0.65)',
      tint: 'rgba(0, 122, 255, 0.88)',
    },
    rim: {
      hi: 'rgba(255, 255, 255, 0.95)',
      mid: 'rgba(255, 255, 255, 0.85)',
      lo: 'rgba(255, 255, 255, 0.60)',
    },
    hairline: 'rgba(15, 23, 42, 0.15)',
    gain: '#16A34A',
    loss: '#DC2626',
    asset: {
      cash: '#334155',
      stock: '#0F172A',
      crypto: Colors.palette.appleBlue,
    },
    dockIcon: '#0F172A',
    liquidGlass: {
      blur: 3,
      specularGloss: 0.85,
      rim: 0.85,
      tint: 0.03,
    },
    lights: [
      { color: Colors.palette.appleBlue, alpha: 0.10, at: 'topLeft' },
      { color: '#FFFFFF', alpha: 0.15, at: 'bottomRight' },
    ],
    elev: { e1: 0.08, e2: 0.14 },
  },
  dark: {
    id: 'dark',
    canvas: 'transparent',
    text: '#FFFFFF', // Pure crisp white (Glowing for nighttime)
    textMuted: 'rgba(255, 255, 255, 0.75)',
    textFaint: 'rgba(255, 255, 255, 0.50)',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    tint: Colors.palette.appleBlue, // #007AFF
    tintText: '#0A84FF',
    onTint: '#FFFFFF',
    glass: {
      frost: 'rgba(255, 255, 255, 0.05)',
      lens: 'rgba(255, 255, 255, 0.03)',
      inset: 'rgba(0, 0, 0, 0.45)',
      tint: 'rgba(0, 122, 255, 0.82)',
    },
    rim: {
      hi: 'rgba(255, 255, 255, 0.70)',
      mid: 'rgba(255, 255, 255, 0.58)',
      lo: 'rgba(255, 255, 255, 0.25)',
    },
    hairline: 'rgba(255, 255, 255, 0.12)',
    gain: '#30D158',
    loss: '#FF453A',
    asset: {
      cash: 'rgba(255, 255, 255, 0.75)',
      stock: '#FFFFFF',
      crypto: '#FF9F0A',
    },
    dockIcon: '#FFFFFF',
    liquidGlass: {
      blur: 3,
      specularGloss: 0.70,
      rim: 0.58,
      tint: 0.03,
    },
    lights: [
      { color: Colors.palette.appleBlue, alpha: 0.20, at: 'bottomRight' },
      { color: '#FFFFFF', alpha: 0.05, at: 'topLeft' },
    ],
    elev: { e1: 0.28, e2: 0.42 },
  },
} as const;

export type Theme = (typeof themes)['light'] | (typeof themes)['dark'];
export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeContextType {
  themeMode: ThemeMode;
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = '@omniwealth_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  theme: themes.dark,
  isDark: true,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setThemeModeState(saved as ThemeMode);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark';
  const theme = isDark ? themes.dark : themes.light;

  return React.createElement(
    ThemeContext.Provider,
    { value: { themeMode, theme, isDark, toggleTheme, setThemeMode } },
    children
  );
};

export const isDarkTheme = (theme: Theme): boolean => {
  return (theme as any).id === 'dark';
};

export const useTheme = (): Theme => {
  const ctx = useContext(ThemeContext);
  if (ctx && ctx.theme) {
    return ctx.theme;
  }
  return themes.dark;
};

export const useThemeController = (): ThemeContextType => {
  return useContext(ThemeContext);
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
