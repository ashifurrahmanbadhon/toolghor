'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PolicyMarkdown from '@/components/PolicyMarkdown';
import { useApp } from '@/context/AppContext';
import { PolicySection } from '@/data/policiesDefaults';

interface PrivacyClientProps {
  initialPolicy: PolicySection;
}

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
  const lastUpdatedText = isBn ? 'সর্বশেষ হালনাগাদ: ২২ অক্টোবর ২০২৬' : 'Last Updated: 22 October 2026';

  return (
    <>
      <Header />
      <main className="policy-page-wrapper">
        <div className="wrap">
          {/* Header & Breadcrumb */}
          <div className="policy-header" style={{ maxWidth: '860px', margin: '0 auto 32px' }}>
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
              <Link
                href="/terms"
                style={{
                  fontSize: '13px',
                  color: 'var(--paddy-d)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                📜 {isBn ? 'সম্পূর্ণ শর্তাবলী ও সকল নীতি দেখুন →' : 'View All Terms & Policies →'}
              </Link>
            </div>
          </div>

          {/* Privacy Card */}
          <div className="policy-single-card">
            <article className="policy-section-card">
              <header className="policy-section-header">
                <h2 className="policy-section-title">{pageTitle}</h2>
                <span className="policy-section-badge">ToolGhor Legal</span>
              </header>
              <div className="policy-section-body">
                <PolicyMarkdown content={pageBody} />
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
