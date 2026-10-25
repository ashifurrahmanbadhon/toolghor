'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolFaq from '@/components/ToolFaq';
import { useApp } from '@/context/AppContext';
import { Guide } from '@/data/guides';
import { TOOLS_BY_SLUG } from '@/data/registry';
import { ContentTexts, DEFAULT_CONTENT_TEXTS } from '@/data/contentTexts';
import { isPreviewMode, initPreviewMode, subscribePreview } from '@/lib/previewMode';

interface GuideArticleProps {
  guide: Guide;
  contentTexts?: ContentTexts;
}

export default function GuideArticle({
  guide: initialGuide,
  contentTexts: initialContentTexts,
}: GuideArticleProps) {
  const { lang } = useApp();
  const [guide, setGuide] = useState<Guide>(initialGuide);
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
        if (msg.guideDraft && msg.guideDraft.slug === initialGuide.slug) {
          const g = msg.guideDraft.guide;
          setGuide((prev) => ({
            ...prev,
            title: {
              bn: g.title_bn || prev.title.bn,
              en: g.title_en || prev.title.en,
            },
            excerpt: {
              bn: g.description_bn || prev.excerpt.bn,
              en: g.description_en || prev.excerpt.en,
            },
          }));
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
  }, [initialGuide.slug]);

  const isBn = lang === 'bn';
  const gaTexts = contentTexts?.guide_article || DEFAULT_CONTENT_TEXTS.guide_article;

  const backAllText = isBn ? (gaTexts.back_all_bn || 'সকল গাইড') : (gaTexts.back_all_en || 'All Guides');
  const publishedText = isBn ? (gaTexts.published_bn || 'প্রকাশিত: ২৩ অক্টোবর ২০২৬') : (gaTexts.published_en || 'Published: October 23, 2026');
  const practicalTag = isBn ? (gaTexts.practical_tag_bn || 'ব্যবহারিক গাইড') : (gaTexts.practical_tag_en || 'Practical Guide');
  const ctaTitle = isBn ? (gaTexts.cta_title_bn || 'ফ্রি টুলগুলো ব্যবহার করে দেখুন') : (gaTexts.cta_title_en || 'Try the free tools');
  const ctaDesc = isBn
    ? (gaTexts.cta_desc_bn || 'ToolGhor-এর এই টুলগুলো সম্পূর্ণ ফ্রি ও নিরাপদে আপনার ব্রাউজারেই চলে:')
    : (gaTexts.cta_desc_en || 'All tools run 100% free, fast, and private inside your browser:');

  return (
    <>
      <Header />
      <main className="guide-page-main">
        <div className="guide-article-wrap">
          {/* Breadcrumb / Back Link */}
          <nav aria-label="Breadcrumb" className="guide-breadcrumb">
            <Link href="/guides" className="guide-back-link">
              ← {backAllText}
            </Link>
          </nav>

          <article className="guide-article">
            {/* Article Header */}
            <header className="guide-header">
              <h1 className="guide-title">{guide.title[lang]}</h1>
              <div className="guide-meta-row">
                <span className="guide-date">{publishedText}</span>
                <span className="guide-dot">·</span>
                <span className="guide-tag">{practicalTag}</span>
              </div>
            </header>

            {/* Intro Paragraphs */}
            <div className="guide-intro-block">
              {guide.intro[lang].map((para, idx) => (
                <p key={idx} className="guide-intro-p">
                  {para}
                </p>
              ))}
            </div>

            {/* Sections in Order */}
            <div className="guide-sections-list">
              {guide.sections.map((section, sIdx) => {
                const headingText = section.heading[lang];
                const paragraphs = section.paragraphs?.[lang];
                const bullets = section.bullets?.[lang];
                const steps = section.steps?.[lang];
                const paragraphsAfter = section.paragraphsAfter?.[lang];
                const cta = section.cta;

                return (
                  <section key={sIdx} className="guide-section-block">
                    <h2 className="guide-section-heading">{headingText}</h2>

                    {/* Top Paragraphs */}
                    {paragraphs && paragraphs.length > 0 && !steps && (
                      <div className="guide-paragraphs">
                        {paragraphs.map((p, pIdx) => (
                          <p key={pIdx} className="guide-p">
                            {p}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Steps (Ordered Steps) */}
                    {steps && steps.length > 0 && (
                      <ol className="guide-steps-list">
                        {steps.map((st, stIdx) => (
                          <li key={stIdx} className="guide-step-item">
                            <span className="guide-step-badge">{stIdx + 1}</span>
                            <span className="guide-step-text">{st}</span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {/* Paragraphs After Steps if any */}
                    {paragraphs && paragraphs.length > 0 && steps && (
                      <div className="guide-paragraphs guide-post-steps">
                        {paragraphs.map((p, pIdx) => (
                          <p key={pIdx} className="guide-p">
                            {p}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Bullets List */}
                    {bullets && bullets.length > 0 && (
                      <ul className="guide-bullets-list">
                        {bullets.map((b, bIdx) => (
                          <li key={bIdx} className="guide-bullet-item">
                            <span className="guide-bullet-dot" aria-hidden="true">•</span>
                            <span className="guide-bullet-text">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Paragraphs After Bullets/Steps if any */}
                    {paragraphsAfter && paragraphsAfter.length > 0 && (
                      <div className="guide-paragraphs guide-post-steps">
                        {paragraphsAfter.map((p, pIdx) => (
                          <p key={pIdx} className="guide-p">
                            {p}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Section CTA Button */}
                    {cta && (
                      <div className="guide-section-cta">
                        <Link href={`/tools/${cta.toolSlug}`} className="guide-cta-btn">
                          {cta.label[lang]}
                        </Link>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Final CTA Card */}
            <div className="guide-final-cta-card">
              <h3 className="guide-final-cta-title">{ctaTitle}</h3>
              <p className="guide-final-cta-desc">{ctaDesc}</p>
              <div className="guide-final-tools-grid">
                {guide.relatedTools.map((toolSlug) => {
                  const tool = TOOLS_BY_SLUG[toolSlug];
                  const label = tool ? (isBn ? tool.bn : tool.en) : toolSlug;
                  return (
                    <Link
                      key={toolSlug}
                      href={`/tools/${toolSlug}`}
                      className="guide-final-tool-btn"
                    >
                      {label} →
                    </Link>
                  );
                })}
              </div>
            </div>
          </article>

          {/* Guide's FAQ Section */}
          {guide.faq && guide.faq.length > 0 && (
            <div className="guide-faq-wrapper">
              <ToolFaq faqs={guide.faq} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
