import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WealthProvider } from '../src/store/wealth-context';
import { AmbientBackground } from '../src/components/common/ambient-background';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WealthProvider>
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
        </View>
      </WealthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
});
