'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';

export default function OfflineClient() {
  const { lang } = useApp();

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: '#09130f', color: '#f4f4f5' }}>
      <Header />

      <main className="wrap" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' }}>
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            background: 'rgba(16, 20, 28, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Offline Wifi/Cloud Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(14, 122, 90, 0.15)',
              border: '1px solid rgba(14, 122, 90, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: '#10b981',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
            {lang === 'bn' ? 'আপনি অফলাইনে আছেন' : "You're Offline"}
          </h1>

          {/* Bilingual Message per spec */}
          <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#a1a1aa', marginBottom: '24px' }}>
            {lang === 'bn'
              ? 'আপনার ইন্টারনেট সংযোগ বিচ্ছিন্ন রয়েছে। আগে ভিজিট করা পাতাগুলো আপনি দেখতে পারবেন, কিন্তু সার্ভার এপিআই (API) নির্ভর টুলগুলোর জন্য ইন্টারনেট সংযোগ প্রয়োজন।'
              : "Your device is currently offline. You can still access pages you've previously visited, but tools requiring a server API need an active internet connection."}
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                background: '#0e7a5a',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0a5c44')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0e7a5a')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              <span>{lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Connection'}</span>
            </button>

            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#cbd5e1',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'background-color 0.2s, color 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <span>{lang === 'bn' ? 'হোম পেজে যান' : 'Go to Home'}</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

