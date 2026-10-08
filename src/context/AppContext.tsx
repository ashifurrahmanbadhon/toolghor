'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'bn' | 'en';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('bn');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('toolghor_lang') as Language;
      if (savedLang === 'bn' || savedLang === 'en') {
        setLangState(savedLang);
      }
    } catch {}
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('toolghor_lang', newLang);
      document.documentElement.lang = newLang;
    } catch {}
  };

  const toggleLang = () => {
    setLang(lang === 'bn' ? 'en' : 'bn');
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
