import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, Colors } from '../../theme/tokens';

interface AmbientBackgroundProps {
  scrollY?: Animated.Value;
  activeAssetClass?: 'CASH' | 'STOCK' | 'STOCKS' | 'CRYPTO' | 'ALL' | null;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = React.memo(({
  scrollY,
}) => {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const isDark = theme.canvas === Colors.palette.appleInk;

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
          outputRange: [40, 0, -80],
          extrapolate: 'clamp',
        })
      : null;
  }, [scrollY]);

  const parallaxY2 = React.useMemo(() => {
    return scrollY
      ? scrollY.interpolate({
          inputRange: [-200, 0, 400],
          outputRange: [-30, 0, 60],
          extrapolate: 'clamp',
        })
      : null;
  }, [scrollY]);

  const floatY1 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const floatY2 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 22],
  });

  const floatY3 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: isDark ? Colors.palette.appleInk : Colors.palette.appleBg },
      ]}
      pointerEvents="none"
    >
      {/* Orb 1 (Top-Left): rgba(0, 122, 255, 0.18) ukuran 260x260 per DESIGN.md Section 4.2 */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: -30,
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
            isDark ? 'rgba(0, 122, 255, 0.28)' : 'rgba(0, 122, 255, 0.18)',
            'transparent',
          ]}
          style={styles.gradientFill}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
        />
      </Animated.View>

      {/* Orb 2 (Mid-Right): rgba(170, 170, 170, 0.25) ukuran 280x280 per DESIGN.md Section 4.2 */}
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
            isDark ? 'rgba(170, 170, 170, 0.12)' : 'rgba(170, 170, 170, 0.25)',
            'transparent',
          ]}
          style={styles.gradientFill}
          start={{ x: 0.8, y: 0.2 }}
          end={{ x: 0.1, y: 0.85 }}
        />
      </Animated.View>

      {/* Orb 3 (Bottom-Left): rgba(0, 122, 255, 0.14) ukuran 240x240 per DESIGN.md Section 4.2 */}
      <Animated.View
        style={[
          styles.orb,
          {
            bottom: height * 0.08,
            left: -50,
            width: 240,
            height: 240,
            borderRadius: 120,
            transform: [{ translateY: floatY3 }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            isDark ? 'rgba(0, 122, 255, 0.22)' : 'rgba(0, 122, 255, 0.14)',
            'transparent',
          ]}
          style={styles.gradientFill}
          start={{ x: 0.3, y: 0.7 }}
          end={{ x: 0.9, y: 0.1 }}
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
