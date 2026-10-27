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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../../utils/haptics';
import { radius, shadow, motion, useTheme, Colors } from '../../theme/tokens';

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
      toValue: 0.94,
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
  const isDark = theme.canvas === Colors.palette.appleInk;
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
      waveAnim.setValue(0);

      // Fluid Motion Physics per DESIGN.md Section 5.2:
      // Sliding Translation: damping: 14, stiffness: 150, mass: 0.8
      // Fluid Morphing: Phase 1 (0-130ms) scaleX: 1.14, scaleY: 0.90 -> Phase 2 (130-380ms) spring back
      Animated.parallel([
        Animated.spring(currentPosition, {
          toValue: toIndex,
          damping: 14,
          stiffness: 150,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          // Phase 1 (0–130ms): stretch 1.14, squash 0.90
          Animated.timing(flowSurge, {
            toValue: 1,
            duration: 130,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // Phase 2 (130–380ms): spring back to 1.0 with friction: 5
          Animated.spring(flowSurge, {
            toValue: 0,
            friction: 5,
            tension: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 320,
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

  // Fluid Morphing: stretch scaleX 1.14, squash scaleY 0.90 per DESIGN.md Section 5.2
  const scaleX = flowSurge.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.14],
  });

  const scaleY = flowSurge.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 0.90],
  });

  const waveTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-capsuleWidth * 0.8, capsuleWidth * 1.3],
  });

  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.85, 0.65, 0],
  });

  const activeDropletBg = accentColor || Colors.palette.appleBlue;
  const trackBgColor = isDark ? Colors.darkGlass.trackBg : Colors.lightGlass.trackBg;
  const trackBorderColor = isDark ? Colors.darkGlass.borderGlass : 'rgba(255, 255, 255, 0.82)';

  return (
    <View
      style={[
        styles.trackContainer,
        {
          height,
          backgroundColor: trackBgColor,
          borderColor: trackBorderColor,
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
      {/* Active Fluid Droplet Capsule */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.dropletCapsule,
          {
            width: capsuleWidth,
            height: capsuleHeight,
            top: rowPadding,
            transform: [{ translateX }, { scaleX }, { scaleY }],
            shadowColor: activeDropletBg,
          },
        ]}
      >
        <View
          style={[
            styles.dropletFill,
            {
              backgroundColor: activeDropletBg,
              borderColor: 'rgba(255, 255, 255, 0.40)',
            },
          ]}
        >
          {/* Internal Radiant Gradient */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.28)',
              'rgba(0, 122, 255, 0.0)',
              'rgba(0, 0, 0, 0.12)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Meniscus Specular Highlight per DESIGN.md Section 5.2 */}
          <View style={styles.specularTopMeniscus} pointerEvents="none">
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.92)', 'rgba(255, 255, 255, 0.0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* Shimmering Wave Ribbon */}
          <Animated.View
            style={[
              styles.waveShimmer,
              {
                opacity: waveOpacity,
                transform: [{ translateX: waveTranslateX }, { rotate: '20deg' }],
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Interactive Item Buttons */}
      <View style={styles.buttonsRow}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <SegmentButton
              key={item.key}
              label={item.label}
              count={item.count}
              isActive={isActive}
              onPress={() => {
                if (!isActive) {
                  triggerHaptic(hapticType);
                  onSelect(item.key);
                }
              }}
              fontSize={fontSize}
              activeTextColor={activeTextColor || '#FFFFFF'}
              inactiveTextColor={inactiveTextColor || (isDark ? Colors.palette.appleMuted : Colors.palette.appleMuted)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trackContainer: {
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: 3,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dropletCapsule: {
    position: 'absolute',
    borderRadius: radius.pill,
    zIndex: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  dropletFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  specularTopMeniscus: {
    position: 'absolute',
    top: 1,
    left: '10%',
    right: '10%',
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    zIndex: 2,
  },
  waveShimmer: {
    position: 'absolute',
    width: 24,
    height: '140%',
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderRadius: 12,
    top: -4,
  },
  buttonsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  segmentText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  activeSegmentText: {
    fontWeight: '700',
  },
});
