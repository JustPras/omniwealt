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
import { useTheme, radius, shadow, motion } from '../../src/theme/tokens';

interface AnimatedTabIconProps {
  name: IconName;
  focused: boolean;
  size?: number;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ name, focused, size }) => {
  const theme = useTheme();
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
      {/* Sliding Apple Modern Tint capsule */}
      <Animated.View
        style={[
          styles.activePillCapsule,
          {
            backgroundColor: theme.glass.inset,
            borderColor: theme.rim.mid,
            opacity: bgOpacity,
            transform: [{ scale: anim }],
          },
        ]}
      />

      <Icon
        name={name}
        size={size || 18}
        color={focused ? theme.tint : theme.textMuted}
      />
    </Animated.View>
  );
};

// Custom Tab Button with Spring Feedback on Press using Pressable per DESIGN.md
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
  const theme = useTheme();
  const isSmallScreen = width < 375;

  return (
    <View style={{ flex: 1, backgroundColor: theme.canvas }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
          tabBarStyle: [
            styles.tabBar,
            {
              bottom: Math.max(insets.bottom + 6, 14),
              left: isSmallScreen ? 10 : 14,
              right: isSmallScreen ? 10 : 14,
              backgroundColor: theme.glass.lens,
              borderColor: theme.rim.mid,
            },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarBackground: () =>
            Platform.OS === 'web' ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: theme.glass.lens,
                    // @ts-ignore
                    backdropFilter: 'blur(28px) saturate(150%)',
                  },
                ]}
              />
            ) : Platform.OS === 'android' ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: 'rgba(29, 29, 31, 0.92)',
                    borderRadius: radius.xl,
                  },
                ]}
              />
            ) : (
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
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
            title: 'Ringkasan',
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon name="LayoutDashboard" focused={focused} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Akun',
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon name="Landmark" focused={focused} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: 'Portofolio',
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon name="TrendingUp" focused={focused} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="sync"
          options={{
            title: 'Sinkron',
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
    borderWidth: 1,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
