import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, TranslationKey } from '../translations';

export type Language = 'bn' | 'en';
export type LanguagePreference = Language | 'auto';

interface LanguageContextType {
  language: Language;
  preference: LanguagePreference;
  setLanguage: (lang: Language) => void;
  setPreference: (pref: LanguagePreference) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<LanguagePreference>(() => {
    return (localStorage.getItem('language_preference') as LanguagePreference) || 'en';
  });

  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    localStorage.setItem('language_preference', preference);
    
    if (preference === 'auto') {
      const browserLang = navigator.language.split('-')[0];
      if (['bn', 'en'].includes(browserLang)) {
        setLanguage(browserLang as Language);
      } else {
        setLanguage('en'); // fallback for auto
      }
    } else {
      setLanguage(preference);
    }
  }, [preference]);

  const setPreference = (pref: LanguagePreference) => {
    setPreferenceState(pref);
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, preference, setLanguage, setPreference, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
