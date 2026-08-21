import React, { createContext, useContext, useState, useMemo } from 'react';
import enTranslations from '../i18n/en.json';
import swTranslations from '../i18n/sw.json';

export type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, fallback?: string) => string;
  isSwahili: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries: Record<Language, any> = {
  en: enTranslations,
  sw: swTranslations
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('smartanga_language');
      return (saved === 'sw' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('smartanga_language', lang);
    } catch {
      // localStorage unavailable — silently continue
    }
  };

  const getNestedValue = (obj: any, path: string): string | undefined => {
    if (!obj) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  };

  const t = (keyPath: string, fallback?: string): string => {
    const currentDict = dictionaries[language];
    const val = getNestedValue(currentDict, keyPath);
    
    // If value exists in current dictionary and is not empty
    if (val && val.trim().length > 0) {
      return val;
    }

    // Fallback to English dictionary
    const enVal = getNestedValue(dictionaries.en, keyPath);
    if (enVal && enVal.trim().length > 0) {
      return enVal;
    }

    return fallback || keyPath;
  };

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    isSwahili: language === 'sw'
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export const useLanguage = useTranslation;
