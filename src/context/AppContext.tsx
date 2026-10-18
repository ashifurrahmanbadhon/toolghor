'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'bn' | 'en';
type Theme = 'light' | 'dark';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const applyTheme = (t: Theme) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      document.body?.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body?.classList.remove('dark');
    }
  };

  const updateDocumentTitle = (currentLang: Language) => {
    if (typeof document === 'undefined') return;
    const path = window.location.pathname;
    if (path === '/' || path === '') {
      document.title = currentLang === 'bn'
        ? 'ToolGhor – দৈনন্দিন কাজের সব টুল'
        : 'ToolGhor – Everyday tools, now on one platform';
    }
  };

  useEffect(() => {
    try {
      // 1. Language hydration (default: 'en')
      const savedLang = (localStorage.getItem('lang') || localStorage.getItem('toolghor_lang')) as Language;
      const initialLang: Language = (savedLang === 'bn' || savedLang === 'en') ? savedLang : 'en';
      setLangState(initialLang);
      document.documentElement.lang = initialLang;
      updateDocumentTitle(initialLang);

      // 2. Default dark theme hydration (defaults to dark if not set)
      const savedTheme = (localStorage.getItem('theme') || localStorage.getItem('toolghor_theme')) as Theme;
      const initialTheme = savedTheme === 'light' ? 'light' : 'dark';
      setThemeState(initialTheme);
      applyTheme(initialTheme);
    } catch {
      applyTheme('dark');
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('lang', newLang);
      localStorage.setItem('toolghor_lang', newLang);
      document.documentElement.lang = newLang;
      updateDocumentTitle(newLang);
      const w = window as any;
      if (w.UI) {
        w.UI.lang = newLang;
        w.UI.digits = newLang === 'bn' ? 'bn' : 'en';
        if (typeof w.UI.updateInAppBanner === 'function') {
          w.UI.updateInAppBanner();
        }
      }
    } catch {}
  };

  const toggleLang = () => {
    setLang(lang === 'bn' ? 'en' : 'bn');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
      localStorage.setItem('toolghor_theme', newTheme);
      applyTheme(newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        theme,
        setTheme,
        toggleTheme,
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


