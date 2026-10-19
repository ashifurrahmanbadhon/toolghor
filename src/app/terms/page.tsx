'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';

export default function TermsPage() {
  const { lang } = useApp();

  return (
    <>
      <Header />
      <main className="wrap legal-page" style={{ padding: '32px 0 64px', maxWidth: '860px', minHeight: '65vh' }}>
        <div className="crumb" style={{ marginBottom: '20px', fontSize: '14px', color: '#94a3b8' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>
            {lang === 'bn' ? 'হোম' : 'Home'}
          </Link>{' '}
          / {lang === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service'}
        </div>

        <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, marginBottom: '16px', color: '#f8fafc' }}>
          {lang === 'bn' ? 'ব্যবহারের শর্তাবলী (Terms of Service)' : 'Terms of Service'}
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
                <strong>ToolGhor</strong>-এ আপনাকে স্বাগতম। এই প্ল্যাটফর্মটি ব্যবহারের মাধ্যমে আপনি নিচের শর্তাবলীতে সম্মত হচ্ছেন:
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>১. সেবার শর্ত</h2>
              <p>
                ToolGhor-এর সমস্ত টুল ব্যক্তিগত ও পেশাগত ব্যবহারের জন্য সম্পূর্ণ বিনামূল্যে প্রদান করা হয়। আমরা যে কোনো সময় কোনো পূর্ব নোটিশ ছাড়াই টুল বা ফিচারের পরিবর্তন বা পরিমার্জন করার অধিকার সংরক্ষণ করি।
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>২. ব্যবহারকারীর দায়িত্ব</h2>
              <p>
                ওয়েবসাইটে প্রসেস করা যেকোনো ফাইলের সামগ্রী ও স্বত্বাধিকারের দায়িত্ব সম্পূর্ণভাবে ব্যবহারকারীর। কোনো কপিরাইটযুক্ত উপাদান বা বেআইনি উদ্দেশ্যে টুলগুলো ব্যবহার করা সম্পূর্ণরূপে নিষিদ্ধ।
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>৩. ওয়ারেন্টি সংক্রান্ত সীমাবদ্ধতা</h2>
              <p>
                টুলগুলো "যেমন আছে" (as-is) ভিত্তিতে প্রদান করা হয়। আমরা সেরা পারফরম্যান্স নিশ্চিত করার নিরন্তর চেষ্টা করি, তবে ফাইল কনভার্সন বা ডেটা সংক্রান্ত কোনো অনিচ্ছাকৃত ভুলের জন্য কোনো পরোক্ষ ক্ষতিপূরণের দায় ToolGhor বহন করবে না।
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>৪. যোগাযোগ</h2>
              <p>
                শর্তাবলী সম্পর্কে কোনো প্রশ্ন থাকলে যোগাযোগ করুন:{' '}
                <a href="mailto:ashifur.badhon@gmail.com" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                  ashifur.badhon@gmail.com
                </a>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p>
                Welcome to <strong>ToolGhor</strong>. By accessing or using this website, you agree to comply with and be bound by the following Terms of Service:
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>1. Provision of Services</h2>
              <p>
                All tools on ToolGhor are provided free of charge for legitimate personal and professional use. We reserve the right to enhance, modify, or update features at any time without prior notice.
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>2. User Responsibilities</h2>
              <p>
                You are solely responsible for the content and copyright compliance of files processed through our platform. Using these tools for unlawful, infringing, or malicious activities is strictly prohibited.
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>3. Limitation of Liability</h2>
              <p>
                The services are provided "as-is" and "as-available" without warranties of any kind. While we strive for maximum accuracy and speed, ToolGhor will not be held liable for any incidental or consequential damages.
              </p>
              <h2 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '8px' }}>4. Inquiries</h2>
              <p>
                For questions regarding these terms, please contact:{' '}
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
