import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDb } from '../db/schema';
import { runStartupTasks, announceStartup } from '../lib/bootstrap';
import { ThemeProvider, useTheme, useThemeMode } from '../theme/ThemeProvider';
import { ToastProvider } from '../components/ui';
import { useCategoriesStore } from '../store/useCategoriesStore';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'expo-notifications',
  'Push notifications',
  'removed from Expo Go',
]);

// Run synchronously before any component mounts so all tables exist and
// balances are reconciled before any screen reads the DB.
initDb();
const _startup = runStartupTasks();
useCategoriesStore.getState().load(); // populate categories before any screen renders

function Root() {
  const theme = useTheme();
  const { scheme } = useThemeMode();

  // Fire any startup notifications once mounted.
  useEffect(() => { announceStartup(_startup); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bg },
            animation: 'slide_from_right',
          }}
        />
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
