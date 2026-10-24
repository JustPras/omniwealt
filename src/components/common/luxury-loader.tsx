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
  subtitle = 'Memuat Data Portofolio & Keuangan...',
  fullscreen = false,
  style,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const sweepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Continuous smooth rotation for ambient outer glow ring
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 2. Gentle organic breathing / pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.94,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Shimmer opacity loop for text/scanner
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Progress bar sweep animation
    const sweepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweepAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sweepAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    rotateLoop.start();
    pulseLoop.start();
    shimmerLoop.start();
    sweepLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      shimmerLoop.stop();
      sweepLoop.stop();
    };
  }, [rotateAnim, pulseAnim, shimmerAnim, sweepAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sweepTranslate = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 200],
  });

  const content = (
    <View style={styles.contentBox}>
      {/* Central Pulsing Geometric Orb */}
      <View style={styles.orbContainer}>
        {/* Outer Rotating Glow Accent Ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <LinearGradient
            colors={['#38BDF8', '#10B981', 'transparent', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientRing}
          />
        </Animated.View>

        {/* Central Core with Breathing Scale */}
        <Animated.View
          style={[
            styles.centralEmblem,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.emblemInner}>
            <Image
              source={require('../../../assets/icon.png')}
              style={{ width: 40, height: 40, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      </View>

      {/* Typography */}
      <View style={styles.textContainer}>
        <Text style={styles.brandTitle}>{title}</Text>
        <Animated.Text style={[styles.statusSubtitle, { opacity: shimmerAnim }]}>
          {subtitle}
        </Animated.Text>
      </View>

      {/* Ultra-sleek Neon Loading Progress Line */}
      <View style={styles.progressBarTrack}>
        <Animated.View
          style={[
            styles.progressBarSweep,
            {
              transform: [{ translateX: sweepTranslate }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', '#38BDF8', '#10B981', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sweepGradient}
          />
        </Animated.View>
      </View>
    </View>
  );

  if (fullscreen) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.fullscreenWrapper, style]}>
        {Platform.OS === 'web' ? (
          <View style={styles.webBackdrop} />
        ) : (
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
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
    backgroundColor: 'rgba(8, 12, 20, 0.95)',
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
    backgroundColor: 'rgba(8, 12, 20, 0.90)',
    // @ts-ignore
    backdropFilter: 'blur(24px)',
  },
  contentBox: {
    alignItems: 'center',
    gap: 16,
  },
  orbContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    opacity: 0.7,
  },
  centralEmblem: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  emblemInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: 5,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 2.5,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  progressBarTrack: {
    width: 140,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarSweep: {
    width: 60,
    height: '100%',
    position: 'absolute',
  },
  sweepGradient: {
    width: '100%',
    height: '100%',
  },
});
