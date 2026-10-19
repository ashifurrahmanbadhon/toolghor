'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';

export default function PrivacyPage() {
  const { lang } = useApp();

  return (
    <>
      <Header />
      <main className="wrap legal-page" style={{ padding: '32px 0 64px', maxWidth: '860px', minHeight: '65vh' }}>
        <div className="crumb" style={{ marginBottom: '20px', fontSize: '14px', color: '#94a3b8' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>
            {lang === 'bn' ? 'হোম' : 'Home'}
          </Link>{' '}
          / {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
        </div>

        <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, marginBottom: '16px', color: '#f8fafc' }}>
          {lang === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
        </h1>

        <div
          className="panel"
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: 'clamp(18px, 4vw, 32px)',
            color: '#cbd5e1',
            lineHeight: 1.7,
            fontSize: '15px',
          }}
        >
          {lang === 'bn' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p>
                <strong>ToolGhor</strong> আপনার তথ্যের গোপনীয়তা ও সুরক্ষাকে সর্বোচ্চ অগ্রাধিকার দেয়। আমাদের প্ল্যাটফর্মটি এমনভাবে ডিজাইন করা হয়েছে যাতে আপনি শতভাগ নিশ্চিন্তে ও নিরাপদে যেকোনো টুল ব্যবহার করতে পারেন।
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>১. ব্রাউজার-ভিত্তিক প্রসেসিং</h2>
              <p>
                আমাদের ওয়েবসাইটের প্রায় সমস্ত টুল (যেমন: ছবি কমপ্রেস, সাইজ পরিবর্তন, পিডিএফ মার্জ ও স্প্লিট, কিউআর কোড জেনারেশন, রেজুমি ও ক্যালকুলেটর) সরাসরি আপনার ব্রাউজারের ভেতর মেমরিতে চলে। আপনার কোনো ছবি, ফাইল বা সংবেদনশীল ডেটা আমাদের সার্ভারে আপলোড বা সংরক্ষণ করা হয় না।
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>২. কুকি ও লোকাল স্টোরেজ</h2>
              <p>
                আমরা কোনো ট্র্যাকিং কুকি ব্যবহার করি না। শুধুমাত্র আপনার নির্বাচিত ভাষা (বাংলা বা ইংরেজি) এবং সাম্প্রতিক সেটিংস মনে রাখার জন্য ব্রাউজারের লোকাল স্টোরেজ ব্যবহার করা হয়।
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>৩. তৃতীয় পক্ষের সার্ভিস</h2>
              <p>
                আমাদের ওয়েবসাইটে কোনো অপ্রয়োজনীয় ট্র্যাকার নেই। শুধু সাইটের কার্যক্ষমতা ও স্পিড পরিমাপের জন্য ক্লাউড সার্ভার মেট্রিক্স মনিটর করা হয়।
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>৪. যোগাযোগ</h2>
              <p>
                গোপনীয়তা নীতি সম্পর্কিত যেকোনো জিজ্ঞাসা বা পরামর্শের জন্য আমাদের সাথে ইমেইলে যোগাযোগ করতে পারেন:{' '}
                <a href="mailto:ashifur.badhon@gmail.com" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                  ashifur.badhon@gmail.com
                </a>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p>
                <strong>ToolGhor</strong> places the utmost importance on your privacy and data security. Our platform is built from the ground up to ensure safe, transparent, and private productivity.
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>1. 100% Client-Side Processing</h2>
              <p>
                Virtually all productivity tools on ToolGhor (image resizing, compression, PDF utilities, QR code creation, resume builder, calculators) run directly inside your browser memory. Your files, photos, and personal documents are never transmitted or stored on our servers.
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>2. Cookies & Local Storage</h2>
              <p>
                We do not track your activity across the web. Local browser storage is strictly used to remember your UI preferences, such as selected language (Bangla/English) and theme states.
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>3. Third-Party Integrations</h2>
              <p>
                We maintain a minimal and clean dependency footprint without intrusive advertising trackers or invasive analytics scripts.
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>4. Contact Us</h2>
              <p>
                If you have any questions or feedback regarding this Privacy Policy, please reach out directly at:{' '}
                <a href="mailto:ashifur.badhon@gmail.com" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                  ashifur.badhon@gmail.com
                </a>
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
