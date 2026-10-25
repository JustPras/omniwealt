import React from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/tokens';

interface AmbientBackgroundProps {
  scrollY?: Animated.Value;
  activeAssetClass?: 'CASH' | 'STOCK' | 'STOCKS' | 'CRYPTO' | 'ALL' | null;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  scrollY,
  activeAssetClass = 'ALL',
}) => {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();

  // Parallax translation: 0.25x scroll speed per DESIGN.md
  const parallaxY1 = scrollY
    ? scrollY.interpolate({
        inputRange: [-200, 0, 400],
        outputRange: [50, 0, -100],
        extrapolate: 'clamp',
      })
    : null;

  const parallaxY2 = scrollY
    ? scrollY.interpolate({
        inputRange: [-200, 0, 400],
        outputRange: [-50, 0, 100],
        extrapolate: 'clamp',
      })
    : null;

  const isTintBoosted = activeAssetClass === 'STOCK' || activeAssetClass === 'STOCKS' || activeAssetClass === 'CRYPTO';

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: theme.canvas },
      ]}
      pointerEvents="none"
    >
      {/* 1. Top light source (from theme.lights[0] or topLeft) */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: -height * 0.1,
            left: -width * 0.15,
            width: width * 0.9,
            height: width * 0.9,
            transform: parallaxY1 ? [{ translateY: parallaxY1 }] : undefined,
          },
        ]}
      >
        <LinearGradient
          colors={[
            theme.lights[1] ? `rgba(245, 245, 247, ${theme.lights[1].alpha})` : 'rgba(255, 255, 255, 0.08)',
            'transparent',
          ]}
          style={styles.gradientFill}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
        />
      </Animated.View>

      {/* 2. Interactive Tint / Blue light source (bottom-right / behind allocation bar) */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: height * 0.38,
            right: -width * 0.2,
            width: width * 1.05,
            height: width * 1.05,
            transform: parallaxY2 ? [{ translateY: parallaxY2 }] : undefined,
          },
        ]}
      >
        <LinearGradient
          colors={[
            isTintBoosted
              ? 'rgba(0, 122, 255, 0.22)'
              : `rgba(0, 122, 255, ${theme.lights[0].alpha * 0.6})`,
            'transparent',
          ]}
          style={styles.gradientFill}
          start={{ x: 0.8, y: 0.2 }}
          end={{ x: 0.1, y: 0.85 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
});
