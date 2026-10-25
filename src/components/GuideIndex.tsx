'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { GUIDES, Guide } from '@/data/guides';
import { ContentTexts, DEFAULT_CONTENT_TEXTS } from '@/data/contentTexts';
import { isPreviewMode, initPreviewMode, subscribePreview } from '@/lib/previewMode';

interface GuideIndexProps {
  guides?: Guide[];
  contentTexts?: ContentTexts;
}

export default function GuideIndex({
  guides = GUIDES,
  contentTexts: initialContentTexts,
}: GuideIndexProps) {
  const { lang } = useApp();
  const [contentTexts, setContentTexts] = useState<ContentTexts>(
    initialContentTexts || DEFAULT_CONTENT_TEXTS
  );

  useEffect(() => {
    // CMS Preview Mode subscription
    let unsubPreview: (() => void) | null = null;
    if (isPreviewMode()) {
      initPreviewMode();
      unsubPreview = subscribePreview((msg) => {
        if (msg.publicData?.contentTexts) {
          setContentTexts(msg.publicData.contentTexts);
        }
      });
    }

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
      if (unsubPreview) unsubPreview();
    };
  }, []);

  const isBn = lang === 'bn';
  const gTexts = contentTexts?.guides || DEFAULT_CONTENT_TEXTS.guides;

  const pillText = isBn ? (gTexts.pill_bn || 'সহায়ক গাইড') : (gTexts.pill_en || 'HELPFUL GUIDES');
  const titleText = isBn ? (gTexts.title_bn || 'গাইড') : (gTexts.title_en || 'Guides');
  const subText = isBn
    ? (gTexts.sub_bn || 'দৈনন্দিন কাজের জন্য প্রয়োজনীয় গাইড ও ধাপে ধাপে নির্দেশনা — সম্পূর্ণ ফ্রি।')
    : (gTexts.sub_en || 'Helpful step-by-step guides and tutorials for everyday tasks.');
  const practicalTagText = isBn
    ? (gTexts.practical_tag_bn || 'ব্যবহারিক নির্দেশিকা')
    : (gTexts.practical_tag_en || 'Practical Guide');
  const readGuideBtnText = isBn
    ? (gTexts.read_guide_bn || 'গাইডটি পড়ুন →')
    : (gTexts.read_guide_en || 'Read Guide →');

  return (
    <>
      <Header />
      <main className="guide-index-main">
        <div className="guide-index-wrap">
          <header className="guide-index-header">
            <span className="guide-index-pill">{pillText}</span>
            <h1 className="guide-index-title">{titleText}</h1>
            <p className="guide-index-sub">{subText}</p>
          </header>

          <div className="guide-cards-grid">
            {guides.map((guide) => {
              const readMin = guide.slug.includes('land') ? 6 : 4;
              const readText = isBn ? `${readMin === 6 ? '৬' : '৪'} মিনিট পাঠ` : `${readMin} min read`;
              return (
                <article key={guide.slug} className="guide-card">
                  <div className="guide-card-content">
                    <div className="guide-card-meta">
                      <span className="guide-card-tag">{practicalTagText}</span>
                      <span className="guide-card-time">{readText}</span>
                    </div>
                    <h2 className="guide-card-title">
                      <Link href={`/guides/${guide.slug}`} className="guide-card-link">
                        {guide.title[lang]}
                      </Link>
                    </h2>
                    <p className="guide-card-excerpt">{guide.excerpt[lang]}</p>
                  </div>
                  <div className="guide-card-footer">
                    <Link href={`/guides/${guide.slug}`} className="guide-card-btn">
                      {readGuideBtnText}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
