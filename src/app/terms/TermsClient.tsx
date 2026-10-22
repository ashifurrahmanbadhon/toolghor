'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PolicyMarkdown from '@/components/PolicyMarkdown';
import { useApp } from '@/context/AppContext';
import { PolicySection, POLICY_SECTIONS_LIST } from '@/data/policiesDefaults';

interface TermsClientProps {
  initialPolicies: Record<string, PolicySection>;
}

const toBengaliNumber = (num: number, isBn: boolean) => {
  if (!isBn) return `${num}.`;
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const bnStr = String(num).split('').map((d) => bnDigits[Number(d)] || d).join('');
  return `${bnStr}.`;
};

export default function TermsClient({ initialPolicies }: TermsClientProps) {
  const { lang } = useApp();
  const [policies, setPolicies] = useState<Record<string, PolicySection>>(initialPolicies);

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

  const isBn = lang === 'bn';
  const pageTitle = isBn ? 'ব্যবহারের শর্তাবলী ও নীতিসমূহ' : 'Terms & Policies';
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

          {/* Flowing Prose Sections */}
          <div className="policy-doc-flow">
            {POLICY_SECTIONS_LIST.map((item, index) => {
              const sec = policies[item.id];
              if (!sec) return null;
              const title = isBn ? sec.title_bn : sec.title_en;
              const body = isBn ? sec.body_bn : sec.body_en;
              const numberPrefix = toBengaliNumber(index + 1, isBn);

              return (
                <section
                  key={item.id}
                  id={item.id}
                  className="policy-doc-section"
                >
                  <h2 className="policy-doc-heading">
                    {numberPrefix} {title}
                  </h2>
                  <PolicyMarkdown content={body} />
                </section>
              );
            })}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
