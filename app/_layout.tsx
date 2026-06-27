import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { initDb } from '../db/schema';

// Suppress expo-router internal SafeAreaView deprecation warning (their bug, not ours)
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export default function RootLayout() {
  useEffect(() => { initDb(); }, []);
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
