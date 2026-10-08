'use client';

import React, { useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolCard from '@/components/ToolCard';
import { CATEGORIES, TOOLS } from '@/data/registry';
import { siteConfig } from '@/data/config';
import { useApp } from '@/context/AppContext';
import {
  Sparkles,
  Search,
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  ArrowRight,
  User,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { lang, searchQuery, setSearchQuery, activeCategory, setActiveCategory } = useApp();

  // Filter tools based on query and category
  const filteredTools = useMemo(() => {
    let list = TOOLS;

    if (activeCategory !== 'all') {
      list = list.filter((t) => t.cats.includes(activeCategory));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.bn.toLowerCase().includes(q) ||
          t.en.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.descEn.toLowerCase().includes(q) ||
          t.keywords.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-emerald-500/5 via-teal-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {lang === 'bn' ? '২৮+ ফ্রি ও প্রাইভেট অনলাইন টুলস' : '28+ Fast & 100% Private Web Tools'}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 max-w-4xl mx-auto leading-tight sm:leading-none">
            {lang === 'bn' ? (
              <>
                দৈনন্দিন কাজের সব টুল, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
                  এখন এক প্ল্যাটফর্মে
                </span>
              </>
            ) : (
              <>
                Everyday File & Productivity Tools, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
                  All in One Place
                </span>
              </>
            )}
          </h1>

          <p className="mt-4 text-sm sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {lang === 'bn'
              ? 'পিডিএফ জোড়া, ছবি ছোট করা, কনভার্ট করা, বিএমআই হিসাব, ইউটিউব ভিডিও ও রেজুমে তৈরি—সবকিছুই কোনো সার্ভারে আপলোড ছাড়াই সরাসরি আপনার ব্রাউজারে।'
              : 'Merge PDF, compress images, calculate BMI, format convert, and build resumes—fast, secure, and processed right inside your browser.'}
          </p>

          {/* Big Search Box */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center shadow-lg shadow-emerald-500/5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
              <Search className="w-5 h-5 ml-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'টুলস খুঁজুন (যেমন: পিডিএফ মার্জ, ছবি ক্রপ, বিএমআই, কারেন্সি)...'
                    : 'Search tools (e.g. merge pdf, crop photo, bmi, currency)...'
                }
                className="w-full px-3 py-3 text-sm sm:text-base bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              {lang === 'bn' ? '১০০% ব্রাউজার প্রাইভেসি' : '100% In-Browser Privacy'}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              {lang === 'bn' ? 'অতিরিক্ত দ্রুত ও ফ্রি' : 'Lightning Fast & Free'}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-blue-500" />
              {lang === 'bn' ? 'বাংলা ও ইংরেজি সাপোর্ট' : 'Bangla & English'}
            </span>
          </div>
        </div>
      </section>

      {/* Main Tools Catalog Section */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {lang === 'bn' ? 'সব টুলস' : 'All Tools'} ({TOOLS.length})
          </button>

          {CATEGORIES.map((cat) => {
            const count = TOOLS.filter((t) => t.cats.includes(cat.id)).length;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <span>{cat.symbol}</span>
                <span>{lang === 'bn' ? cat.bn : cat.en}</span>
                <span className="opacity-70 text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs sm:text-sm text-zinc-500">
            {lang === 'bn'
              ? `মোট ${filteredTools.length} টি টুল পাওয়া গেছে`
              : `Found ${filteredTools.length} tools`}
          </p>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
            <Search className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              {lang === 'bn' ? 'কোনো টুল পাওয়া যায়নি' : 'No tools found'}
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              {lang === 'bn'
                ? 'অন্য কোনো নাম বা কিওয়ার্ড দিয়ে খুঁজে দেখতে পারেন।'
                : 'Try searching with another keyword or clear filters.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
            >
              {lang === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
            </button>
          </div>
        )}
      </section>

      {/* Creator Highlight Section */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 border-2 border-emerald-500/20">
              {/* Fallback avatar icon or image */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-2xl">
                AB
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-zinc-100">
                  {siteConfig.creator.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {siteConfig.creator.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
                {lang === 'bn' ? siteConfig.creator.bioBn : siteConfig.creator.bio}
              </p>
            </div>

            <div className="flex sm:flex-col gap-2 flex-shrink-0">
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-all text-center"
              >
                {lang === 'bn' ? 'অ্যাডমিন পোর্টাল' : 'Admin Portal'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
