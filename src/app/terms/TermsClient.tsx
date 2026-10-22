'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Cookie,
  AlertTriangle,
  Scale,
  Globe,
  CheckCircle2,
  RefreshCw,
  Mail,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PolicyMarkdown from '@/components/PolicyMarkdown';
import { useApp } from '@/context/AppContext';
import { PolicySection, POLICY_SECTIONS_LIST } from '@/data/policiesDefaults';

interface TermsClientProps {
  initialPolicies: Record<string, PolicySection>;
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  terms: FileText,
  privacy: ShieldCheck,
  cookies: Cookie,
  disclaimer: AlertTriangle,
  ip: Scale,
  third_party: Globe,
  acceptable_use: CheckCircle2,
  updates: RefreshCw,
  contact: Mail,
};

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
      const scrollPos = window.scrollY + 140;
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
      const headerOffset = 85;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(id);
      if (history.pushState) {
        history.pushState(null, '', `#${id}`);
      }
      if (detailsRef.current) {
        detailsRef.current.open = false;
        setMobileTocOpen(false);
      }
    }
  };

  const isBn = lang === 'bn';
  const pageTitle = isBn ? 'ব্যবহারের শর্তাবলী ও নীতিসমূহ' : 'Terms & Policies';
  const pageSubtitle = isBn
    ? 'ToolGhor ব্যবহারের সবকিছু এক জায়গায় — পরিষ্কার, সৎ ও হালনাগাদ।'
    : 'Everything about using ToolGhor, in one place — clear, honest, and up to date.';
  const lastUpdatedDate = isBn ? '২২ অক্টোবর ২০২৬' : '22 October 2026';
  const lastUpdatedText = isBn
    ? `সর্বশেষ হালনাগাদ: ${lastUpdatedDate}`
    : `Last Updated: ${lastUpdatedDate}`;
  const tocHeading = isBn ? 'সূচিপত্র' : 'Table of Contents';

  return (
    <>
      <Header />
      <main className="policy-page-wrapper">
        {/* Modern Aurora Hero Header */}
        <section className="policy-hero-section">
          <div className="policy-hero-glow" aria-hidden="true" />
          <div className="wrap policy-hero-wrap">
            <div className="policy-crumb">
              <Link href="/">
                {isBn ? 'হোম' : 'Home'}
              </Link>
              <ChevronRight size={14} className="policy-crumb-sep" aria-hidden="true" />
              <span>{pageTitle}</span>
            </div>

            <h1 className="policy-main-title">{pageTitle}</h1>
            <p className="policy-hero-subtitle">{pageSubtitle}</p>

            <div className="policy-badge-row">
              <span className="policy-updated-badge">
                <Calendar size={14} aria-hidden="true" />
                <span>{lastUpdatedText}</span>
              </span>
            </div>
          </div>
        </section>

        <div className="wrap">
          {/* Mobile Sticky Horizontal TOC Bar */}
          <div className="policy-mobile-pills-bar" aria-label="Table of Contents">
            <div className="policy-mobile-pills-scroll">
              {POLICY_SECTIONS_LIST.map((item) => {
                const sec = policies[item.id];
                if (!sec) return null;
                const title = isBn ? sec.title_bn : sec.title_en;
                const isActive = activeSection === item.id;
                const Icon = SECTION_ICONS[item.id] || FileText;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleTocClick(e, item.id)}
                    className={`policy-mobile-pill ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <Icon size={13} aria-hidden="true" />
                    <span>{title}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Mobile Collapsible TOC Dropdown (Optional secondary view) */}
          <details
            ref={detailsRef}
            className="policy-toc-mobile"
            open={mobileTocOpen}
            onToggle={(e) => setMobileTocOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary className="policy-toc-mobile-summary">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} />
                <span>{tocHeading}</span>
              </span>
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
                const Icon = SECTION_ICONS[item.id] || FileText;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleTocClick(e, item.id)}
                    className={`policy-toc-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span>{title}</span>
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
                  const Icon = SECTION_ICONS[item.id] || FileText;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => handleTocClick(e, item.id)}
                      className={`policy-toc-link ${isActive ? 'active' : ''}`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <Icon size={15} aria-hidden="true" />
                      <span>{title}</span>
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
                const Icon = SECTION_ICONS[item.id] || FileText;
                const isContact = item.id === 'contact';

                return (
                  <section
                    key={item.id}
                    id={item.id}
                    className={`policy-section-card ${isContact ? 'policy-contact-card' : ''}`}
                    tabIndex={-1}
                  >
                    <header className="policy-section-header">
                      <div className="policy-title-group">
                        <div className="policy-icon-box" aria-hidden="true">
                          <Icon size={19} />
                        </div>
                        <h2 className="policy-section-title">{title}</h2>
                      </div>
                      <span className="policy-section-badge">
                        {isContact
                          ? isBn
                            ? 'সরাসরি যোগাযোগ'
                            : 'Direct Contact'
                          : `Section ${index + 1}`}
                      </span>
                    </header>
                    <div className="policy-section-body">
                      <PolicyMarkdown content={body} />
                      {isContact && (
                        <div className="policy-contact-cta">
                          <a
                            href="mailto:ashifur.badhon@gmail.com"
                            className="policy-mailto-btn"
                            id="policy-contact-email-btn"
                          >
                            <Mail size={16} aria-hidden="true" />
                            <span>ashifur.badhon@gmail.com</span>
                          </a>
                        </div>
                      )}
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
