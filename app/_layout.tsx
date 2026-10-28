import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { WealthProvider, useWealth } from '../src/store/wealth-context';
import { AmbientBackground } from '../src/components/common/ambient-background';
import { LuxuryLoader } from '../src/components/common/luxury-loader';
import { NotificationToast } from '../src/components/common/notification-toast';
import { NotificationSyncService } from '../src/services/notification-sync-service';
import { color, motion, AppThemeProvider, useThemeController } from '../src/theme/tokens';

function RootContent() {
  const { isHydrated, processIncomingNotification, notificationConfig } = useWealth();
  const { theme, isDark } = useThemeController();
  const [showSplash, setShowSplash] = useState(true);

  // Dynamic Navigation Theme matching active dark/light palette
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: 'transparent',
      card: 'transparent',
      text: theme.text,
      border: theme.hairline,
    },
  };

  // Cinematic exit transition values
  const splashFadeAnim = useRef(new Animated.Value(1)).current;
  const splashScaleAnim = useRef(new Animated.Value(1)).current;

  // Deep Link Inbound Listener for Android Notification Auto-Capture (MacroDroid / Tasker)
  // Protected with local security handshake token validation against unauthorized injection
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      try {
        const parsed = Linking.parse(event.url);
        if (
          parsed.scheme === 'omniwealth' &&
          (parsed.hostname === 'notification' || parsed.path === 'notification')
        ) {
          // Security Validation (Feature enabled, Token handshake match, Payload format)
          const validation = NotificationSyncService.validateDeepLink(
            parsed.queryParams,
            notificationConfig
          );

          if (!validation.isValid) {
            console.warn('[Security] Unauthorized deep link rejected:', validation.reason);
            return;
          }

          const text = parsed.queryParams?.text as string;
          const app = parsed.queryParams?.app as string;
          processIncomingNotification(text, app);
        }
      } catch (e) {
        console.warn('Failed to parse incoming deep link url:', e);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [processIncomingNotification, notificationConfig]);

  // Smooth splash exit transition when logo formation reaches 100%
  const handleSplashFinish = useCallback(() => {
    Animated.parallel([
      Animated.timing(splashFadeAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(splashScaleAnim, {
        toValue: 1.06,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSplash(false);
    });
  }, [splashFadeAnim, splashScaleAnim]);

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <StatusBar
          style={isDark ? 'light' : 'dark'}
          translucent
          backgroundColor="transparent"
        />
        <AmbientBackground />

        {/* Root Content */}
        <View style={styles.contentWrapper}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.canvas },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </View>

        {/* Global Floating Auto-Sync Notification Toast */}
        <NotificationToast />

        {/* Cold Start Luxury Loader (Pure Obsidian Glass) */}
        {showSplash && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.splashOverlay,
              {
                opacity: splashFadeAnim,
                transform: [{ scale: splashScaleAnim }],
                backgroundColor: theme.canvas,
              },
            ]}
            pointerEvents={isHydrated ? 'none' : 'auto'}
          >
            <LuxuryLoader
              fullscreen
              title="OMNIWEALTH"
              isHydrated={isHydrated}
              onFinish={handleSplashFinish}
            />
          </Animated.View>
        )}
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <SafeAreaProvider style={styles.safeArea}>
        <WealthProvider>
          <RootContent />
        </WealthProvider>
      </SafeAreaProvider>
    </AppThemeProvider>
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
    backgroundColor: 'transparent',
  },
});
