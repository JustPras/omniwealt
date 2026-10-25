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
import { useTheme, radius as rad, shadow, motion } from '../../theme/tokens';

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
}) => {
  const theme = useTheme();
  const isPressable = typeof onPress === 'function';
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!isPressable) return;
    Animated.spring(scaleAnim, {
      toValue: 0.985,
      tension: motion.spring.press.tension,
      friction: motion.spring.press.friction,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!isPressable) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: motion.spring.settle.tension,
      friction: motion.spring.settle.friction,
      useNativeDriver: true,
    }).start();
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

  // Base fill per Apple Liquid Glass spec
  const baseFill = isInset
    ? theme.glass.inset
    : isRaised
    ? theme.glass.lens
    : theme.glass.frost;

  const borderColor = isInset
    ? theme.hairline
    : isRaised
    ? theme.rim.hi
    : theme.rim.mid;

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
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: baseFill,
                  // @ts-ignore - Web-specific CSS backdrop-filter
                  backdropFilter: 'blur(28px) saturate(150%)',
                },
              ]}
            />
          ) : Platform.OS === 'android' ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isRaised ? 'rgba(29,29,31,0.85)' : 'rgba(29,29,31,0.72)',
                  borderRadius: resolvedRadius,
                },
              ]}
            />
          ) : (
            <BlurView
              intensity={isRaised ? 50 : 30}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: resolvedRadius }]}
            />
          )}

          {/* Surface subtle specular reflection: light falls from top-left */}
          <LinearGradient
            colors={[theme.rim.hi, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0.8 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.12, borderRadius: resolvedRadius }]}
          />

          {/* Top specular rim reflection line */}
          <View style={styles.topRimWrapper} pointerEvents="none">
            <LinearGradient
              colors={['transparent', theme.rim.hi, 'transparent']}
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
    left: 14,
    right: 14,
    height: 1,
    zIndex: 2,
  },
  topRimGradient: {
    width: '100%',
    height: 1,
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
