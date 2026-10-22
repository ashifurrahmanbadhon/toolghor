'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Calendar, ChevronRight, ArrowRight } from 'lucide-react';
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
  const pageSubtitle = isBn
    ? 'ToolGhor ব্যবহারের সবকিছু এক জায়গায় — পরিষ্কার, সৎ ও হালনাগাদ।'
    : 'Everything about using ToolGhor, in one place — clear, honest, and up to date.';
  const lastUpdatedDate = isBn ? '২২ অক্টোবর ২০২৬' : '22 October 2026';
  const lastUpdatedText = isBn
    ? `সর্বশেষ হালনাগাদ: ${lastUpdatedDate}`
    : `Last Updated: ${lastUpdatedDate}`;

  return (
    <>
      <Header />
      <main className="policy-page-wrapper">
        {/* Modern Aurora Hero Header */}
        <section className="policy-hero-section">
          <div className="policy-hero-glow" aria-hidden="true" />
          <div className="wrap policy-hero-wrap" style={{ maxWidth: '860px' }}>
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
              <Link href="/terms" className="policy-hero-link-chip">
                <span>{isBn ? 'সম্পূর্ণ শর্তাবলী ও সকল নীতি দেখুন' : 'View All Terms & Policies'}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Privacy Card */}
        <div className="wrap">
          <div className="policy-single-card">
            <article className="policy-section-card">
              <header className="policy-section-header">
                <div className="policy-title-group">
                  <div className="policy-icon-box" aria-hidden="true">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="policy-section-title">{pageTitle}</h2>
                </div>
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
