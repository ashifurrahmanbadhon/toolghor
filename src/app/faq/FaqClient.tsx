'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FaqAccordion from '@/components/FaqAccordion';
import { useApp } from '@/context/AppContext';
import { FaqItem, GENERAL_FAQ } from '@/data/seoData';

interface FaqClientProps {
  faqs?: FaqItem[];
}

export default function FaqClient({ faqs = GENERAL_FAQ }: FaqClientProps) {
  const { lang } = useApp();

  return (
    <>
      <Header />
      <main className="faqpage-main">
        <div className="faqpage-container">
          <header className="faqpage-header">
            <span className="faqpage-pill">
              {lang === 'bn' ? 'কোনো প্রশ্ন আছে?' : 'NEED HELP?'}
            </span>
            <h1 className="faqpage-title">
              {lang === 'bn' ? 'সাধারণ জিজ্ঞাসা' : 'Frequently Asked Questions'}
            </h1>
            <p className="faqpage-sub">
              {lang === 'bn'
                ? 'ToolGhor সম্পর্কে যা যা জানা দরকার — টুলগুলো, আপনার প্রাইভেসি, আর সবকিছু কীভাবে কাজ করে।'
                : 'Everything you need to know about ToolGhor — the tools, your privacy, and how everything works.'}
            </p>
          </header>

          <FaqAccordion faqs={faqs} />
        </div>
      </main>
      <Footer />
    </>
  );
}
