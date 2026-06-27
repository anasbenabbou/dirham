import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeMode, darkTheme, lightTheme } from '../constants/theme';
import { getSetting, setSetting } from '../db/settings';

interface ThemeCtx {
  theme: Theme;
  /** User preference: 'dark' | 'light' | 'system' */
  mode: ThemeMode;
  /** What's actually rendered after resolving 'system' */
  scheme: 'dark' | 'light';
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');

  // Hydrate persisted preference once.
  useEffect(() => {
    const saved = getSetting('themeMode');
    if (saved === 'dark' || saved === 'light' || saved === 'system') setModeState(saved);
  }, []);

  function setMode(m: ThemeMode) {
    setModeState(m);
    setSetting('themeMode', m);
  }

  const scheme: 'dark' | 'light' =
    mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;

  const value = useMemo<ThemeCtx>(
    () => ({ theme: scheme === 'light' ? lightTheme : darkTheme, mode, scheme, setMode }),
    [scheme, mode]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}

/** For the settings screen / status bar — exposes mode controls. */
export function useThemeMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  const { mode, scheme, setMode } = ctx;
  return { mode, scheme, setMode };
}
