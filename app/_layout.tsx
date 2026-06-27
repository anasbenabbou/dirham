import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDb } from '../db/schema';
import { ThemeProvider, useTheme, useThemeMode } from '../theme/ThemeProvider';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

// Run synchronously before any component mounts so the settings table
// exists when ThemeProvider reads it in its first useEffect.
initDb();

function Root() {
  const theme = useTheme();
  const { scheme } = useThemeMode();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: 'slide_from_right',
        }}
      />
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
