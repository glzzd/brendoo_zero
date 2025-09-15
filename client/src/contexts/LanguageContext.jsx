import React, { createContext, useContext, useState, useEffect } from 'react';
import azTranslations from '../locales/az.json';
import enTranslations from '../locales/en.json';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to Azerbaijani
    return localStorage.getItem('language') || 'az';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'az' ? 'en' : 'az');
  };

  const t = (key) => {
    const translations = language === 'az' ? azTranslations : enTranslations;
    return translations[key] || key;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isAzerbaijani: language === 'az',
    isEnglish: language === 'en'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};