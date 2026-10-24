import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  StyleProp,
  Image,
} from 'react-native';
import { color, motion, space } from '../../theme/tokens';

interface LuxuryLoaderProps {
  title?: string;
  subtitle?: string;
  fullscreen?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const LuxuryLoader: React.FC<LuxuryLoaderProps> = ({
  title = 'OmniWealth',
  subtitle = 'Menyiapkan portofolio...',
  fullscreen = false,
  style,
}) => {
  const introOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.timing(introOpacity, {
      toValue: 1,
      duration: motion.base,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Subtle gentle float
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 2,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Warm champagne glow breathing (no rainbow, no rotation loops)
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Single progress line ping-pong
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
    progressLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      progressLoop.stop();
    };
  }, [introOpacity, floatAnim, pulseAnim, progressAnim]);

  const progressTranslate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen, style]}>
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: introOpacity,
            transform: [{ translateY: floatAnim }],
          },
        ]}
      >
        {/* Soft champagne glow behind the icon */}
        <Animated.View
          style={[
            styles.haloGlow,
            {
              opacity: pulseAnim,
            },
          ]}
        />

        {/* Clean Logo Image */}
        <View style={styles.logoFrame}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>

        {/* Sentence case title & subtitle */}
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.subtitleText}>{subtitle}</Text>

        {/* Clean minimalist progress track */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                transform: [{ translateX: progressTranslate }],
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.obsidian,
    zIndex: 999,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  haloGlow: {
    position: 'absolute',
    top: -15,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: color.accentSoft,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
  logoFrame: {
    width: 68,
    height: 68,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.rimStrong,
    backgroundColor: color.glassFillRaised,
    marginBottom: space.md,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: color.text,
    letterSpacing: 0.2,
    marginBottom: space.xs,
  },
  subtitleText: {
    fontSize: 13,
    color: color.textMuted,
    marginBottom: space.lg,
  },
  progressTrack: {
    width: 120,
    height: 2,
    borderRadius: 1,
    backgroundColor: color.hairline,
    overflow: 'hidden',
  },
  progressBar: {
    width: 40,
    height: '100%',
    backgroundColor: color.accent,
    borderRadius: 1,
  },
});
