import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';

interface AmbientBackgroundProps {
  scrollY?: Animated.Value;
  activeAssetClass?: 'CASH' | 'STOCK' | 'STOCKS' | 'CRYPTO' | 'ALL' | null;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = React.memo(({
  scrollY,
  activeAssetClass,
}) => {
  const { width, height } = useWindowDimensions();

  // Slow ambient floating animation for orbs per DESIGN_SYSTEM.md
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

  // Dynamic asset glow mapping
  const primaryOrbColor = activeAssetClass === 'CRYPTO'
    ? 'rgba(224, 122, 95, 0.12)' // Burnished copper
    : activeAssetClass === 'CASH'
    ? 'rgba(148, 163, 184, 0.10)' // Titanium silver
    : 'rgba(212, 175, 55, 0.12)'; // Champagne gold

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
      ]}
      pointerEvents="none"
    >
      {/* 1. Deep OLED Warm Carbon Canvas */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.palette.canvas }]} />

      {/* 2. Top-Left Champagne Gold Ambient Glow Orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: -60,
            left: -60,
            width: 320,
            height: 320,
            borderRadius: 160,
            transform: [
              ...(parallaxY1 ? [{ translateY: parallaxY1 }] : []),
              { translateY: floatY1 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            primaryOrbColor,
            'transparent',
          ]}
          style={styles.gradientFill}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
        />
      </Animated.View>

      {/* 3. Mid-Right Titanium Smoked Glow Orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: height * 0.35,
            right: -80,
            width: 340,
            height: 340,
            borderRadius: 170,
            transform: [
              ...(parallaxY2 ? [{ translateY: parallaxY2 }] : []),
              { translateY: floatY2 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(163, 158, 147, 0.06)',
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
