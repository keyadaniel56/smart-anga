// src/context/LanguageContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import en from '../i18n/en.json';
import sw from '../i18n/sw.json';

const translations: Record<string, Record<string, unknown>> = { en, sw };

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (_, fallback) => fallback || '',
});

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('smart-anga-lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const handleSetLanguage = useCallback((lang: string) => {
    setLanguage(lang);
    try {
      localStorage.setItem('smart-anga-lang', lang);
    } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    // Try current language first, then English, then fallback, then raw key
    const dict = translations[language];
    if (dict) {
      const val = getNestedValue(dict, key);
      if (val !== undefined) return val;
    }
    if (language !== 'en') {
      const enDict = translations.en;
      if (enDict) {
        const val = getNestedValue(enDict, key);
        if (val !== undefined) return val;
      }
    }
    return fallback ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
