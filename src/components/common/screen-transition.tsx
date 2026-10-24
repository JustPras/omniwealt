import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
