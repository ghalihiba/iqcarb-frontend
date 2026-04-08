import {
  createContext, useContext,
  useState, useEffect,
  useCallback, type ReactNode
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme:       Theme;
  isDark:      boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {

  const getInitialTheme = (): Theme => {
    const saved = localStorage.getItem('iqcarb-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('iqcarb-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark: theme === 'dark',
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme hors ThemeProvider');
  return ctx;
};