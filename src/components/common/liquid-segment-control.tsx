import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { triggerHaptic } from '../../utils/haptics';
import { color, radius, shadow, motion, useTheme, themes } from '../../theme/tokens';

export interface LiquidSegmentItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
}

export interface LiquidSegmentControlProps<T extends string = string> {
  items: LiquidSegmentItem<T>[];
  activeKey: T;
  onSelect: (key: T) => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
  fontSize?: number;
  compact?: boolean;
  hapticType?: 'selection' | 'light';
  accentColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
}

const SegmentButton: React.FC<{
  label: string;
  count?: number;
  isActive: boolean;
  onPress: () => void;
  fontSize: number;
  activeTextColor?: string;
  inactiveTextColor?: string;
}> = React.memo(({ label, count, isActive, onPress, fontSize, activeTextColor, inactiveTextColor }) => {
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.92,
      tension: 260,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      tension: motion.spring.settle.tension,
      friction: motion.spring.settle.friction,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  const displayText = count !== undefined ? `${label} (${count})` : label;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={styles.segmentButton}
    >
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <Text
          numberOfLines={1}
          style={[
            styles.segmentText,
            { fontSize },
            inactiveTextColor ? { color: inactiveTextColor } : null,
            isActive && [
              styles.activeSegmentText,
              activeTextColor ? { color: activeTextColor } : null,
            ],
          ]}
        >
          {displayText}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

export function LiquidSegmentControl<T extends string = string>({
  items,
  activeKey,
  onSelect,
  style,
  height = 36,
  fontSize = 12,
  compact = false,
  hapticType = 'selection',
  accentColor,
  activeTextColor,
  inactiveTextColor,
}: LiquidSegmentControlProps<T>) {
  const theme = useTheme();
  const isDark = theme.canvas === themes.dark.canvas;
  const [rowWidth, setRowWidth] = useState(0);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey)
  );

  const currentPosition = useRef(new Animated.Value(activeIndex)).current;
  const flowSurge = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const prevIndexRef = useRef(activeIndex);

  const numItems = items.length;
  const rowPadding = compact ? 2.5 : 3;
  const innerWidth = rowWidth > 0 ? rowWidth - rowPadding * 2 : 0;
  const itemWidth = innerWidth > 0 && numItems > 0 ? innerWidth / numItems : 60;
  const capsuleWidth = itemWidth;
  const capsuleHeight = height - rowPadding * 2;

  const getCenterPos = useCallback(
    (idx: number) => rowPadding + idx * itemWidth,
    [itemWidth, rowPadding]
  );

  useEffect(() => {
    const fromIndex = prevIndexRef.current;
    const toIndex = Math.max(
      0,
      items.findIndex((item) => item.key === activeKey)
    );

    if (fromIndex !== toIndex) {
      prevIndexRef.current = toIndex;
      const distance = Math.abs(toIndex - fromIndex);
      const maxStretch = Math.min(1.0 + distance * 0.28, 1.85);

      waveAnim.setValue(0);

      Animated.parallel([
        Animated.spring(currentPosition, {
          toValue: toIndex,
          tension: 175,
          friction: 14,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flowSurge, {
            toValue: maxStretch,
            duration: 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(flowSurge, {
            toValue: 0,
            tension: 185,
            friction: 13,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.2, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeKey, currentPosition, flowSurge, items, waveAnim]);

  const inputRange = items.map((_, i) => i);
  const outputRange = items.map((_, i) => getCenterPos(i));

  const translateX =
    inputRange.length > 1
      ? currentPosition.interpolate({
          inputRange,
          outputRange,
          extrapolate: 'clamp',
        })
      : rowPadding;

  const scaleX = flowSurge.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.25],
  });

  const scaleY = flowSurge.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 0.88],
  });

  const waveTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-capsuleWidth * 0.8, capsuleWidth * 0.8],
  });

  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 0.25, 0.75, 1],
    outputRange: [0, 0.75, 0.75, 0],
  });

  const primaryAccent = accentColor || color.accent;

  return (
    <View
      style={[
        styles.segmentRow,
        {
          height,
          padding: rowPadding,
        },
        style,
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - rowWidth) > 1) {
          setRowWidth(w);
        }
      }}
    >
      {/* Flowing Liquid Glass Water Capsule */}
      {rowWidth > 0 && numItems > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.liquidCapsule,
            {
              top: rowPadding,
              width: capsuleWidth,
              height: capsuleHeight,
              shadowColor: primaryAccent,
              transform: [{ translateX }, { scaleX }, { scaleY }],
            },
          ]}
        >
          {/* Inner clipped liquid glass container */}
          <View
            style={[
              styles.liquidInner,
              {
                backgroundColor: isDark
                  ? 'rgba(0, 122, 255, 0.22)'
                  : 'rgba(0, 122, 255, 0.16)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.32)'
                  : 'rgba(0, 122, 255, 0.38)',
              },
            ]}
          >
            {/* Internal Radiant Water Tint Nucleus */}
            <View
              style={[
                styles.liquidNucleus,
                {
                  backgroundColor: isDark
                    ? 'rgba(0, 140, 255, 0.18)'
                    : 'rgba(0, 122, 255, 0.12)',
                },
              ]}
            />

            {/* Water Wave Shimmer Ribbon */}
            <Animated.View
              style={[
                styles.waveShimmer,
                {
                  opacity: waveOpacity,
                  transform: [
                    { translateX: waveTranslateX },
                    { rotate: '25deg' },
                  ],
                },
              ]}
            />

            {/* Specular Water Meniscus Arc */}
            <View style={styles.specularGlint} />
          </View>

          {/* Subtle Active Glow Dot at Bottom */}
          <View
            style={[
              styles.activeDot,
              {
                backgroundColor: primaryAccent,
                shadowColor: primaryAccent,
              },
            ]}
          />
        </Animated.View>
      )}

      {/* Segment Buttons */}
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <SegmentButton
            key={item.key}
            label={item.label}
            count={item.count}
            isActive={isActive}
            fontSize={fontSize}
            activeTextColor={activeTextColor}
            inactiveTextColor={inactiveTextColor}
            onPress={() => {
              triggerHaptic(hapticType);
              onSelect(item.key);
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: color.glassFillInset,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  liquidCapsule: {
    position: 'absolute',
    left: 0,
    borderRadius: radius.pill,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.4,
    elevation: 4,
  },
  liquidInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  liquidNucleus: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 4,
    right: 4,
    borderRadius: radius.pill,
  },
  waveShimmer: {
    position: 'absolute',
    width: 24,
    height: '110%',
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 12,
  },
  specularGlint: {
    position: 'absolute',
    top: 1.5,
    left: '14%',
    right: '14%',
    height: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingHorizontal: 4,
  },
  segmentText: {
    fontSize: 12,
    color: color.textMuted,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  activeSegmentText: {
    color: color.accent,
    fontWeight: '700',
  },
});
