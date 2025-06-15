import React, { createContext, useContext, useState, useCallback } from 'react';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';

const ThemeContext = createContext();

const themes = {
  light: {
    name: 'light',
    colors: {
      background: '#ffffff',
      text: '#333333',
      primary: '#007bff',
      secondary: '#6c757d',
      border: '#e0e0e0',
      hover: '#f5f5f5',
      error: '#ff4d4f',
      errorBg: '#fff2f0',
      errorBorder: '#ffccc7',
      shadow: 'rgba(0, 0, 0, 0.05)',
      loading: '#f3f3f3',
      loadingActive: '#007bff'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      background: '#1a1a1a',
      text: '#ffffff',
      primary: '#0d6efd',
      secondary: '#adb5bd',
      border: '#404040',
      hover: '#2d2d2d',
      error: '#ff6b6b',
      errorBg: '#2d1f1f',
      errorBorder: '#ff6b6b',
      shadow: 'rgba(0, 0, 0, 0.2)',
      loading: '#2d2d2d',
      loadingActive: '#0d6efd'
    }
  },
  highContrast: {
    name: 'highContrast',
    colors: {
      background: '#000000',
      text: '#ffffff',
      primary: '#ffff00',
      secondary: '#ffffff',
      border: '#ffffff',
      hover: '#333333',
      error: '#ff0000',
      errorBg: '#000000',
      errorBorder: '#ff0000',
      shadow: 'rgba(255, 255, 255, 0.2)',
      loading: '#000000',
      loadingActive: '#ffff00'
    }
  }
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('light');

  const toggleTheme = useCallback(() => {
    setCurrentTheme(prev => {
      switch (prev) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'highContrast';
        case 'highContrast':
          return 'light';
        default:
          return 'light';
      }
    });
  }, []);

  const theme = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currentTheme }}>
      <EmotionThemeProvider theme={theme}>
        {children}
      </EmotionThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext); 