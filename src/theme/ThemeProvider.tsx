import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { civicDark, civicLight, type ThemeTokens } from './tokens';

export type AppearancePref = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  t: ThemeTokens;
  appearance: AppearancePref;
  setAppearance: (pref: AppearancePref) => void;
};

const STORAGE_KEY = 'pref.appearance';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [appearance, setAppearanceState] = useState<AppearancePref>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setAppearanceState(v);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
    return {
      t: resolved === 'dark' ? civicDark : civicLight,
      appearance,
      setAppearance: (pref) => {
        setAppearanceState(pref);
        AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
      },
    };
  }, [appearance, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
