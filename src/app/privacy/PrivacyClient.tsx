'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PolicyMarkdown from '@/components/PolicyMarkdown';
import { useApp } from '@/context/AppContext';
import { PolicySection, extractSubheadings } from '@/data/policiesDefaults';

import { ContentTexts, DEFAULT_CONTENT_TEXTS } from '@/data/contentTexts';

interface PrivacyClientProps {
  initialPolicy: PolicySection;
  contentTexts?: ContentTexts;
}

const toBengaliNumber = (num: number, isBn: boolean) => {
  if (!isBn) return `${num}.`;
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const bnStr = String(num).split('').map((d) => bnDigits[Number(d)] || d).join('');
  return `${bnStr}.`;
};

export default function PrivacyClient({
  initialPolicy,
  contentTexts: initialContentTexts,
}: PrivacyClientProps) {
  const { lang } = useApp();
  const [policy, setPolicy] = useState<PolicySection>(initialPolicy);
  const [contentTexts, setContentTexts] = useState<ContentTexts>(
    initialContentTexts || DEFAULT_CONTENT_TEXTS
  );

  // Sync listener: refresh policy if admin edits in another tab
  useEffect(() => {
    const fetchLatest = () => {
      fetch('/api/policies?section=privacy&t=' + Date.now(), { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.policy) {
            setPolicy(data.policy);
          }
        })
        .catch(() => {});
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
  const pTexts = contentTexts?.privacy || DEFAULT_CONTENT_TEXTS.privacy;
  const pageTitle = isBn
    ? (policy.title_bn || pTexts.page_title_bn)
    : (policy.title_en || pTexts.page_title_en);
  const pageBody = isBn ? policy.body_bn : policy.body_en;
  const sidebarTitle = isBn
    ? (pTexts.sidebar_title_bn || 'গোপনীয়তা নীতি')
    : (pTexts.sidebar_title_en || 'Privacy Policy');
  const lastUpdatedText = isBn
    ? (pTexts.last_updated_bn || 'সর্বশেষ হালনাগাদ: ২২ অক্টোবর ২০২৬')
    : (pTexts.last_updated_en || 'Last Updated: 22 October 2026');

  const welcomeHeading = isBn ? (pTexts.welcome_heading_bn || 'স্বাগতম!') : (pTexts.welcome_heading_en || 'Welcome!');
  const welcomeText = isBn
    ? (pTexts.welcome_text_bn || 'ToolGhor-এ আপনার তথ্যের গোপনীয়তা রক্ষা করা আমাদের প্রধান অগ্রাধিকার। আমাদের কোনো টুল আপনার ফাইল কোনো রিমোট সার্ভারে জমা করে না — সব প্রসেসিং সরাসরি আপনার ডিভাইসে ঘটে।')
    : (pTexts.welcome_text_en || 'Your privacy is paramount at ToolGhor. We do not store your files on external servers — all processing happens directly in your browser on your own device.');

  // Extract only the Privacy Policy's own sub-sections
  const subheadings = useMemo(() => extractSubheadings(pageBody), [pageBody]);
  const [activeSection, setActiveSection] = useState<string>(subheadings[0]?.id || '');

  // Keep active section valid when language or subheadings change
  useEffect(() => {
    if (subheadings.length > 0 && (!activeSection || !subheadings.some((s) => s.id === activeSection))) {
      setActiveSection(subheadings[0].id);
    }
  }, [subheadings, activeSection]);

  // IntersectionObserver Scrollspy for sticky sidebar & mobile chip row
  useEffect(() => {
    if (subheadings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible && visible.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -55% 0px',
        threshold: [0, 0.2],
      }
    );

    subheadings.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [subheadings]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', `#${id}`);
      }
    }
  };

  return (
    <>
      <Header />
      <main className="policy-docs-page">
        <div className="policy-docs-container">
          {/* Mobile Horizontal Scrollable Chip Bar */}
          <nav
            aria-label="Privacy Policy quick navigation"
            className="policy-docs-mobile-nav"
          >
            <div className="policy-docs-mobile-chips">
              {subheadings.map((item, index) => {
                const num = toBengaliNumber(index + 1, isBn);
                const isActive = activeSection === item.id;

                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`policy-docs-mobile-chip ${isActive ? 'active' : ''}`}
                  >
                    <span>{num}</span> {item.title}
                  </a>
                );
              })}
            </div>
          </nav>

          <div className="policy-docs-grid">
            {/* Desktop Left Sticky Sidebar */}
            <aside className="policy-docs-sidebar">
              <div className="policy-docs-sidebar-inner">
                <div className="policy-docs-sidebar-header">
                  <span className="policy-docs-sidebar-title">{sidebarTitle}</span>
                </div>
                <nav aria-label="Privacy Policy sub-sections" className="policy-docs-nav">
                  {subheadings.map((item, index) => {
                    const num = toBengaliNumber(index + 1, isBn);
                    const isActive = activeSection === item.id;

                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => handleNavClick(e, item.id)}
                        className={`policy-docs-nav-link ${isActive ? 'active' : ''}`}
                      >
                        <span className="policy-docs-nav-num">{num}</span>
                        <span className="policy-docs-nav-text">{item.title}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Right Main Content Panel */}
            <article className="policy-docs-panel">
              {/* Document Head */}
              <header className="policy-docs-head">
                <h1 className="policy-docs-main-title">{pageTitle}</h1>
                <p className="policy-docs-meta-line">{lastUpdatedText}</p>

                {/* Intro Callout Box */}
                <div className="policy-docs-welcome-callout">
                  <div className="policy-docs-welcome-heading">{welcomeHeading}</div>
                  <p className="policy-docs-welcome-text">{welcomeText}</p>
                </div>
              </header>

              {/* Policy Body */}
              <div className="policy-docs-sections">
                <section id="privacy" className="policy-docs-section">
                  <PolicyMarkdown content={pageBody} />
                </section>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
