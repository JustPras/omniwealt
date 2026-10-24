import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { WealthProvider, useWealth } from '../src/store/wealth-context';
import { AmbientBackground } from '../src/components/common/ambient-background';
import { LuxuryLoader } from '../src/components/common/luxury-loader';
import { color, motion } from '../src/theme/tokens';

// Ensure React Navigation theme is strictly dark obsidian
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: color.obsidian,
    card: color.obsidian,
    text: color.text,
    border: color.hairline,
  },
};

function RootContent() {
  const { isHydrated } = useWealth();
  const [showSplash, setShowSplash] = useState(true);

  // Cinematic exit transition values
  const splashFadeAnim = useRef(new Animated.Value(1)).current;
  const splashScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isHydrated) {
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(splashFadeAnim, {
            toValue: 0,
            duration: motion.count,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(splashScaleAnim, {
            toValue: 1.06,
            duration: motion.count,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setShowSplash(false);
      });
    }
  }, [isHydrated, splashFadeAnim, splashScaleAnim]);

  return (
    <ThemeProvider value={CustomDarkTheme}>
      <View style={styles.container}>
        <StatusBar style="light" translucent backgroundColor={color.obsidian} />
        <AmbientBackground />

        {/* Root Content */}
        <View style={styles.contentWrapper}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.obsidian },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </View>

        {/* Cold Start Luxury Loader (Pure Obsidian Glass) */}
        {showSplash && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.splashOverlay,
              {
                opacity: splashFadeAnim,
                transform: [{ scale: splashScaleAnim }],
              },
            ]}
            pointerEvents={isHydrated ? 'none' : 'auto'}
          >
            <LuxuryLoader
              fullscreen
              title="OmniWealth"
              subtitle="Menyiapkan portofolio..."
            />
          </Animated.View>
        )}
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={styles.safeArea}>
      <WealthProvider>
        <RootContent />
      </WealthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: color.obsidian,
  },
  container: {
    flex: 1,
    backgroundColor: color.obsidian,
  },
  contentWrapper: {
    flex: 1,
  },
  splashOverlay: {
    zIndex: 9999,
    backgroundColor: color.obsidian,
  },
});
