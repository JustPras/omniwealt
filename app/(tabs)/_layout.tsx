import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Tabs } from 'expo-router';
import {
  StyleSheet,
  View,
  Platform,
  useWindowDimensions,
  Animated,
  Pressable,
  Easing,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../src/components/common/icon';
import { triggerHaptic } from '../../src/utils/haptics';
import { useTheme, radius, shadow, motion, Theme, themes, isDarkTheme, Colors } from '../../src/theme/tokens';

interface AnimatedTabIconProps {
  name: IconName;
  focused: boolean;
  isDark: boolean;
  size?: number;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = React.memo(({ name, focused, isDark, size }) => {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      tension: 190,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [focused, anim]);

  const iconScale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.95, 1.12, 1.05],
  });

  const iconTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, -1.5],
  });

  // Dynamic Icon Contrast: Champagne Gold when focused, Natural Titanium when unfocused
  const iconColor = focused
    ? Colors.palette.champagneGold
    : Colors.palette.naturalTitanium;

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
        },
      ]}
    >
      <Icon
        name={name}
        size={size || 18}
        color={iconColor}
      />
    </Animated.View>
  );
});

const TAB_ICONS: Record<string, IconName> = {
  index: 'LayoutDashboard',
  accounts: 'Landmark',
  portfolio: 'TrendingUp',
  sync: 'RefreshCw',
};

interface TabBarButtonProps {
  route: any;
  index: number;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  label: string;
  theme: Theme;
  isDark: boolean;
}

const TabBarButton: React.FC<TabBarButtonProps> = React.memo(
  ({ route, isFocused, onPress, onLongPress, label, theme, isDark }) => {
    const pressScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      Animated.spring(pressScale, {
        toValue: 0.9,
        tension: 260,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }, [pressScale]);

    const handlePressOut = useCallback(() => {
      Animated.spring(pressScale, {
        toValue: 1,
        tension: motion.spring.settle.tension,
        friction: motion.spring.settle.friction,
        useNativeDriver: true,
      }).start();
    }, [pressScale]);

    const iconName: IconName = TAB_ICONS[route.name] || 'LayoutDashboard';

    const labelColor = isFocused
      ? Colors.palette.champagneGold
      : Colors.palette.naturalTitanium;

    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
        {...({
          role: 'tab',
          'aria-label': label,
        } as any)}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.tabItemPressable}
      >
        <Animated.View
          style={[
            styles.tabItemContent,
            {
              transform: [{ scale: pressScale }],
            },
          ]}
        >
          <AnimatedTabIcon name={iconName} focused={isFocused} isDark={isDark} size={18} />
          <Animated.Text
            style={[
              styles.tabBarLabel,
              {
                color: labelColor,
                fontWeight: isFocused ? '700' : '500',
              },
            ]}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    );
  }
);

const TabBarBackground = React.memo(({ theme, isDark }: { theme: Theme; isDark: boolean }) => {
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(20, 20, 18, 0.82)',
            // @ts-ignore
            backdropFilter: 'blur(20px) saturate(190%)',
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
            backgroundColor: 'rgba(20, 20, 18, 0.92)',
            borderRadius: radius.pill,
          },
        ]}
      />
    );
  }
  return <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />;
});

