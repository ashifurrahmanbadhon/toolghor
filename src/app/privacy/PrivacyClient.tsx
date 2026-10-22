'use client';

import React, { useState, useEffect } from 'react';
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
  const lastUpdatedDate = isBn ? '২২ অক্টোবর ২০২৬' : '22 October 2026';
  const lastUpdatedText = isBn
    ? `সর্বশেষ হালনাগাদ: ${lastUpdatedDate}`
    : `Last Updated: ${lastUpdatedDate}`;

  return (
    <>
      <Header />
      <main className="policy-doc-page">
        <article className="policy-doc-container">
          {/* Page Head */}
          <header className="policy-doc-header">
            <h1 className="policy-doc-title">{pageTitle}</h1>
            <div className="policy-doc-divider" aria-hidden="true" />
            <p className="policy-doc-meta">{lastUpdatedText}</p>
          </header>

          {/* Flowing Prose Body */}
          <div className="policy-doc-flow">
            <section id="privacy" className="policy-doc-section">
              <PolicyMarkdown content={pageBody} />
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
