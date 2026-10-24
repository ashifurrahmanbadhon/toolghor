'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FaqAccordion from '@/components/FaqAccordion';
import { useApp } from '@/context/AppContext';
import { FaqItem, GENERAL_FAQ } from '@/data/seoData';
import { ContentTexts, DEFAULT_CONTENT_TEXTS } from '@/data/contentTexts';

interface FaqClientProps {
  faqs?: FaqItem[];
  contentTexts?: ContentTexts;
}

export default function FaqClient({
  faqs: initialFaqs = GENERAL_FAQ,
  contentTexts: initialContentTexts,
}: FaqClientProps) {
  const { lang } = useApp();
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [contentTexts, setContentTexts] = useState<ContentTexts>(
    initialContentTexts || DEFAULT_CONTENT_TEXTS
  );

  useEffect(() => {
    const fetchLatest = () => {
      fetch('/api/public/data?t=' + Date.now(), { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.success && data.contentTexts) {
            setContentTexts(data.contentTexts);
          }
        })
        .catch(() => {});
    };

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('toolghor_sync');
        channel.onmessage = (evt) => {
          if (evt.data === 'refresh') fetchLatest();
        };
      } catch {}
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  const isBn = lang === 'bn';
  const faqTexts = contentTexts?.faq || DEFAULT_CONTENT_TEXTS.faq;

  const pillText = isBn ? (faqTexts.pill_bn || 'কোনো প্রশ্ন আছে?') : (faqTexts.pill_en || 'NEED HELP?');
  const titleText = isBn ? (faqTexts.title_bn || 'সাধারণ জিজ্ঞাসা') : (faqTexts.title_en || 'Frequently Asked Questions');
  const subText = isBn
    ? (faqTexts.sub_bn || 'ToolGhor সম্পর্কে যা যা জানা দরকার — টুলগুলো, আপনার প্রাইভেসি, আর সবকিছু কীভাবে কাজ করে।')
    : (faqTexts.sub_en || 'Everything you need to know about ToolGhor — the tools, your privacy, and how everything works.');

  return (
    <>
      <Header />
      <main className="faqpage-main">
        <div className="faqpage-container">
          <header className="faqpage-header">
            <span className="faqpage-pill">{pillText}</span>
            <h1 className="faqpage-title">{titleText}</h1>
            <p className="faqpage-sub">{subText}</p>
          </header>

          <FaqAccordion faqs={faqs} />
        </div>
      </main>
      <Footer />
    </>
  );
}
