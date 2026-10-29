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
import { useTheme, radius as rad, shadow, motion, Colors, isDarkTheme } from '../../theme/tokens';

export type GlassLevel = 'base' | 'raised' | 'inset' | 'bullion';

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
  const isDark = isDarkTheme(theme);
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

  const resolvedRadius =
    typeof radius === 'number'
      ? radius
      : radius && rad[radius] !== undefined
      ? rad[radius]
      : level === 'raised' || level === 'bullion'
      ? rad.xl // 24
      : level === 'inset'
      ? rad.md
      : rad.xl; // 24 for default card container

  const isInset = level === 'inset';
  const isRaised = level === 'raised';
  const isBullion = level === 'bullion';

  // Warm Titanium & Champagne gradients per DESIGN_SYSTEM.md
  const cardGradientColors = isBullion
    ? Colors.quartzGlass.bullionGradient
    : Colors.quartzGlass.cardGradient;

  const borderColor = isBullion
    ? Colors.quartzGlass.borderBullion
    : isInset
    ? theme.hairline
    : Colors.quartzGlass.borderQuartz;

  const resolvedShadow = isInset
    ? undefined
    : isBullion
    ? {
        shadowColor: Colors.palette.champagneGold,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 6,
      }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: isRaised ? 12 : 8 },
        shadowOpacity: 0.45,
        shadowRadius: isRaised ? 24 : 16,
        elevation: isRaised ? 7 : 4,
      };

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
          backgroundColor: isBullion
            ? 'rgba(20, 20, 18, 0.85)'
            : isInset
            ? 'rgba(10, 10, 9, 0.60)'
            : 'rgba(20, 20, 18, 0.72)',
        },
        resolvedShadow,
        isPressable && {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {/* Frosted Blur Surface */}
      {!isInset && (
        <>
          {Platform.OS === 'web' ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: resolvedRadius,
                  // @ts-ignore - Web-specific backdrop-filter
                  backdropFilter: 'blur(16px) saturate(180%)',
                  backgroundColor: isBullion
                    ? 'rgba(212, 175, 55, 0.04)'
                    : 'rgba(245, 243, 239, 0.02)',
                },
              ]}
            />
          ) : Platform.OS === 'android' ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isBullion
                    ? 'rgba(24, 23, 19, 0.92)'
                    : 'rgba(20, 20, 18, 0.88)',
                  borderRadius: resolvedRadius,
                },
              ]}
            />
          ) : (
            <BlurView
              intensity={20}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: resolvedRadius }]}
            />
          )}

          {/* Diagonal Surface Fill Gradient */}
          <LinearGradient
            colors={cardGradientColors as unknown as [string, string, ...string[]]}
            start={{ x: 0.05, y: 0 }}
            end={{ x: 0.95, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: resolvedRadius }]}
          />

          {/* Top Meniscus Specular Highlight: 1px top-left specular reflection */}
          <View style={styles.topMeniscusContainer} pointerEvents="none">
            <LinearGradient
              colors={
                isBullion
                  ? ['rgba(212, 175, 55, 0.65)', 'rgba(212, 175, 55, 0.0)']
                  : ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.0)']
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.topMeniscusGradient}
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
  topMeniscusContainer: {
    position: 'absolute',
    top: 1,
    left: '8%',
    right: '8%',
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
    zIndex: 2,
  },
  topMeniscusGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
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
