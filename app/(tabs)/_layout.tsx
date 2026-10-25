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

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = React.memo(({ name, focused, size }) => {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      tension: 180,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [focused, anim]);

  const iconScale = anim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.92, 1.15, 1.05],
  });

  const iconTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -1.5],
  });

  const capsuleScale = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.55, 1.1, 1],
  });

  const capsuleOpacity = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });

  const dotScale = anim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0.4, 1],
  });

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
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
            opacity: capsuleOpacity,
            transform: [{ scale: capsuleScale }],
          },
        ]}
      />

      <Icon
        name={name}
        size={size || 18}
        color={focused ? theme.tint : theme.textMuted}
      />

      {/* Subtle glowing active dot */}
      <Animated.View
        style={[
          styles.activeDot,
          {
            backgroundColor: theme.tint,
            opacity: anim,
            transform: [{ scale: dotScale }],
          },
        ]}
      />
    </Animated.View>
  );
});

// Custom Tab Button with Spring Feedback on Press using Pressable per DESIGN.md
const AnimatedTabBarButton = React.memo((props: any) => {
  const { children, onPress, style } = props;
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = React.useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.88,
      tension: 260,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  const handlePressOut = React.useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      tension: motion.spring.settle.tension,
      friction: motion.spring.settle.friction,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

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
});

const TabBarBackground = React.memo(({ theme }: { theme: any }) => {
  if (Platform.OS === 'web') {
    return (
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
    );
  }
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(29, 29, 31, 0.94)',
            borderRadius: radius.xl,
          },
        ]}
      />
    );
  }
  return <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />;
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const isSmallScreen = width < 375;

  const screenOptions = React.useMemo(
    () => ({
      headerShown: false,
      animation: 'fade' as const,
      lazy: false,
      freezeOnBlur: true,
      detachInactiveScreens: false,
      tabBarActiveTintColor: theme.tint,
      tabBarInactiveTintColor: theme.textMuted,
      tabBarButton: (props: any) => <AnimatedTabBarButton {...props} />,
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
      tabBarBackground: () => <TabBarBackground theme={theme} />,
    }),
    [theme, insets.bottom, isSmallScreen]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.canvas }}>
      <Tabs
        screenOptions={screenOptions}
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
  activeDot: {
    position: 'absolute',
    bottom: -3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
