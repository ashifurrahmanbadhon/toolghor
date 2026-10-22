'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PolicyMarkdown from '@/components/PolicyMarkdown';
import { useApp } from '@/context/AppContext';
import { PolicySection, POLICY_SECTIONS_LIST, DEFAULT_POLICY_SECTIONS } from '@/data/policiesDefaults';

interface PrivacyClientProps {
  initialPolicy: PolicySection;
}

const toBengaliNumber = (num: number, isBn: boolean) => {
  if (!isBn) return `${num}.`;
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const bnStr = String(num).split('').map((d) => bnDigits[Number(d)] || d).join('');
  return `${bnStr}.`;
};

export default function PrivacyClient({ initialPolicy }: PrivacyClientProps) {
  const { lang } = useApp();
  const [policy, setPolicy] = useState<PolicySection>(initialPolicy);

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
  const pageTitle = isBn ? policy.title_bn : policy.title_en;
  const pageBody = isBn ? policy.body_bn : policy.body_en;
  const sidebarTitle = isBn ? 'শর্তাবলী ও নীতিমালা' : 'Terms & Policies';
  const lastUpdatedDate = isBn ? '২২ অক্টোবর ২০২৬' : '22 October 2026';
  const lastUpdatedText = isBn
    ? `সর্বশেষ হালনাগাদ: ${lastUpdatedDate}`
    : `Last Updated: ${lastUpdatedDate}`;

  const welcomeHeading = isBn ? 'স্বাগতম!' : 'Welcome!';
  const welcomeText = isBn
    ? 'ToolGhor-এ আপনার তথ্যের গোপনীয়তা রক্ষা করা আমাদের প্রধান অগ্রাধিকার। আমাদের কোনো টুল আপনার ফাইল কোনো রিমোট সার্ভারে জমা করে না — সব প্রসেসিং সরাসরি আপনার ডিভাইসে ঘটে।'
    : 'Your privacy is paramount at ToolGhor. We do not store your files on external servers — all processing happens directly in your browser on your own device.';

  return (
    <>
      <Header />
      <main className="policy-docs-page">
        <div className="policy-docs-container">
          {/* Mobile Horizontal Scrollable Chip Bar */}
          <nav
            aria-label="Terms and Policies quick navigation"
            className="policy-docs-mobile-nav"
          >
            <div className="policy-docs-mobile-chips">
              {POLICY_SECTIONS_LIST.map((item, index) => {
                const def = DEFAULT_POLICY_SECTIONS[item.id];
                const title = isBn ? def?.title_bn || item.id : def?.title_en || item.id;
                const num = toBengaliNumber(index + 1, isBn);
                const isCurrent = item.id === 'privacy';

                return isCurrent ? (
                  <a
                    key={item.id}
                    href="#privacy"
                    className="policy-docs-mobile-chip active"
                  >
                    <span>{num}</span> {title}
                  </a>
                ) : (
                  <Link
                    key={item.id}
                    href={`/terms#${item.id}`}
                    className="policy-docs-mobile-chip"
                  >
                    <span>{num}</span> {title}
                  </Link>
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
                  {POLICY_SECTIONS_LIST.map((item, index) => {
                    const def = DEFAULT_POLICY_SECTIONS[item.id];
                    const title = isBn ? def?.title_bn || item.id : def?.title_en || item.id;
                    const num = toBengaliNumber(index + 1, isBn);
                    const isCurrent = item.id === 'privacy';

                    return isCurrent ? (
                      <a
                        key={item.id}
                        href="#privacy"
                        className="policy-docs-nav-link active"
                      >
                        <span className="policy-docs-nav-num">{num}</span>
                        <span className="policy-docs-nav-text">{title}</span>
                      </a>
                    ) : (
                      <Link
                        key={item.id}
                        href={`/terms#${item.id}`}
                        className="policy-docs-nav-link"
                      >
                        <span className="policy-docs-nav-num">{num}</span>
                        <span className="policy-docs-nav-text">{title}</span>
                      </Link>
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
