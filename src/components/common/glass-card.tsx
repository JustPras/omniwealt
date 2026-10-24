import React, { ReactNode, useRef } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { color, radius as rad, shadow, motion } from '../../theme/tokens';

export type GlassLevel = 'base' | 'raised' | 'inset';

interface GlassCardProps {
  children: ReactNode;
  level?: GlassLevel;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  onPress?: () => void;
  radius?: keyof typeof rad | number;
  experimentalDimezis?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  level = 'base',
  style,
  contentStyle,
  noPadding = false,
  onPress,
  radius,
  experimentalDimezis = false,
}) => {
  const isPressable = typeof onPress === 'function';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rimAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (!isPressable) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.985,
        tension: motion.spring.press.tension,
        friction: motion.spring.press.friction,
        useNativeDriver: true,
      }),
      Animated.timing(rimAnim, {
        toValue: 1,
        duration: motion.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!isPressable) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: motion.spring.settle.tension,
        friction: motion.spring.settle.friction,
        useNativeDriver: true,
      }),
      Animated.timing(rimAnim, {
        toValue: 0,
        duration: motion.base,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Determine geometry & styling based on level
  const resolvedRadius =
    typeof radius === 'number'
      ? radius
      : radius && rad[radius] !== undefined
      ? rad[radius]
      : level === 'raised'
      ? rad.xl
      : level === 'inset'
      ? rad.md
      : rad.lg;

  const resolvedShadow =
    level === 'raised' ? shadow.e2 : level === 'base' ? shadow.e1 : undefined;

  const isInset = level === 'inset';
  const isRaised = level === 'raised';

  // Android: bump fill opacity when blur is absent for legibility
  const androidFillAlpha = isRaised
    ? 'rgba(15,23,42,0.84)'
    : isInset
    ? color.glassFillInset
    : 'rgba(15,23,42,0.67)';

  const baseFill =
    Platform.OS === 'android' && !experimentalDimezis
      ? androidFillAlpha
      : isRaised
      ? color.glassFillRaised
      : isInset
      ? color.glassFillInset
      : color.glassFill;

  const borderColor = isInset
    ? color.hairline
    : isRaised
    ? 'rgba(255,255,255,0.14)'
    : color.rim;

  const ContainerComponent = isPressable ? AnimatedPressable : View;

  return (
    <ContainerComponent
      onPress={onPress}
      onPressIn={isPressable ? handlePressIn : undefined}
      onPressOut={isPressable ? handlePressOut : undefined}
      style={[
        styles.outerContainer,
        {
          borderRadius: resolvedRadius,
          borderColor,
          backgroundColor: baseFill,
        },
        resolvedShadow,
        isPressable && {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {/* Frosted Blur Surface (not rendered on inset level) */}
      {!isInset && (
        <>
          {Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, styles.webBackdrop]} />
          ) : Platform.OS === 'android' && !experimentalDimezis ? (
            // Solid alpha fallback for crisp performance without blur artifacts on Android
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: androidFillAlpha, borderRadius: resolvedRadius },
              ]}
            />
          ) : (
            <BlurView
              intensity={isRaised ? 70 : 40}
              tint="dark"
              experimentalBlurMethod={experimentalDimezis ? 'dimezisBlurView' : 'none'}
              style={[StyleSheet.absoluteFill, { borderRadius: resolvedRadius }]}
            />
          )}

          {/* Surface light gradient reflection: light falls from top-left */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: resolvedRadius }]}
          />

          {/* Top specular rim reflection line (1px gradient: transparent -> rimStrong -> transparent) */}
          <View style={styles.topRimWrapper} pointerEvents="none">
            <LinearGradient
              colors={['transparent', color.rimStrong, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topRimGradient}
            />
          </View>
        </>
      )}

      {/* Card Content */}
      <View
        style={[
          styles.innerContent,
          noPadding && styles.noPadding,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </ContainerComponent>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  outerContainer: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  topRimWrapper: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    zIndex: 2,
  },
  topRimGradient: {
    width: '100%',
    height: 1,
  },
  webBackdrop: {
    backgroundColor: 'rgba(12, 18, 30, 0.75)',
    // @ts-ignore - Web-specific CSS backdrop-filter
    backdropFilter: 'blur(24px) saturate(140%)',
  },
  innerContent: {
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  noPadding: {
    padding: 0,
  },
});