// Liquid Glass Continuous Tab Bar Component with Champagne Gold Wave Animation
const LiquidGlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  insets,
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isDark = isDarkTheme(theme);

  const [rowWidth, setRowWidth] = useState(0);

  // Position, fluid flow surge & wave shimmer animated values
  const currentPosition = useRef(new Animated.Value(state.index)).current;
  const flowSurge = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const previousIndex = useRef(state.index);

  const numTabs = state.routes.length;
  const effectiveWidth = rowWidth > 0 ? rowWidth : width - (isSmallScreen ? 20 : 28);
  const tabWidth = effectiveWidth / numTabs;

  const capsuleWidth = Math.min(Math.max(tabWidth - 6, 60), 84);
  const capsuleHeight = 52;
  const barHeight = 64;

  const getTabCenterX = useCallback(
    (index: number) => index * tabWidth + (tabWidth - capsuleWidth) / 2,
    [tabWidth, capsuleWidth]
  );

  useEffect(() => {
    const fromIndex = previousIndex.current;
    const toIndex = state.index;

    if (fromIndex !== toIndex) {
      previousIndex.current = toIndex;
      const distance = Math.abs(toIndex - fromIndex);
      const maxStretch = Math.min(1.0 + distance * 0.32, 1.95);

      waveAnim.setValue(0);

      Animated.parallel([
        Animated.spring(currentPosition, {
          toValue: toIndex,
          tension: 165,
          friction: 14,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flowSurge, {
            toValue: maxStretch,
            duration: 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(flowSurge, {
            toValue: 0,
            tension: 185,
            friction: 13,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.bezier(0.2, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state.index, currentPosition, flowSurge, waveAnim]);

  const inputRange = useMemo(() => state.routes.map((_, i) => i), [numTabs]);
  const outputRange = useMemo(
    () => state.routes.map((_, i) => getTabCenterX(i)),
    [numTabs, getTabCenterX]
  );

  const translateX = currentPosition.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  });

  const scaleX = flowSurge.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.14],
  });

  const scaleY = flowSurge.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 0.90],
  });

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          bottom: Math.max(insets.bottom + 6, 14),
          left: isSmallScreen ? 10 : 14,
          right: isSmallScreen ? 10 : 14,
        },
      ]}
    >
      <TabBarBackground theme={theme} isDark={isDark} />

      <View
        style={styles.tabRow}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - rowWidth) > 1) {
            setRowWidth(w);
          }
        }}
      >
        {/* Continuous Flowing Liquid Water Glass Capsule */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.liquidCapsuleWrapper,
            {
              width: capsuleWidth,
              height: capsuleHeight,
              top: (barHeight - capsuleHeight) / 2,
              transform: [{ translateX }, { scaleX }, { scaleY }],
            },
          ]}
        >
          {/* Inner clipped liquid container for wave shimmer and water lens */}
          <View style={styles.liquidInnerContainer}>
            {/* Specular Water Meniscus Arc on Top Rim */}
            <View style={styles.specularGlossGlint} />
          </View>

          {/* Ambient Glowing Bottom Active Gold Droplet */}
          <View style={styles.liquidActiveDot} />
        </Animated.View>

        {/* Interactive Tab Buttons with min 44x44px touch targets */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              triggerHaptic('selection');
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabBarButton
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              label={label}
              theme={theme}
              isDark={isDark}
            />
          );
        })}
      </View>
    </View>
  );
};

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tabs
        tabBar={(props) => <LiquidGlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          sceneStyleInterpolator: ({ current }) => ({
            sceneStyle: {
              opacity: current.progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-26, 0, 26],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          }),
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: 220,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            },
          },
          lazy: false,
          freezeOnBlur: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Ringkasan',
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Akun',
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: 'Portofolio',
          }}
        />
        <Tabs.Screen
          name="sync"
          options={{
            title: 'Sinkron',
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    height: 64,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(20, 20, 18, 0.85)',
    ...shadow.e2,
    overflow: 'hidden',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  liquidCapsuleWrapper: {
    position: 'absolute',
    borderRadius: radius.pill,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.palette.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    shadowOpacity: 0.35,
    elevation: 6,
  },
  liquidInnerContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderColor: 'rgba(212, 175, 55, 0.45)',
    overflow: 'hidden',
  },
  specularGlossGlint: {
    position: 'absolute',
    top: 0,
    left: '8%',
    right: '8%',
    height: 2.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212, 175, 55, 0.75)',
  },
  liquidActiveDot: {
    position: 'absolute',
    bottom: 3.5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.palette.champagneGold,
    shadowColor: Colors.palette.champagneGold,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.95,
    shadowRadius: 5,
    elevation: 3,
  },
  tabItemPressable: {
    flex: 1,
    minHeight: 44,
    minWidth: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 22,
    marginBottom: 2,
  },
  tabBarLabel: {
    fontSize: 10.5,
    letterSpacing: -0.2,
    marginTop: 1,
  },
});
