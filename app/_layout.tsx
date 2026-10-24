import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { WealthProvider, useWealth } from '../src/store/wealth-context';
import { AmbientBackground } from '../src/components/common/ambient-background';
import { LuxuryLoader } from '../src/components/common/luxury-loader';

// Ensure React Navigation theme is strictly dark obsidian
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#080C14',
    card: '#080C14',
    text: '#F8FAFC',
    border: 'rgba(255, 255, 255, 0.08)',
  },
};

function RootContent() {
  const { isHydrated } = useWealth();
  const [showSplash, setShowSplash] = useState(true);

  // Cinematic exit transition values
  const splashFadeAnim = useRef(new Animated.Value(1)).current;
  const splashScaleAnim = useRef(new Animated.Value(1)).current;
  const contentFadeAnim = useRef(new Animated.Value(0.92)).current;
  const contentScaleAnim = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    if (isHydrated) {
      // Cinematic dissolving reveal: Splash scales up & fades, Content blooms into place
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(splashFadeAnim, {
            toValue: 0,
            duration: 480,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(splashScaleAnim, {
            toValue: 1.08,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(contentScaleAnim, {
            toValue: 1,
            duration: 480,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setShowSplash(false);
      });
    }
  }, [isHydrated, splashFadeAnim, splashScaleAnim, contentFadeAnim, contentScaleAnim]);

  return (
    <ThemeProvider value={CustomDarkTheme}>
      <View style={styles.container}>
        <StatusBar style="light" translucent backgroundColor="#080C14" />
        <AmbientBackground />

        {/* Animated Root Content with subtle scale & opacity entrance */}
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: contentFadeAnim,
              transform: [{ scale: contentScaleAnim }],
            },
          ]}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#080C14' },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </Animated.View>

        {/* High-End Fluid Organic Initial Loading Screen */}
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
              title="OMNIWEALTH"
              subtitle="Menyiapkan Portofolio & Harga Pasar..."
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
    backgroundColor: '#080C14',
  },
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  contentWrapper: {
    flex: 1,
  },
  splashOverlay: {
    zIndex: 9999,
    backgroundColor: '#080C14',
  },
});
