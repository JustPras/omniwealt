import React, { useRef, useState, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  Animated,
  Pressable,
  View,
  GestureResponderEvent,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, useTheme, isDarkTheme } from '../../theme/tokens';
import { Icon, IconName } from './icon';
import { triggerHaptic } from '../../utils/haptics';

export type LiquidButtonVariant = 'clear' | 'azure' | 'obsidian';
export type LiquidButtonSize = 'sm' | 'md' | 'lg';

export interface LiquidButtonProps {
  title?: string;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  variant?: LiquidButtonVariant;
  size?: LiquidButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hitSlop?: number;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'tab';
  children?: React.ReactNode;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  title,
  icon,
  iconPosition = 'left',
  iconSize,
  variant = 'clear',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  hitSlop = 6,
  accessibilityLabel,
  accessibilityRole = 'button',
  children,
}) => {
  const theme = useTheme();
  const isDark = isDarkTheme(theme);

  // Fluid scale & squash animation per DESIGN.md Section 5.1
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;

  // Liquid splash ripple animation
  const rippleScale = useRef(new Animated.Value(0.2)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    if (disabled || loading) return;

    // 1. Tactile feedback
    triggerHaptic('light');

    // 2. Liquid splash ripple position
    const { locationX, locationY } = e.nativeEvent;
    setRipplePos({ x: locationX, y: locationY });

    // 3. Elastic squash animation: scaleX: 0.93, scaleY: 1.05 in 110ms
    Animated.parallel([
      Animated.timing(scaleX, {
        toValue: 0.93,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(scaleY, {
        toValue: 1.05,
        duration: 110,
        useNativeDriver: true,
      }),
      // Ripple expand to 3.2 and fade opacity 0.9 -> 0
      Animated.sequence([
        Animated.timing(rippleOpacity, {
          toValue: 0.9,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 3.2,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [disabled, loading, rippleOpacity, rippleScale, scaleX, scaleY]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;

    // Bounce back to scaleX: 1, scaleY: 1 using Animated.spring({ friction: 4, tension: 160 }) per DESIGN.md Section 5.1
    Animated.parallel([
      Animated.spring(scaleX, {
        toValue: 1,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.spring(scaleY, {
        toValue: 1,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [disabled, loading, scaleX, scaleY]);

  // Gradient & color selection per variant in DESIGN.md Section 5.1
  const activeGradients = isDark ? Colors.darkGlass : Colors.lightGlass;

  const gradientColors =
    variant === 'azure'
      ? (activeGradients.dropletAzureGradient as unknown as string[])
      : variant === 'obsidian'
      ? (activeGradients.dropletObsidianGradient as unknown as string[])
      : (activeGradients.dropletClearGradient as unknown as string[]);

  const defaultTextColor =
    variant === 'azure'
      ? '#FFFFFF'
      : variant === 'obsidian'
      ? '#FFFFFF'
      : isDark
      ? '#FFFFFF'
      : '#0F172A';

  const iconColor =
    variant === 'azure'
      ? '#FFFFFF'
      : variant === 'obsidian'
      ? Colors.palette.appleBg
      : Colors.palette.appleBlue;

  const borderColor =
    variant === 'azure'
      ? 'rgba(255, 255, 255, 0.45)'
      : variant === 'obsidian'
      ? 'rgba(255, 255, 255, 0.18)'
      : isDark
      ? 'rgba(255, 255, 255, 0.22)'
      : 'rgba(255, 255, 255, 0.92)';

  const shadowStyle =
    variant === 'azure'
      ? {
          shadowColor: Colors.palette.appleBlue,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.40,
          shadowRadius: 14,
          elevation: 5,
        }
      : {
          shadowColor: Colors.palette.appleInk,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 10,
          elevation: 3,
        };

  // Dimensions by size
  const sizeStyles = {
    sm: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 9999,
      fontSize: 11,
      iconSize: 13,
      gap: 5,
    },
    md: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 9999,
      fontSize: 13,
      iconSize: 15,
      gap: 6,
    },
    lg: {
      paddingVertical: 13,
      paddingHorizontal: 22,
      borderRadius: 9999,
      fontSize: 15,
      iconSize: 18,
      gap: 8,
    },
  }[size];

  const resolvedIconSize = iconSize || sizeStyles.iconSize;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        shadowStyle,
        {
          transform: [{ scaleX }, { scaleY }],
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={hitSlop}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || title}
        style={[
          styles.container,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            borderColor,
          },
        ]}
      >
        {/* Liquid Gradient Fill */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Meniscus Specular Highlight: white water meniscus arc at top rim */}
        <View style={styles.topMeniscusArc} pointerEvents="none">
          <LinearGradient
            colors={
              variant === 'azure'
                ? ['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.0)']
                : ['rgba(255, 255, 255, 0.92)', 'rgba(255, 255, 255, 0.0)']
            }
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topMeniscusGradient}
          />
        </View>

        {/* Liquid splash ripple layer */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              left: ripplePos.x - 25,
              top: ripplePos.y - 25,
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
              backgroundColor:
                variant === 'azure'
                  ? 'rgba(255, 255, 255, 0.35)'
                  : 'rgba(0, 122, 255, 0.20)',
            },
          ]}
        />

        {/* Button Content */}
        {loading ? (
          <ActivityIndicator size="small" color={defaultTextColor} />
        ) : children ? (
          children
        ) : (
          <View style={[styles.contentRow, { gap: sizeStyles.gap }]}>
            {icon && iconPosition === 'left' && (
              <Icon name={icon} size={resolvedIconSize} color={iconColor} />
            )}
            {title ? (
              <Text
                style={[
                  styles.titleText,
                  {
                    fontSize: sizeStyles.fontSize,
                    color: defaultTextColor,
                  },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            ) : null}
            {icon && iconPosition === 'right' && (
              <Icon name={icon} size={resolvedIconSize} color={iconColor} />
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 9999,
  },
  container: {
    borderRadius: 9999,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topMeniscusArc: {
    position: 'absolute',
    top: 1,
    left: '12%',
    right: '12%',
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    zIndex: 2,
  },
  topMeniscusGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    zIndex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
