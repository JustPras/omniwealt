import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import {
  StyleSheet,
  View,
  Platform,
  useWindowDimensions,
  Animated,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../src/components/common/icon';
import { triggerHaptic } from '../../src/utils/haptics';
import { color, radius, shadow, motion, space } from '../../src/theme/tokens';

interface AnimatedTabIconProps {
  name: IconName;
  focused: boolean;
  size?: number;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ name, focused, size }) => {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      tension: motion.spring.settle.tension,
      friction: motion.spring.settle.friction,
      useNativeDriver: true,
    }).start();
  }, [focused, anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.05],
  });

  const bgOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          transform: [{ scale }],
        },
      ]}
    >
      {/* Sliding champagne active pill capsule (no glow or colored shadows) */}
      <Animated.View
        style={[
          styles.activePillCapsule,
          {
            opacity: bgOpacity,
            transform: [{ scale: anim }],
          },
        ]}
      />

      <Icon
        name={name}
        size={size || 18}
        color={focused ? color.accent : color.textMuted}
      />
    </Animated.View>
  );
};

// Custom Tab Button with Spring Feedback on Press
const AnimatedTabBarButton = (props: any) => {
  const { children, onPress, style } = props;
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.94,
      tension: motion.spring.press.tension,
      friction: motion.spring.press.friction,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      tension: motion.spring.settle.tension,
      friction: motion.spring.settle.friction,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      {...props}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { flex: 1 }]}
    >
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressScale }],
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;

  return (
    <View style={{ flex: 1, backgroundColor: color.obsidian }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: color.accent,
          tabBarInactiveTintColor: color.textMuted,
          tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
          tabBarStyle: [
            styles.tabBar,
            {
              bottom: Math.max(insets.bottom + 6, 14),
              left: isSmallScreen ? 10 : 14,
              right: isSmallScreen ? 10 : 14,
            },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarBackground: () =>
            Platform.OS === 'web' ? (
              <View style={styles.webTabBarBg} />
            ) : Platform.OS === 'android' ? (
              <View style={styles.androidTabBarBg} />
            ) : (
              <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            ),
        }}
        screenListeners={{
          tabPress: () => {
            triggerHaptic('selection');
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Overview',
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon name="LayoutDashboard" focused={focused} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Accounts',
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon name="Landmark" focused={focused} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: 'Portfolio',
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon name="TrendingUp" focused={focused} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="sync"
          options={{
            title: 'Sync SoA',
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon name="RefreshCw" focused={focused} size={size} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: 64,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.rim,
    backgroundColor: color.glassFillRaised,
    ...shadow.e2,
    overflow: 'hidden',
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabBarItem: {
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
    position: 'relative',
  },
  activePillCapsule: {
    position: 'absolute',
    width: 42,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: color.accentSoft,
    borderWidth: 1,
    borderColor: color.accentRim,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  androidTabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
  },
  webTabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    // @ts-ignore
    backdropFilter: 'blur(24px) saturate(140%)',
  },
});
