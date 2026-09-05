'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, TRANSLATIONS } from './translations';
export type { SupportedLanguage };
import { offlineDb } from '@/lib/db/offlineDb';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    // Read from localStorage or offlineDb
    const saved = localStorage.getItem('sevamitr_lang') as SupportedLanguage | null;
    if (saved && (saved === 'en' || saved === 'as' || saved === 'bn' || saved === 'hi')) {
      setLanguageState(saved);
    } else {
      const patient = offlineDb.getPatient();
      if (patient?.primaryLanguage) {
        setLanguageState(patient.primaryLanguage as SupportedLanguage);
      }
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sevamitr_lang', lang);
    }
    const patient = offlineDb.getPatient();
    if (patient) {
      patient.primaryLanguage = lang;
      offlineDb.savePatient(patient);
    }
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
