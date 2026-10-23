import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/common/icon';
import { triggerHaptic } from '../../src/utils/haptics';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#64748B',
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
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Icon name="LayoutDashboard" size={size || 19} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Icon name="Landmark" size={size || 19} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Icon name="TrendingUp" size={size || 19} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync SoA',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Icon name="RefreshCw" size={size || 19} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: 64,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(8, 12, 20, 0.80)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    overflow: 'hidden',
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabBarItem: {
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    padding: 4,
    borderRadius: 12,
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  webTabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 20, 0.88)',
    // @ts-ignore
    backdropFilter: 'blur(24px)',
  },
});
