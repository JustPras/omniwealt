import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme, Platform, TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './colors';

export { Colors };

export const themes = {
  light: {
    id: 'light',
    canvas: Colors.palette.canvas, // OLED Warm Carbon
    text: Colors.palette.alabasterWhite, // #F5F3EF
    textMuted: Colors.palette.naturalTitanium, // #A39E93
    textFaint: Colors.palette.darkPewter, // #57534E
    textSecondary: Colors.palette.naturalTitanium,
    tint: Colors.palette.champagneGold, // #D4AF37
    tintText: Colors.palette.champagneGoldLight,
    onTint: '#0A0A09',
    glass: {
      frost: 'rgba(245, 243, 239, 0.05)',
      lens: 'rgba(245, 243, 239, 0.02)',
      inset: 'rgba(20, 20, 18, 0.75)',
      tint: 'rgba(212, 175, 55, 0.25)',
    },
    rim: {
      hi: 'rgba(212, 175, 55, 0.45)',
      mid: 'rgba(255, 255, 255, 0.16)',
      lo: 'rgba(255, 255, 255, 0.05)',
    },
    hairline: 'rgba(255, 255, 255, 0.08)',
    dividerDashed: 'rgba(255, 255, 255, 0.10)',
    gain: Colors.palette.sovereignJade, // #2EBD85
    loss: Colors.palette.terracottaRose, // #E15241
    asset: {
      cash: Colors.palette.titaniumSilver, // #94A3B8
      stock: Colors.palette.champagneGold, // #D4AF37
      crypto: Colors.palette.burnishedCopper, // #E07A5F
      rdn: Colors.palette.sovereignJade, // #2EBD85
    },
    dockIcon: Colors.palette.alabasterWhite,
    liquidGlass: {
      blur: 3,
      specularGloss: 0.85,
      rim: 0.85,
      tint: 0.03,
    },
    lights: [
      { color: Colors.palette.champagneGold, alpha: 0.12, at: 'topLeft' },
      { color: '#FFFFFF', alpha: 0.06, at: 'bottomRight' },
    ],
    elev: { e1: 0.08, e2: 0.14 },
  },
  dark: {
    id: 'dark',
    canvas: Colors.palette.canvas, // OLED Warm Carbon #0A0A09
    text: Colors.palette.alabasterWhite, // #F5F3EF
    textMuted: Colors.palette.naturalTitanium, // #A39E93
    textFaint: Colors.palette.darkPewter, // #57534E
    textSecondary: Colors.palette.naturalTitanium,
    tint: Colors.palette.champagneGold, // #D4AF37
    tintText: Colors.palette.champagneGoldLight,
    onTint: '#0A0A09',
    glass: {
      frost: 'rgba(245, 243, 239, 0.04)',
      lens: 'rgba(245, 243, 239, 0.015)',
      inset: 'rgba(20, 20, 18, 0.85)',
      tint: 'rgba(212, 175, 55, 0.20)',
    },
    rim: {
      hi: 'rgba(212, 175, 55, 0.40)',
      mid: 'rgba(255, 255, 255, 0.14)',
      lo: 'rgba(255, 255, 255, 0.03)',
    },
    hairline: 'rgba(255, 255, 255, 0.08)',
    dividerDashed: 'rgba(255, 255, 255, 0.10)',
    gain: Colors.palette.sovereignJade, // #2EBD85
    loss: Colors.palette.terracottaRose, // #E15241
    asset: {
      cash: Colors.palette.titaniumSilver, // #94A3B8
      stock: Colors.palette.champagneGold, // #D4AF37
      crypto: Colors.palette.burnishedCopper, // #E07A5F
      rdn: Colors.palette.sovereignJade, // #2EBD85
    },
    dockIcon: Colors.palette.alabasterWhite,
    liquidGlass: {
      blur: 3,
      specularGloss: 0.70,
      rim: 0.58,
      tint: 0.03,
    },
    lights: [
      { color: Colors.palette.champagneGold, alpha: 0.15, at: 'topLeft' },
      { color: '#FFFFFF', alpha: 0.04, at: 'bottomRight' },
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
  obsidian: Colors.palette.canvas,
  canvas: Colors.palette.canvas,
  elevated: Colors.palette.elevated,
  text: Colors.palette.alabasterWhite,
  textMuted: Colors.palette.naturalTitanium,
  textFaint: Colors.palette.darkPewter,

  tint: Colors.palette.champagneGold,
  tintText: activeTheme.tintText,
  onTint: activeTheme.onTint,

  // Warm Titanium & Champagne palette direct access
  champagne: Colors.palette.champagneGold,
  champagneLight: Colors.palette.champagneGoldLight,
  champagneDark: Colors.palette.champagneGoldDark,
  jade: Colors.palette.sovereignJade,
  terracotta: Colors.palette.terracottaRose,
  titanium: Colors.palette.naturalTitanium,
  basalt: Colors.palette.elevated,

  appleBg: Colors.palette.canvas,
  appleInk: Colors.palette.alabasterWhite,
  appleMuted: Colors.palette.naturalTitanium,
  appleBlue: Colors.palette.champagneGold,

  // Accent mappings
  accent: Colors.palette.champagneGold,
  accentSoft: activeTheme.glass.inset,
  accentRim: activeTheme.rim.hi,
  onAccent: activeTheme.onTint,

  glassFill: activeTheme.glass.frost,
  glassFillRaised: activeTheme.glass.lens,
  glassFillInset: activeTheme.glass.inset,
  rim: activeTheme.rim.mid,
  rimStrong: activeTheme.rim.hi,
  hairline: activeTheme.hairline,
  dividerDashed: activeTheme.dividerDashed,

  gain: activeTheme.gain,
  loss: activeTheme.loss,
  asset: activeTheme.asset,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24, // Card container radius
  pill: 9999, // Pill & capsule buttons
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
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  e2: {
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  gold: {
    shadowColor: Colors.palette.champagneGold,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  azure: {
    shadowColor: Colors.palette.champagneGold,
    shadowOpacity: 0.35,
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
    press: { tension: 160, friction: 4 },
    settle: { tension: 160, friction: 4 },
    segment: { damping: 14, stiffness: 150, mass: 0.8 },
  },
} as const;

export const font = {
  ui: Platform.select({ ios: 'Plus Jakarta Sans', default: 'sans-serif' }),
  uiSemi: Platform.select({ ios: 'Plus Jakarta Sans', default: 'sans-serif-medium' }),
  uiBold: Platform.select({ ios: 'Plus Jakarta Sans', default: 'sans-serif' }),
  num: Platform.select({ ios: 'JetBrains Mono', default: 'monospace' }),
  mono: Platform.select({ ios: 'JetBrains Mono', default: 'monospace' }),
} as const;

export const fontWeights = {
  ui: '400' as const,
  uiSemi: '600' as const,
  uiBold: '700' as const,
  num: '700' as const,
  extraBold: '800' as const,
};

// Typography hierarchy with strict tabular-nums per DESIGN_SYSTEM.md
export const typography: Record<string, TextStyle> = {
  heroNetWorth: {
    fontFamily: font.num,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: Colors.palette.alabasterWhite,
    fontVariant: ['tabular-nums'],
  },
  screenTitle: {
    fontFamily: font.ui,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: Colors.palette.alabasterWhite,
  },
  cardTitle: {
    fontFamily: font.ui,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: Colors.palette.alabasterWhite,
  },
  bodyStrong: {
    fontFamily: font.num,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: Colors.palette.alabasterWhite,
    fontVariant: ['tabular-nums'],
  },
  captionLabel: {
    fontFamily: font.ui,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: Colors.palette.naturalTitanium,
  },
  microBadge: {
    fontFamily: font.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Colors.palette.champagneGold,
  },
};
