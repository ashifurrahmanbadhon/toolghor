'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { GUIDES } from '@/data/guides';

export default function GuideIndex() {
  const { lang } = useApp();
  const isBn = lang === 'bn';

  return (
    <>
      <Header />
      <main className="guide-index-main">
        <div className="guide-index-wrap">
          <header className="guide-index-header">
            <span className="guide-index-pill">
              {isBn ? 'সহায়ক গাইড' : 'HELPFUL GUIDES'}
            </span>
            <h1 className="guide-index-title">
              {isBn ? 'গাইড' : 'Guides'}
            </h1>
            <p className="guide-index-sub">
              {isBn
                ? 'দৈনন্দিন কাজের জন্য প্রয়োজনীয় গাইড ও ধাপে ধাপে নির্দেশনা — সম্পূর্ণ ফ্রি।'
                : 'Helpful step-by-step guides and tutorials for everyday tasks.'}
            </p>
          </header>

          <div className="guide-cards-grid">
            {GUIDES.map((guide) => (
              <article key={guide.slug} className="guide-card">
                <div className="guide-card-content">
                  <div className="guide-card-meta">
                    <span className="guide-card-tag">
                      {isBn ? 'ব্যবহারিক নির্দেশিকা' : 'Practical Guide'}
                    </span>
                  </div>
                  <h2 className="guide-card-title">
                    <Link href={`/guides/${guide.slug}`} className="guide-card-link">
                      {guide.title[lang]}
                    </Link>
                  </h2>
                  <p className="guide-card-excerpt">
                    {guide.excerpt[lang]}
                  </p>
                </div>
                <div className="guide-card-footer">
                  <Link href={`/guides/${guide.slug}`} className="guide-card-btn">
                    {isBn ? 'গাইডটি পড়ুন →' : 'Read Guide →'}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
