'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolFaq from '@/components/ToolFaq';
import { useApp } from '@/context/AppContext';
import { Guide } from '@/data/guides';
import { TOOLS_BY_SLUG } from '@/data/registry';

interface GuideArticleProps {
  guide: Guide;
}

export default function GuideArticle({ guide }: GuideArticleProps) {
  const { lang } = useApp();
  const isBn = lang === 'bn';

  return (
    <>
      <Header />
      <main className="guide-page-main">
        <div className="guide-article-wrap">
          {/* Breadcrumb / Back Link */}
          <nav aria-label="Breadcrumb" className="guide-breadcrumb">
            <Link href="/guides" className="guide-back-link">
              ← {isBn ? 'সকল গাইড' : 'All Guides'}
            </Link>
          </nav>

          <article className="guide-article">

          {/* Article Header */}
          <header className="guide-header">
            <h1 className="guide-title">{guide.title[lang]}</h1>
            <div className="guide-meta-row">
              <span className="guide-date">
                {isBn ? 'প্রকাশিত: ২৩ অক্টোবর ২০২৬' : 'Published: October 23, 2026'}
              </span>
              <span className="guide-dot">·</span>
              <span className="guide-tag">{isBn ? 'ব্যবহারিক গাইড' : 'Practical Guide'}</span>
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
            <h3 className="guide-final-cta-title">
              {isBn ? 'ফ্রি টুলগুলো ব্যবহার করে দেখুন' : 'Try the free tools'}
            </h3>
            <p className="guide-final-cta-desc">
              {isBn
                ? 'ToolGhor-এর এই টুলগুলো সম্পূর্ণ ফ্রি ও নিরাপদে আপনার ব্রাউজারেই চলে:'
                : 'All tools run 100% free, fast, and private inside your browser:'}
            </p>
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
