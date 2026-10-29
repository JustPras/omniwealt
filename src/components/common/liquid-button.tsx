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

  // Fluid scale & squash animation per DESIGN_SYSTEM.md
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;

  // Liquid splash ripple animation
  const rippleScale = useRef(new Animated.Value(0.2)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    if (disabled || loading) return;

    triggerHaptic('light');

    const { locationX, locationY } = e.nativeEvent;
    setRipplePos({ x: locationX, y: locationY });

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

  const activeGradients = isDark ? Colors.darkGlass : Colors.lightGlass;

  const gradientColors =
    variant === 'azure'
      ? (activeGradients.dropletAzureGradient as unknown as [string, string, ...string[]])
      : variant === 'obsidian'
      ? (activeGradients.dropletObsidianGradient as unknown as [string, string, ...string[]])
      : (activeGradients.dropletClearGradient as unknown as [string, string, ...string[]]);

  const defaultTextColor =
    variant === 'azure'
      ? '#0A0A09' // High-contrast Swiss bullion dark ink on Champagne gold
      : Colors.palette.alabasterWhite;

  const iconColor =
    variant === 'azure'
      ? '#0A0A09'
      : variant === 'obsidian'
      ? Colors.palette.champagneGold
      : Colors.palette.champagneGold;

  const borderColor =
    variant === 'azure'
      ? 'rgba(212, 175, 55, 0.55)'
      : variant === 'obsidian'
      ? 'rgba(255, 255, 255, 0.14)'
      : 'rgba(255, 255, 255, 0.16)';

  const shadowStyle =
    variant === 'azure'
      ? {
          shadowColor: Colors.palette.champagneGold,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 5,
        }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 3,
        };

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
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topMeniscusArc} pointerEvents="none">
          <LinearGradient
            colors={
              variant === 'azure'
                ? ['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.0)']
                : ['rgba(255, 255, 255, 0.50)', 'rgba(255, 255, 255, 0.0)']
            }
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topMeniscusGradient}
          />
        </View>

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
                  : 'rgba(212, 175, 55, 0.20)',
            },
          ]}
        />

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
