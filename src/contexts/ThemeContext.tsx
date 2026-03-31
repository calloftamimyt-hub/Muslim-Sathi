import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'Light' | 'Dark' | 'System';
type ColorTheme = 'Green' | 'Blue' | 'Gold' | 'Dark Green';
type FontSize = 'Small' | 'Medium' | 'Large';
type ArabicFont = 'Amiri' | 'Scheherazade' | 'Traditional';
type NormalFont = 'Bengali' | 'Inter' | 'Roboto';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorTheme: ColorTheme;
  fontSize: FontSize;
  arabicFont: ArabicFont;
  normalFont: NormalFont;
  setThemeMode: (mode: ThemeMode) => void;
  setColorTheme: (theme: ColorTheme) => void;
  setFontSize: (size: FontSize) => void;
  setArabicFont: (font: ArabicFont) => void;
  setNormalFont: (font: NormalFont) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'islamic_app_theme_settings';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'System';
    const saved = localStorage.getItem(`${STORAGE_KEY}_mode`);
    return (saved as ThemeMode) || 'System';
  });

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    if (typeof window === 'undefined') return 'Green';
    const saved = localStorage.getItem(`${STORAGE_KEY}_color`);
    return (saved as ColorTheme) || 'Green';
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window === 'undefined') return 'Medium';
    const saved = localStorage.getItem(`${STORAGE_KEY}_font_size`);
    return (saved as FontSize) || 'Medium';
  });

  const [arabicFont, setArabicFont] = useState<ArabicFont>(() => {
    if (typeof window === 'undefined') return 'Amiri';
    const saved = localStorage.getItem(`${STORAGE_KEY}_arabic_font`);
    return (saved as ArabicFont) || 'Amiri';
  });

  const [normalFont, setNormalFont] = useState<NormalFont>(() => {
    if (typeof window === 'undefined') return 'Bengali';
    const saved = localStorage.getItem(`${STORAGE_KEY}_normal_font`);
    return (saved as NormalFont) || 'Bengali';
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_mode`, themeMode);
    localStorage.setItem(`${STORAGE_KEY}_color`, colorTheme);
    localStorage.setItem(`${STORAGE_KEY}_font_size`, fontSize);
    localStorage.setItem(`${STORAGE_KEY}_arabic_font`, arabicFont);
    localStorage.setItem(`${STORAGE_KEY}_normal_font`, normalFont);

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'System') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, colorTheme, fontSize, arabicFont, normalFont]);

  const applyTheme = () => {
    const root = document.documentElement;
    console.log('Applying theme:', themeMode);
    
    // Apply Dark/Light Mode
    if (themeMode === 'Dark' || (themeMode === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      console.log('Added dark class');
    } else {
      root.classList.remove('dark');
      console.log('Removed dark class');
    }

    // Apply Color Theme
    const colors = {
      'Green': { primary: '#10b981', primaryDark: '#059669', primaryLight: '#34d399' },
      'Blue': { primary: '#3b82f6', primaryDark: '#2563eb', primaryLight: '#60a5fa' },
      'Gold': { primary: '#f59e0b', primaryDark: '#d97706', primaryLight: '#fbbf24' },
      'Dark Green': { primary: '#064e3b', primaryDark: '#064e3b', primaryLight: '#065f46' },
    };

    const selectedColors = colors[colorTheme];
    root.style.setProperty('--theme-color-primary', selectedColors.primary);
    root.style.setProperty('--theme-color-primary-dark', selectedColors.primaryDark);
    root.style.setProperty('--theme-color-primary-light', selectedColors.primaryLight);

    // Apply Font Size
    const fontSizes = {
      'Small': '14px',
      'Medium': '16px',
      'Large': '18px',
    };
    root.style.setProperty('--base-font-size', fontSizes[fontSize]);

    // Apply Normal Font Family
    const normalFonts = {
      'Bengali': '"Noto Sans Bengali", ui-sans-serif, system-ui, sans-serif',
      'Inter': '"Inter", ui-sans-serif, system-ui, sans-serif',
      'Roboto': '"Roboto", ui-sans-serif, system-ui, sans-serif',
    };
    root.style.setProperty('--theme-font-sans', normalFonts[normalFont]);

    // Apply Arabic Font Family
    const arabicFonts = {
      'Amiri': '"Amiri", serif',
      'Scheherazade': '"Scheherazade New", serif',
      'Traditional': '"Traditional Arabic", serif',
    };
    root.style.setProperty('--theme-font-arabic', arabicFonts[arabicFont]);
  };

  return (
    <ThemeContext.Provider value={{ 
      themeMode, colorTheme, fontSize, arabicFont, normalFont,
      setThemeMode, setColorTheme, setFontSize, setArabicFont, setNormalFont 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
