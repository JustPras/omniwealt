import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  PanResponder,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import { color, motion } from '../../theme/tokens';
import { triggerHaptic } from '../../utils/haptics';

export interface ScrubPoint {
  val: number;
  label: string;
  changePct: number;
}

interface SparklineProps {
  data: number[];
  labels?: string[];
  isPositive?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  onScrub?: (point: ScrubPoint, index: number) => void;
  onScrubEnd?: () => void;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  labels,
  isPositive = true,
  height = 42,
  style,
  interactive = false,
  onScrub,
  onScrubEnd,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const lastHapticTime = useRef(0);
  const crosshairAnim = useRef(new Animated.Value(0)).current;

  const min = data.length > 0 ? Math.min(...data) : 0;
  const max = data.length > 0 ? Math.max(...data) : 1;
  const range = max - min || 1;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handleTouch = useCallback(
    (locationX: number) => {
      if (!data.length || containerWidth <= 0 || !onScrub) return;
      const rawIdx = Math.floor((locationX / containerWidth) * data.length);
      const clampedIdx = Math.max(0, Math.min(data.length - 1, rawIdx));

      if (clampedIdx !== scrubIndex) {
        setScrubIndex(clampedIdx);
        crosshairAnim.setValue(clampedIdx);

        // Haptic feedback throttled to max once per 40ms per DESIGN.md
        const now = Date.now();
        if (now - lastHapticTime.current > 40) {
          triggerHaptic('selection');
          lastHapticTime.current = now;
        }

        const pointVal = data[clampedIdx];
        const baseVal = data[0] || pointVal;
        const changePct = baseVal > 0 ? (pointVal - baseVal) / baseVal : 0;
        const label = labels && labels[clampedIdx] ? labels[clampedIdx] : `Titik ${clampedIdx + 1}`;

        onScrub({ val: pointVal, label, changePct }, clampedIdx);
      }
    },
    [data, labels, containerWidth, scrubIndex, onScrub, crosshairAnim]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: () => interactive,
      onPanResponderGrant: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        setScrubIndex(null);
        if (onScrubEnd) onScrubEnd();
      },
      onPanResponderTerminate: () => {
        setScrubIndex(null);
        if (onScrubEnd) onScrubEnd();
      },
    })
  ).current;

  if (!data || data.length === 0) return null;

  const primaryColor = isPositive ? color.gain : color.loss;
  const secondaryColor = isPositive ? 'rgba(16, 185, 129, 0.22)' : 'rgba(244, 63, 94, 0.22)';

  return (
    <View
      onLayout={handleLayout}
      {...(interactive ? panResponder.panHandlers : {})}
      style={[styles.container, { height }, style]}
    >
      {data.map((val, index) => {
        const normalized = (val - min) / range;
        const barHeight = Math.max(6, normalized * (height - 6));
        const isLatest = index === data.length - 1;
        const isScrubbed = scrubIndex === index;

        return (
          <View key={index} style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isScrubbed
                    ? color.accent
                    : isLatest
                    ? primaryColor
                    : secondaryColor,
                  opacity: scrubIndex !== null && !isScrubbed ? 0.35 : 1,
                  transform: [{ scaleY: isScrubbed ? 1.08 : 1 }],
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 6,
    position: 'relative',
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 1.5,
  },
  bar: {
    width: '85%',
    maxWidth: 6,
    borderRadius: 3,
  },
});
