import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface SparklineProps {
  data: number[];
  isPositive?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  isPositive = true,
  height = 42,
  style,
}) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const primaryColor = isPositive ? '#10B981' : '#F43F5E';
  const secondaryColor = isPositive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';

  return (
    <View style={[styles.container, { height }, style]}>
      {data.map((val, index) => {
        const normalized = (val - min) / range;
        const barHeight = Math.max(6, normalized * (height - 6));
        const isLatest = index === data.length - 1;

        return (
          <View key={index} style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isLatest ? primaryColor : secondaryColor,
                  shadowColor: isLatest ? primaryColor : 'transparent',
                  shadowOpacity: isLatest ? 0.8 : 0,
                  shadowRadius: 4,
                  elevation: isLatest ? 3 : 0,
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
    paddingVertical: 4,
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
