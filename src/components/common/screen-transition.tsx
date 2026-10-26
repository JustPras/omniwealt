import React, { useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  style,
}) => {
  const isFocused = useIsFocused();
  const anim = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      anim.setValue(1);
      return;
    }

    if (isFocused) {
      // Fluid native entrance spring when switching tabs
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        tension: 160,
        friction: 14,
        useNativeDriver: true,
      }).start();
    } else {
      // Screen lost focus: reset
      anim.setValue(0);
    }
  }, [isFocused, anim]);

  // Smooth fluid entrance interpolations
  const opacity = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.75, 0.9, 1],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.99, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
