import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  borderTint?: string;
  gradientColors?: [string, string, ...string[]];
  noPadding?: boolean;
  onPress?: () => void;
  activeOpacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  intensity = 40,
  borderTint = 'rgba(255, 255, 255, 0.12)',
  gradientColors = ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'],
  noPadding = false,
  onPress,
  activeOpacity = 0.8,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={onPress ? activeOpacity : 1}
      style={[styles.outerContainer, { borderColor: borderTint }, style]}
    >
      {/* Frosted Blur Surface */}
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.webBackdrop]} />
      ) : (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      )}

      {/* Surface Light Gradient Reflection */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Specular Rim Reflection Line for Luxury Depth */}
      <View style={styles.topRimHighlight} pointerEvents="none" />

      {/* Card Content */}
      <View style={[styles.innerContent, noPadding && styles.noPadding, contentStyle]}>
        {children}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    // Subtle physical glass shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  topRimHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    zIndex: 2,
  },
  webBackdrop: {
    backgroundColor: 'rgba(12, 18, 30, 0.75)',
    // @ts-ignore - Web-specific CSS backdrop-filter
    backdropFilter: 'blur(24px)',
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
