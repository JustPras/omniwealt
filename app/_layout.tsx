import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WealthProvider, useWealth } from '../src/store/wealth-context';
import { AmbientBackground } from '../src/components/common/ambient-background';
import { LuxuryLoader } from '../src/components/common/luxury-loader';

function RootContent() {
  const { isHydrated } = useWealth();
  const [showSplash, setShowSplash] = useState(true);
  const splashFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isHydrated) {
      // Smooth luxury fade-out transition after hydration
      Animated.timing(splashFadeAnim, {
        toValue: 0,
        duration: 400,
        delay: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }
  }, [isHydrated, splashFadeAnim]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <AmbientBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
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
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WealthProvider>
        <RootContent />
      </WealthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  splashOverlay: {
    zIndex: 9999,
  },
});
