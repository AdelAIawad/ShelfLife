import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext();
const STORAGE_KEY = 'shelflife-theme';

function getInitialTheme() {
  // 1. user-saved preference (always wins)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  }
  // 2. Default for first-time visitors: LIGHT
  //    (matches the brand's "warm cream library" aesthetic)
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Reflect on <html> so CSS [data-theme="light"] can target it
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // Update meta theme-color for mobile chrome bar
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F4F1EA' : '#0F1624');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
