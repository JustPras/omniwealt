import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color } from '../../theme/tokens';

interface AmbientBackgroundProps {
  scrollY?: Animated.Value;
  activeAssetClass?: 'CASH' | 'STOCK' | 'STOCKS' | 'CRYPTO' | 'ALL' | null;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  scrollY,
  activeAssetClass = 'ALL',
}) => {
  const { width, height } = useWindowDimensions();

  // Dynamic color transition for cool source based on selected asset class
  const targetCoolColor =
    activeAssetClass === 'CASH'
      ? color.asset.cash
      : activeAssetClass === 'STOCK' || activeAssetClass === 'STOCKS'
      ? color.asset.stock
      : activeAssetClass === 'CRYPTO'
      ? color.asset.crypto
      : color.asset.stock; // default cool is sky

  // Parallax translation: 0.25x scroll speed
  const parallaxY = scrollY
    ? scrollY.interpolate({
        inputRange: [-200, 0, 400],
        outputRange: [50, 0, -100],
        extrapolate: 'clamp',
      })
    : 0;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {/* 1. Champagne light source (top-left, alpha <= 0.10) */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: -height * 0.08,
            left: -width * 0.18,
            width: width * 0.95,
            height: width * 0.95,
            transform: [{ translateY: parallaxY }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(232, 196, 106, 0.09)', 'rgba(232, 196, 106, 0.02)', 'transparent']}
          style={styles.gradientFill}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.85, y: 0.85 }}
        />
      </Animated.View>

      {/* 2. Cool / Asset light source (bottom-right, alpha <= 0.08) */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: height * 0.42,
            right: -width * 0.22,
            width: width * 1.05,
            height: width * 1.05,
            transform: [{ translateY: Animated.multiply(parallaxY as any, -1) }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            targetCoolColor === color.asset.cash
              ? 'rgba(203, 213, 225, 0.07)'
              : targetCoolColor === color.asset.crypto
              ? 'rgba(167, 139, 250, 0.07)'
              : 'rgba(56, 189, 248, 0.07)',
            'transparent',
          ]}
          style={styles.gradientFill}
          start={{ x: 0.8, y: 0.2 }}
          end={{ x: 0.15, y: 0.85 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.obsidian,
    zIndex: -1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
});
