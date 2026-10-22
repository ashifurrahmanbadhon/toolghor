'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PolicyMarkdown from '@/components/PolicyMarkdown';
import { useApp } from '@/context/AppContext';
import { PolicySection, POLICY_SECTIONS_LIST } from '@/data/policiesDefaults';

interface TermsClientProps {
  initialPolicies: Record<string, PolicySection>;
}

export default function TermsClient({ initialPolicies }: TermsClientProps) {
  const { lang } = useApp();
  const [policies, setPolicies] = useState<Record<string, PolicySection>>(initialPolicies);
  const [activeSection, setActiveSection] = useState<string>('terms');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  // Sync listener: refresh policies if admin edits in another tab
  useEffect(() => {
    const fetchLatest = () => {
      fetch('/api/policies?t=' + Date.now(), { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.policies) {
            setPolicies(data.policies);
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

  // Scrollspy: update active section as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 130;
      let current = 'terms';

      for (const item of POLICY_SECTIONS_LIST) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            current = item.id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(id);
      if (detailsRef.current) {
        detailsRef.current.open = false;
        setMobileTocOpen(false);
      }
    }
  };

  const isBn = lang === 'bn';
  const pageTitle = isBn ? 'ব্যবহারের শর্তাবলী ও নীতিসমূহ' : 'Terms & Policies';
  const lastUpdatedText = isBn ? 'সর্বশেষ হালনাগাদ: ২২ অক্টোবর ২০২৬' : 'Last Updated: 22 October 2026';
  const tocHeading = isBn ? 'সূচিপত্র' : 'Table of Contents';

  return (
    <>
      <Header />
      <main className="policy-page-wrapper">
        <div className="wrap">
          {/* Header & Breadcrumb */}
          <div className="policy-header">
            <div className="policy-crumb">
              <Link href="/">
                {isBn ? 'হোম' : 'Home'}
              </Link>
              <span aria-hidden="true">/</span>
              <span>{pageTitle}</span>
            </div>

            <h1 className="policy-main-title">{pageTitle}</h1>

            <div className="policy-badge-row">
              <span className="policy-updated-badge">
                📅 {lastUpdatedText}
              </span>
            </div>
          </div>

          {/* Mobile Collapsible TOC */}
          <details
            ref={detailsRef}
            className="policy-toc-mobile"
            open={mobileTocOpen}
            onToggle={(e) => setMobileTocOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary className="policy-toc-mobile-summary">
              <span>📖 {tocHeading}</span>
              <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>
                {mobileTocOpen ? '▲' : '▼'}
              </span>
            </summary>
            <nav className="policy-toc-mobile-content" aria-label="Mobile Table of Contents">
              {POLICY_SECTIONS_LIST.map((item) => {
                const sec = policies[item.id];
                if (!sec) return null;
                const title = isBn ? sec.title_bn : sec.title_en;
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleTocClick(e, item.id)}
                    className={`policy-toc-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {title}
                  </a>
                );
              })}
            </nav>
          </details>

          {/* Main 2-Column Layout */}
          <div className="policy-layout">
            {/* Desktop Sticky Sidebar TOC */}
            <aside className="policy-toc-sidebar" aria-label="Table of Contents">
              <div className="policy-toc-title">{tocHeading}</div>
              <nav className="policy-toc-nav">
                {POLICY_SECTIONS_LIST.map((item) => {
                  const sec = policies[item.id];
                  if (!sec) return null;
                  const title = isBn ? sec.title_bn : sec.title_en;
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => handleTocClick(e, item.id)}
                      className={`policy-toc-link ${isActive ? 'active' : ''}`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      {title}
                    </a>
                  );
                })}
              </nav>
            </aside>

            {/* Content Column */}
            <div className="policy-content-col">
              {POLICY_SECTIONS_LIST.map((item, index) => {
                const sec = policies[item.id];
                if (!sec) return null;
                const title = isBn ? sec.title_bn : sec.title_en;
                const body = isBn ? sec.body_bn : sec.body_en;

                return (
                  <section
                    key={item.id}
                    id={item.id}
                    className="policy-section-card"
                    tabIndex={-1}
                  >
                    <header className="policy-section-header">
                      <h2 className="policy-section-title">{title}</h2>
                      <span className="policy-section-badge">
                        Section {index + 1}
                      </span>
                    </header>
                    <div className="policy-section-body">
                      <PolicyMarkdown content={body} />
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
