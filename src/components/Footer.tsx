'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { siteConfig } from '@/data/config';
import { Shield, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  const { lang } = useApp();

  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-600 dark:text-zinc-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                {siteConfig.name}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              {lang === 'bn' ? siteConfig.tagline : siteConfig.taglineEn}.{' '}
              {lang === 'bn'
                ? 'আপনার ব্রাউজারেই সরাসরি প্রসেসিং হয়, ডাটার নিরাপত্তা ১০০% নিশ্চিত।'
                : 'Processed directly in your browser. 100% private and secure.'}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={siteConfig.creator.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-blue-600 transition-colors"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={siteConfig.creator.linkedin}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-blue-500 transition-colors"
                title="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href={siteConfig.creator.github}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
                title="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
              {lang === 'bn' ? 'টুলস ক্যাটাগরি' : 'Categories'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#documents" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {lang === 'bn' ? 'ডকুমেন্ট টুলস (PDF)' : 'Document Tools'}
                </Link>
              </li>
              <li>
                <Link href="/#images" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {lang === 'bn' ? 'ইমেজ টুলস' : 'Image Tools'}
                </Link>
              </li>
              <li>
                <Link href="/#calculators" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {lang === 'bn' ? 'ক্যালকুলেটরস' : 'Calculators'}
                </Link>
              </li>
              <li>
                <Link href="/#media" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {lang === 'bn' ? 'ভিডিও ও অডিও' : 'Media Tools'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Security */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
              {lang === 'bn' ? 'ম্যানেজমেন্ট' : 'Management'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/admin" className="inline-flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{lang === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Console'}</span>
                </Link>
              </li>
              <li>
                <a
                  href={`https://wa.me/${siteConfig.social.whatsapp.number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ সহায়তা' : 'WhatsApp Contact'}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            © 2026 {siteConfig.name}.{' '}
            {lang === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
          </p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>by {siteConfig.creator.name}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
