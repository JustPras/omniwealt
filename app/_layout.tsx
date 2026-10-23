import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
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
  const splashFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isHydrated) {
      // Smooth luxury fade-out transition after hydration
      Animated.timing(splashFadeAnim, {
        toValue: 0,
        duration: 350,
        delay: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }
  }, [isHydrated, splashFadeAnim]);

  return (
    <ThemeProvider value={CustomDarkTheme}>
      <View style={styles.container}>
        <StatusBar style="light" translucent backgroundColor="#080C14" />
        <AmbientBackground />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#080C14' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>

        {/* High-End Smooth Initial Loading Screen */}
        {showSplash && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.splashOverlay,
              { opacity: splashFadeAnim },
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
  splashOverlay: {
    zIndex: 9999,
    backgroundColor: '#080C14',
  },
});
