import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  StyleProp,
  Platform,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface LuxuryLoaderProps {
  title?: string;
  subtitle?: string;
  fullscreen?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const LuxuryLoader: React.FC<LuxuryLoaderProps> = ({
  title = 'OMNIWEALTH',
  subtitle = 'Menyiapkan Portofolio & Harga Pasar...',
  fullscreen = false,
  style,
}) => {
  // 1. Entrance animation (bloom on mount)
  const introScale = useRef(new Animated.Value(0.88)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;

  // 2. Weightless floating (subtle vertical hover)
  const floatAnim = useRef(new Animated.Value(0)).current;

  // 3. Gentle organic breathing pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 4. Ambient aura rotation & counter-rotation
  const rotateAuraClockwise = useRef(new Animated.Value(0)).current;
  const rotateAuraCounter = useRef(new Animated.Value(0)).current;

  // 5. Glow intensity pulse (aurora breathing)
  const auraGlowAnim = useRef(new Animated.Value(0.4)).current;

  // 6. Subtitle shimmer
  const shimmerAnim = useRef(new Animated.Value(0.6)).current;

  // 7. Liquid progress sweep (smooth wave)
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // --- Entrance Bloom ---
    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(introScale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start();

    // --- Floating Physics (Anti-gravity hover effect) ---
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 3,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // --- Gentle Organic Breathing Pulse ---
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // --- Ambient Glow Aura Rotation (dual-speed, non-linear feel) ---
    const auraClockwiseLoop = Animated.loop(
      Animated.timing(rotateAuraClockwise, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const auraCounterLoop = Animated.loop(
      Animated.timing(rotateAuraCounter, {
        toValue: 1,
        duration: 5500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // --- Aurora Breathing Intensity ---
    const auraGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraGlowAnim, {
          toValue: 0.85,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(auraGlowAnim, {
          toValue: 0.45,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // --- Text Shimmer ---
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.5,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // --- Smooth Liquid Progress Track (ping-pong back and forth for fluid loop) ---
    const progressLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    pulseLoop.start();
    auraClockwiseLoop.start();
    auraCounterLoop.start();
    auraGlowLoop.start();
    shimmerLoop.start();
    progressLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      auraClockwiseLoop.stop();
      auraCounterLoop.stop();
      auraGlowLoop.stop();
      shimmerLoop.stop();
      progressLoop.stop();
    };
  }, [
    introOpacity,
    introScale,
    floatAnim,
    pulseAnim,
    rotateAuraClockwise,
    rotateAuraCounter,
    auraGlowAnim,
    shimmerAnim,
    progressAnim,
  ]);

  const spinClockwise = rotateAuraClockwise.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinCounter = rotateAuraCounter.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const progressTranslate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, 70],
  });

  const content = (
    <Animated.View
      style={[
        styles.contentBox,
        {
          opacity: introOpacity,
          transform: [
            { scale: introScale },
            { translateY: floatAnim },
          ],
        },
      ]}
    >
      {/* Central Floating Orb with Multi-Layer Aurora Caustics */}
      <View style={fullscreen ? styles.largeOrbContainer : styles.orbContainer}>
        {/* Layer 1: Ambient Outer Aurora Halo (Counter-clockwise rotation) */}
        <Animated.View
          style={[
            styles.outerAuraRing,
            {
              transform: [{ rotate: spinCounter }, { scale: pulseAnim }],
              opacity: auraGlowAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#38BDF8', '#10B981', '#F59E0B', '#38BDF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFill}
          />
        </Animated.View>

        {/* Layer 2: Inner Prismatic Accent Ring (Clockwise rotation) */}
        <Animated.View
          style={[
            styles.innerAuraRing,
            {
              transform: [{ rotate: spinClockwise }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(56, 189, 248, 0.8)', 'transparent', 'rgba(16, 185, 129, 0.8)', 'transparent']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.gradientFill}
          />
        </Animated.View>

        {/* Layer 3: Central High-End 3D Icon Plaque */}
        <Animated.View
          style={[
            fullscreen ? styles.largeCentralEmblem : styles.centralEmblem,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.emblemBackdrop}>
            <Image
              source={require('../../../assets/icon.png')}
              style={fullscreen ? styles.largeLogoImage : styles.logoImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      </View>

      {/* Brand Typography */}
      <View style={styles.textContainer}>
        <Text style={styles.brandTitle}>{title}</Text>
        <Animated.Text style={[styles.statusSubtitle, { opacity: shimmerAnim }]}>
          {subtitle}
        </Animated.Text>
      </View>

      {/* Fluid Liquid Neon Loading Track */}
      <View style={styles.progressBarTrack}>
        <Animated.View
          style={[
            styles.progressBarSweep,
            {
              transform: [{ translateX: progressTranslate }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', '#38BDF8', '#10B981', '#F59E0B', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sweepGradient}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );

  if (fullscreen) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.fullscreenWrapper, style]}>
        {Platform.OS === 'web' ? (
          <View style={styles.webBackdrop} />
        ) : (
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        {content}
      </View>
    );
  }

  return (
    <View style={[styles.inlineWrapper, style]}>
      {Platform.OS === 'web' ? (
        <View style={styles.webBackdrop} />
      ) : (
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenWrapper: {
    backgroundColor: '#080C14',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  inlineWrapper: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    overflow: 'hidden',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 20, 0.95)',
    // @ts-ignore
    backdropFilter: 'blur(30px)',
  },
  contentBox: {
    alignItems: 'center',
    gap: 18,
  },
  orbContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  largeOrbContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerAuraRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  innerAuraRing: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 55,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  centralEmblem: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#080C14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
  },
  largeCentralEmblem: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#080C14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 12,
    overflow: 'hidden',
  },
  emblemBackdrop: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  largeLogoImage: {
    width: 68,
    height: 68,
    borderRadius: 18,
  },
  textContainer: {
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 3,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  progressBarTrack: {
    width: 160,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarSweep: {
    width: 90,
    height: '100%',
    position: 'absolute',
  },
  sweepGradient: {
    width: '100%',
    height: '100%',
  },
});
