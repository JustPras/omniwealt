import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * ScreenTransition: Stable, zero-blink container for tab screen scenes.
 * Navigator-level sceneStyleInterpolator handles smooth cross-tab transitions
 * on the native UI thread, avoiding asynchronous React lifecycle flickers.
 */
export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
