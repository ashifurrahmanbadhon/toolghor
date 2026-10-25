'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PolicyMarkdown from '@/components/PolicyMarkdown';
import { useApp } from '@/context/AppContext';
import { PolicySection, TERMS_SECTIONS_LIST, DEFAULT_POLICY_SECTIONS } from '@/data/policiesDefaults';

import { ContentTexts, DEFAULT_CONTENT_TEXTS } from '@/data/contentTexts';
import { isPreviewMode, initPreviewMode, subscribePreview } from '@/lib/previewMode';

interface TermsClientProps {
  initialPolicies: Record<string, PolicySection>;
  contentTexts?: ContentTexts;
}

const toBengaliNumber = (num: number, isBn: boolean) => {
  if (!isBn) return `${num}.`;
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const bnStr = String(num).split('').map((d) => bnDigits[Number(d)] || d).join('');
  return `${bnStr}.`;
};

export default function TermsClient({
  initialPolicies,
  contentTexts: initialContentTexts,
}: TermsClientProps) {
  const { lang } = useApp();
  const [policies, setPolicies] = useState<Record<string, PolicySection>>(initialPolicies);
  const [contentTexts, setContentTexts] = useState<ContentTexts>(
    initialContentTexts || DEFAULT_CONTENT_TEXTS
  );
  const [activeSection, setActiveSection] = useState<string>('terms');

  // Sync listener: refresh policies if admin edits in another tab
  useEffect(() => {
    // CMS Preview Mode subscription
    let unsubPreview: (() => void) | null = null;
    if (isPreviewMode()) {
      initPreviewMode();
      unsubPreview = subscribePreview((msg) => {
        if (msg.publicData?.contentTexts) {
          setContentTexts(msg.publicData.contentTexts);
        }
        if (msg.publicData?.policies) {
          const { privacy: _omitted, ...termsPolicies } = msg.publicData.policies;
          setPolicies(termsPolicies);
        }
      });
    }

    const fetchLatest = () => {
      fetch('/api/policies?t=' + Date.now(), { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.policies) {
            const { privacy: _omitted, ...termsPolicies } = data.policies;
            setPolicies(termsPolicies);
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
      if (unsubPreview) unsubPreview();
    };
  }, []);

  // IntersectionObserver Scrollspy for sticky sidebar & mobile chip row
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible section closest to top
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

    TERMS_SECTIONS_LIST.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [policies]);

  const isBn = lang === 'bn';
  const tTexts = contentTexts?.terms || DEFAULT_CONTENT_TEXTS.terms;
  const pageTitle = isBn
    ? (tTexts.page_title_bn || 'ব্যবহারের শর্তাবলী ও নীতিসমূহ')
    : (tTexts.page_title_en || 'Terms & Policies');
  const sidebarTitle = isBn
    ? (tTexts.sidebar_title_bn || 'শর্তাবলী ও নীতিমালা')
    : (tTexts.sidebar_title_en || 'Terms & Policies');
  const lastUpdatedText = isBn
    ? (tTexts.last_updated_bn || 'সর্বশেষ হালনাগাদ: ২২ অক্টোবর ২০২৬')
    : (tTexts.last_updated_en || 'Last Updated: 22 October 2026');

  const welcomeHeading = isBn ? (tTexts.welcome_heading_bn || 'স্বাগতম!') : (tTexts.welcome_heading_en || 'Welcome!');
  const welcomeText = isBn
    ? (tTexts.welcome_text_bn || 'এই নীতিগুলোতে পরিষ্কার ও সৎ ভাষায় ব্যাখ্যা করা হয়েছে ToolGhor কীভাবে কাজ করে, আপনার ফাইলের কী হয় এবং সাইট ব্যবহারের নিয়মগুলো।')
    : (tTexts.welcome_text_en || 'These policies explain how ToolGhor works, what happens to your files, and the rules for using the site — in clear, honest language.');

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
          {/* Mobile Horizontal Scrollable Chip Bar (pinned under header on phones) */}
          <nav
            aria-label="Terms and Policies quick navigation"
            className="policy-docs-mobile-nav"
          >
            <div className="policy-docs-mobile-chips">
              {TERMS_SECTIONS_LIST.map((item, index) => {
                const sec = policies[item.id];
                const def = DEFAULT_POLICY_SECTIONS[item.id];
                const title = isBn ? sec?.title_bn || def?.title_bn || item.id : sec?.title_en || def?.title_en || item.id;
                const num = toBengaliNumber(index + 1, isBn);
                const isActive = activeSection === item.id;

                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`policy-docs-mobile-chip ${isActive ? 'active' : ''}`}
                  >
                    <span>{num}</span> {title}
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
                <nav aria-label="Documentation sections" className="policy-docs-nav">
                  {TERMS_SECTIONS_LIST.map((item, index) => {
                    const sec = policies[item.id];
                    const def = DEFAULT_POLICY_SECTIONS[item.id];
                    const title = isBn ? sec?.title_bn || def?.title_bn || item.id : sec?.title_en || def?.title_en || item.id;
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
                        <span className="policy-docs-nav-text">{title}</span>
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

              {/* Sections Flow */}
              <div className="policy-docs-sections">
                {TERMS_SECTIONS_LIST.map((item, index) => {
                  const sec = policies[item.id];
                  if (!sec) return null;
                  const title = isBn ? sec.title_bn : sec.title_en;
                  const body = isBn ? sec.body_bn : sec.body_en;
                  const numberPrefix = toBengaliNumber(index + 1, isBn);

                  return (
                    <section
                      key={item.id}
                      id={item.id}
                      className="policy-docs-section"
                    >
                      {index > 0 && <div className="policy-docs-divider" aria-hidden="true" />}
                      <h2 className="policy-docs-section-heading">
                        <span className="policy-docs-heading-num">{numberPrefix}</span>{' '}
                        {title}
                      </h2>
                      <PolicyMarkdown content={body} />
                    </section>
                  );
                })}
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
