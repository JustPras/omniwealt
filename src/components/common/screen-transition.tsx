import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, ViewStyle, StyleProp, Easing, AccessibilityInfo } from 'react-native';
import { motion } from '../../theme/tokens';

interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Module-level session flag: entrance animation plays only once per app session
let sessionEntrancePlayed = false;

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  style,
}) => {
  const shouldAnimate = !sessionEntrancePlayed;
  const fadeAnim = useRef(new Animated.Value(shouldAnimate ? 0.6 : 1)).current;
  const slideAnim = useRef(new Animated.Value(shouldAnimate ? 8 : 0)).current;

  useEffect(() => {
    if (!sessionEntrancePlayed) {
      sessionEntrancePlayed = true;

      AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
        if (reduceMotion) {
          fadeAnim.setValue(1);
          slideAnim.setValue(0);
          return;
        }

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: motion.base,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: motion.base,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
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
  },
});
