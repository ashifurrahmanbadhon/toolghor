'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';

export default function NotFound() {
  const { lang, setSearchQuery } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/');
    }
  };

  const popularTools = [
    { slug: 'merge-pdf', bn: 'পিডিএফ জোড়া লাগান', en: 'Merge PDF', icon: '📄', cat: 'documents' },
    { slug: 'compress-image', bn: 'ইমেজ কম্প্রেস', en: 'Compress Image', icon: '🖼️', cat: 'images' },
    { slug: 'bmi-calculator', bn: 'বিএমআই ক্যালকুলেটর', en: 'BMI Calculator', icon: '⚖️', cat: 'calculators' },
    { slug: 'qr-generator', bn: 'কিউআর কোড বানান', en: 'QR Generator', icon: '📱', cat: 'qr' },
    { slug: 'youtube-downloader', bn: 'ভিডিও ও অডিও ডাউনলোড', en: 'Video Downloader', icon: '🎬', cat: 'media' },
    { slug: 'resume-builder', bn: 'রেজুমি ও সিভি মেকার', en: 'Resume Builder', icon: '💼', cat: 'resume' },
  ];

  return (
    <>
      <Header />
      <main className="wrap" style={{ minHeight: '65vh', padding: '60px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid rgba(16, 185, 129, 0.3)',
              fontSize: '36px',
              marginBottom: '20px',
            }}
          >
            🔍
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: '12px' }}>
            {lang === 'bn' ? '৪MD৪ - পেজটি পাওয়া যায়নি' : '404 - Page Not Found'}
          </h1>

          <p style={{ color: 'var(--ink-3)', fontSize: '16px', lineHeight: 1.6, marginBottom: '28px' }}>
            {lang === 'bn'
              ? 'আপনি যে পেজ বা টুলটি খুঁজছেন তা সরানো হয়েছে অথবা লিংকটি ভুল হতে পারে। নিচের সার্চ বক্সে খুঁজুন বা জনপ্রিয় টুলগুলো দেখুন।'
              : "The page or tool you are looking for doesn't exist, has been moved, or the link is incorrect. Try searching below or explore popular tools."}
          </p>

          {/* Quick Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '440px', margin: '0 auto 36px' }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'টুলের নাম দিয়ে খুঁজুন…' : 'Search for any tool…'}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1.5px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="btn"
              style={{ borderRadius: '12px', padding: '10px 20px', flexShrink: 0 }}
            >
              {lang === 'bn' ? 'খুঁজুন' : 'Search'}
            </button>
          </form>

          {/* Popular Tools Quick List */}
          <div style={{ textAlign: 'left', marginTop: '36px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--ink-2)' }}>
              🔥 {lang === 'bn' ? 'জনপ্রিয় টুলস' : 'Popular Tools'}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              {popularTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    background: 'var(--paper)',
                    textDecoration: 'none',
                    color: 'var(--ink)',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--paddy)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{t.icon}</span>
                  <span>{lang === 'bn' ? t.bn : t.en}</span>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <Link href="/" className="btn" style={{ padding: '10px 24px' }}>
              🏠 {lang === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Homepage'}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
