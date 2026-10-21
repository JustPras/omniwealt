import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const AmbientBackground: React.FC = () => {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {/* Top Emerald/Cyan Ambient Orb */}
      <View
        style={[
          styles.orb,
          {
            top: -height * 0.1,
            left: -width * 0.15,
            width: width * 0.9,
            height: width * 0.9,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.25)', 'rgba(6, 182, 212, 0.12)', 'transparent']}
          style={styles.gradientFill}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.9, y: 0.9 }}
        />
      </View>

      {/* Middle/Bottom Indigo/Violet Ambient Orb */}
      <View
        style={[
          styles.orb,
          {
            top: height * 0.45,
            right: -width * 0.2,
            width: width * 0.95,
            height: width * 0.95,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.20)', 'rgba(168, 85, 247, 0.10)', 'transparent']}
          style={styles.gradientFill}
          start={{ x: 0.8, y: 0.2 }}
          end={{ x: 0.1, y: 0.8 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#080C14',
    zIndex: -1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
    opacity: 0.85,
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
});
