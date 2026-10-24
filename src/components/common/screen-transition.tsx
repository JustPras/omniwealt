import React, { useRef, useCallback } from 'react';
import { Animated, StyleSheet, ViewStyle, StyleProp, Easing } from 'react-native';
import { useFocusEffect } from 'expo-router';

interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

/**
 * ScreenTransition: Provides a smooth, ultra-responsive entrance animation
 * whenever a tab is switched or navigated to in OmniWealth.
 *
 * Utilizes `useFocusEffect` to trigger on every tab switch without white screen
 * or jarring layout shifts.
 */
export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  style,
  delay = 0,
}) => {
  // Start from soft values (never completely blank to eliminate black/white flashes)
  const fadeAnim = useRef(new Animated.Value(0.45)).current;
  const slideAnim = useRef(new Animated.Value(7)).current;
  const scaleAnim = useRef(new Animated.Value(0.99)).current;

  useFocusEffect(
    useCallback(() => {
      // Soft reset upon entering focus
      fadeAnim.setValue(0.45);
      slideAnim.setValue(7);
      scaleAnim.setValue(0.99);

      const anim = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 240,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 240,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      anim.start();

      return () => {
        anim.stop();
      };
    }, [fadeAnim, slideAnim, scaleAnim, delay])
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
});
