import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated, Easing, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, isDarkTheme } from '../../theme/tokens';

const wallpaperNight = require('../../../assets/wallpapers/wallpaper-night.jpg');
const wallpaperDay = require('../../../assets/wallpapers/wallpaper-day.jpg');

interface AmbientBackgroundProps {
  scrollY?: Animated.Value;
  activeAssetClass?: 'CASH' | 'STOCK' | 'STOCKS' | 'CRYPTO' | 'ALL' | null;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = React.memo(({
  scrollY,
}) => {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const isDark = isDarkTheme(theme);

  // Slow ambient floating animation for orbs per DESIGN.md Section 4.2
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  // Parallax translation with scroll
  const parallaxY1 = React.useMemo(() => {
    return scrollY
      ? scrollY.interpolate({
          inputRange: [-200, 0, 400],
          outputRange: [30, 0, -60],
          extrapolate: 'clamp',
        })
      : null;
  }, [scrollY]);

  const parallaxY2 = React.useMemo(() => {
    return scrollY
      ? scrollY.interpolate({
          inputRange: [-200, 0, 400],
          outputRange: [-20, 0, 40],
          extrapolate: 'clamp',
        })
      : null;
  }, [scrollY]);

  const floatY1 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const floatY2 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
      ]}
      pointerEvents="none"
    >
      {/* 1. Dynamic Wallpaper (Night vs Day Japanese Anime Scenery) */}
      <Image
        source={isDark ? wallpaperNight : wallpaperDay}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFill,
          styles.wallpaper,
          Platform.OS === 'web' && ({
            imageRendering: '-webkit-optimize-contrast',
            filter: 'contrast(1.05) brightness(1.02)',
          } as any),
        ]}
      />

      {/* 2. Orb 1 (Top-Left Accent Glow) */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: -40,
            left: -40,
            width: 260,
            height: 260,
            borderRadius: 130,
            transform: [
              ...(parallaxY1 ? [{ translateY: parallaxY1 }] : []),
              { translateY: floatY1 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            isDark ? 'rgba(0, 122, 255, 0.20)' : 'rgba(0, 122, 255, 0.10)',
            'transparent',
          ]}
          style={styles.gradientFill}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
        />
      </Animated.View>

      {/* 3. Orb 2 (Mid-Right Soft Shimmer) */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: height * 0.35,
            right: -60,
            width: 280,
            height: 280,
            borderRadius: 140,
            transform: [
              ...(parallaxY2 ? [{ translateY: parallaxY2 }] : []),
              { translateY: floatY2 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.18)',
            'transparent',
          ]}
          style={styles.gradientFill}
          start={{ x: 0.8, y: 0.2 }}
          end={{ x: 0.1, y: 0.85 }}
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    zIndex: 0,
  },
  wallpaper: {
    width: '100%',
    height: '100%',
  },
  orb: {
    position: 'absolute',
    overflow: 'hidden',
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
});
