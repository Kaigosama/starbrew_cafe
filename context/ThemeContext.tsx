import { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { C, CD } from '../constants/theme';

type Colors = typeof C;

interface ThemeContextValue {
  colors: Colors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: C,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [manualDark, setManualDark] = useState<boolean | null>(null);
  const isDark = manualDark !== null ? manualDark : scheme === 'dark';

  function toggleTheme() {
    setManualDark(prev => !(prev !== null ? prev : scheme === 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ colors: isDark ? CD : C, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
