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
import { useTheme, radius, shadow, motion, Theme, themes } from '../../src/theme/tokens';

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
      tension: 190,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [focused, anim]);

  const iconScale = anim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.94, 1.15, 1.05],
  });

  const iconTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -1.5],
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
      <Icon
        name={name}
        size={size || 18}
        color={focused ? theme.tint : theme.textMuted}
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
}

const TabBarButton: React.FC<TabBarButtonProps> = React.memo(
  ({ route, isFocused, onPress, onLongPress, label, theme }) => {
    const pressScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      Animated.spring(pressScale, {
        toValue: 0.88,
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

    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
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
          <AnimatedTabIcon name={iconName} focused={isFocused} size={18} />
          <Animated.Text
            style={[
              styles.tabBarLabel,
              {
                color: isFocused ? theme.tint : theme.textMuted,
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
            backgroundColor: isDark ? 'rgba(29, 29, 31, 0.94)' : 'rgba(245, 245, 247, 0.94)',
            borderRadius: radius.xl,
          },
        ]}
      />
    );
  }
  return <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />;
});

// Liquid Glass Continuous Tab Bar Component
const LiquidGlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  insets,
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isDark = theme.canvas === themes.dark.canvas;

  const [rowWidth, setRowWidth] = useState(0);

  // Position & viscous fluid dynamic values
  const currentPosition = useRef(new Animated.Value(state.index)).current;
  const fluidStretch = useRef(new Animated.Value(0)).current;
  const previousIndex = useRef(state.index);

  const numTabs = state.routes.length;
  const effectiveWidth = rowWidth > 0 ? rowWidth : width - (isSmallScreen ? 20 : 28);
  const tabWidth = effectiveWidth / numTabs;
  const capsuleWidth = Math.min(Math.max(tabWidth - 10, 52), 74);
  const capsuleHeight = 48;
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
      // Fluid dynamic stretch factor based on movement distance
      const stretchFactor = Math.min(1.0 + (distance - 1) * 0.32, 1.7);

      Animated.parallel([
        // Continuous sliding with liquid spring physics
        Animated.spring(currentPosition, {
          toValue: toIndex,
          tension: 175,
          friction: 14,
          useNativeDriver: true,
        }),
        // Viscous fluid squash and stretch impulse
        Animated.sequence([
          Animated.timing(fluidStretch, {
            toValue: stretchFactor,
            duration: 110,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(fluidStretch, {
            toValue: 0,
            tension: 185,
            friction: 12,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [state.index, currentPosition, fluidStretch]);

  // Interpolate continuous sliding translateX
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

  // Viscous fluid mass conservation: stretch horizontally, squash vertically
  const scaleX = fluidStretch.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.26],
  });

  const scaleY = fluidStretch.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 0.88],
  });

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          bottom: Math.max(insets.bottom + 6, 14),
          left: isSmallScreen ? 10 : 14,
          right: isSmallScreen ? 10 : 14,
          backgroundColor: theme.glass.lens,
          borderColor: theme.rim.mid,
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
        {/* Continuous Flowing Liquid Glass Capsule */}
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
          {/* Base Glass Lens with Apple Rim and Glow */}
          <View
            style={[
              styles.liquidGlassLens,
              {
                backgroundColor: isDark
                  ? 'rgba(0, 122, 255, 0.18)'
                  : 'rgba(0, 122, 255, 0.12)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.28)'
                  : 'rgba(0, 122, 255, 0.36)',
                shadowColor: '#007AFF',
                shadowOpacity: isDark ? 0.45 : 0.28,
              },
            ]}
          />

          {/* Internal Luminous Tint Nucleus */}
          <View
            style={[
              styles.liquidNucleus,
              {
                backgroundColor: isDark
                  ? 'rgba(0, 122, 255, 0.22)'
                  : 'rgba(0, 122, 255, 0.16)',
              },
            ]}
          />

          {/* Specular Gloss Glint on Top Rim */}
          <View style={styles.specularGlossGlint} />

          {/* Ambient Glowing Bottom Active Dot */}
          <View
            style={[
              styles.liquidActiveDot,
              {
                backgroundColor: theme.tint,
                shadowColor: theme.tint,
              },
            ]}
          />
        </Animated.View>

        {/* Interactive Tab Buttons */}
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
            />
          );
        })}
      </View>
    </View>
  );
};

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.canvas }}>
      <Tabs
        tabBar={(props) => <LiquidGlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          lazy: false,
          freezeOnBlur: true,
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
    borderRadius: radius.xl,
    borderWidth: 1,
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
  },
  liquidGlassLens: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  liquidNucleus: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 4,
    right: 4,
    borderRadius: radius.pill,
  },
  specularGlossGlint: {
    position: 'absolute',
    top: 2,
    left: '18%',
    right: '18%',
    height: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  liquidActiveDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
  },
  tabItemPressable: {
    flex: 1,
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
    fontSize: 11,
    letterSpacing: -0.2,
    marginTop: 1,
  },
});
