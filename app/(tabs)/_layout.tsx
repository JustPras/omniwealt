import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform, useWindowDimensions, Animated, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../src/components/common/icon';
import { triggerHaptic } from '../../src/utils/haptics';

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
      tension: 75,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [focused, anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.14],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -2],
  });

  const bgOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const dotScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      {/* Animated glowing pill capsule behind active icon */}
      <Animated.View
        style={[
          styles.activeIconGlow,
          {
            opacity: bgOpacity,
            transform: [{ scale: anim }],
          },
        ]}
      />

      <Icon
        name={name}
        size={size || 19}
        color={focused ? '#38BDF8' : '#64748B'}
      />

      {/* Micro indicator dot below active icon */}
      <Animated.View
        style={[
          styles.activeDot,
          {
            opacity: bgOpacity,
            transform: [{ scale: dotScale }],
          },
        ]}
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
      toValue: 0.90,
      tension: 140,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      tension: 140,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.88}
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
    </TouchableOpacity>
  );
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;

  return (
    <View style={{ flex: 1, backgroundColor: '#080C14' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#64748B',
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
          ) : (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(8, 12, 20, 0.82)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
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
    width: 38,
    height: 32,
    position: 'relative',
  },
  activeIconGlow: {
    position: 'absolute',
    width: 38,
    height: 30,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  webTabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 20, 0.88)',
    // @ts-ignore
    backdropFilter: 'blur(24px)',
  },
});
