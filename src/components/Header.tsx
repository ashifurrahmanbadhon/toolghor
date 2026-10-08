'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { Search, Globe, Shield, Sparkles } from 'lucide-react';

export default function Header() {
  const { lang, toggleLang, searchQuery, setSearchQuery } = useApp();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
              ToolGhor
            </span>
            <span className="text-[10px] -mt-1 font-medium text-zinc-500 dark:text-zinc-400">
              {lang === 'bn' ? 'দৈনন্দিন কাজের টুল' : 'Everyday Utilities'}
            </span>
          </div>
        </Link>

        {/* Search Bar in Header */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'টুলস খুঁজুন (যেমন: পিডিএফ মার্জ, ছবি ক্রপ, বিএমআই)...'
                  : 'Search tools (e.g. merge pdf, crop image, bmi)...'
              }
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-100/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-full outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          {/* Admin Console Link */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
