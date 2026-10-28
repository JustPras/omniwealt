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

  // Determine geometry & styling based on level per DESIGN.md Section 4.1
  const resolvedRadius =
    typeof radius === 'number'
      ? radius
      : radius && rad[radius] !== undefined
      ? rad[radius]
      : level === 'raised'
      ? rad.xl // 24
      : level === 'inset'
      ? rad.md
      : rad.xl; // 24 for default card container

  const isInset = level === 'inset';
  const isRaised = level === 'raised';

  // Strict Apple Modern gradients per DESIGN.md Section 2 & 4.1
  const cardGradientColors = isDark
    ? Colors.darkGlass.cardGradient
    : Colors.lightGlass.cardGradient;

  const borderColor = isInset
    ? theme.hairline
    : isDark
    ? Colors.darkGlass.borderGlass
    : Colors.lightGlass.borderGlass;

  const resolvedShadow = isInset
    ? undefined
    : {
        shadowColor: Colors.palette.appleInk,
        shadowOffset: { width: 0, height: isRaised ? 12 : 10 },
        shadowOpacity: isDark ? 0.40 : 0.08,
        shadowRadius: isRaised ? 24 : 20,
        elevation: isRaised ? 7 : 5,
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
        },
        resolvedShadow,
        isPressable && {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {/* Frosted Blur Surface (True Liquid Glass 3px Lens Blur) */}
      {!isInset && (
        <>
          {Platform.OS === 'web' ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: resolvedRadius,
                  // @ts-ignore - Web-specific backdrop-filter per Liquid Glass
                  backdropFilter: 'blur(3px) saturate(190%) contrast(105%)',
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.015)'
                    : 'rgba(255, 255, 255, 0.15)',
                },
              ]}
            />
          ) : Platform.OS === 'android' ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(15, 23, 42, 0.65)'
                    : 'rgba(255, 255, 255, 0.70)',
                  borderRadius: resolvedRadius,
                },
              ]}
            />
          ) : (
            <BlurView
              intensity={3}
              tint={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: resolvedRadius }]}
            />
          )}

          {/* Diagonal Surface Fill Gradient (3% Core Transparency) */}
          <LinearGradient
            colors={cardGradientColors as unknown as [string, string, ...string[]]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: resolvedRadius }]}
          />

          {/* Top Meniscus Specular Highlight: Specular Gloss 70% in dark, 95% in light */}
          <View style={styles.topMeniscusContainer} pointerEvents="none">
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.0)']
                  : (Colors.lightGlass.specularTopHighlight as unknown as [string, string, ...string[]])
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
    borderWidth: 1.2,
    overflow: 'hidden',
    position: 'relative',
  },
  topMeniscusContainer: {
    position: 'absolute',
    top: 2,
    left: '10%',
    right: '10%',
    height: 14,
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
