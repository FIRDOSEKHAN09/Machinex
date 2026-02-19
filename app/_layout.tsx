import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/src/context/AuthContext';
import { SubscriptionProvider } from '@/src/context/SubscriptionContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0f172a' },
              animation: 'slide_from_right',
            }}
          />
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
