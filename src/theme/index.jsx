import React, { createContext, useContext, useState, useCallback } from 'react';
import { darkColors } from './dark';
import { lightColors } from './light';
import { getTheme, setTheme } from './colors';

export const ThemeContext = createContext({
  isDark: false,
  theme: 'light',
  toggleTheme: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => getTheme() || 'light');

  const toggleTheme = useCallback(() => {
    setThemeMode((prevMode) => {
      const nextMode = prevMode === 'dark' ? 'light' : 'dark';
      setTheme(nextMode);
      return nextMode;
    });
  }, []);

  const activeColors = themeMode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        isDark: themeMode === 'dark',
        theme: themeMode,
        toggleTheme,
        colors: activeColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { useThemeColors } from './useThemeColors';

