'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { siteConfig } from '@/data/config';

interface FooterProps {
  customSettings?: any;
}

export default function Footer({ customSettings }: FooterProps) {
  const { lang } = useApp();
  const [liveFooter, setLiveFooter] = useState<any>(customSettings || null);
  const [fabDismissed, setFabDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage for persisted FAB dismissal
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('toolghor_wa_fab_dismissed') === '1') {
        setFabDismissed(true);
      }
    } catch {}

    if (customSettings) {
      setLiveFooter(customSettings);
      return;
    }
    // Fetch live footer/social settings from database
    fetch('/api/public/data')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.footerSocial) {
          setLiveFooter(data.footerSocial);
        }
      })
      .catch(() => {});
  }, [customSettings]);

  const handleDismissFab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFabDismissed(true);
    try {
      localStorage.setItem('toolghor_wa_fab_dismissed', '1');
    } catch {}
  };

  const handleOpenAbout = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = window as any;
    if (w.UI && typeof w.UI.openAboutModal === 'function') {
      w.UI.openAboutModal();
    }
  };

  const handleOpenAiKeys = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = window as any;
    if (w.UI && typeof w.UI.openAiKeysModal === 'function') {
      w.UI.openAiKeysModal();
    }
  };

  const handleOpenRequestTool = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = window as any;
    if (w.UI && typeof w.UI.openRequestToolModal === 'function') {
      w.UI.openRequestToolModal();
    }
  };

  const isFooterActive = liveFooter ? liveFooter.is_active : true;
  const isWhatsappActive = liveFooter ? (liveFooter.whatsapp_active !== false) : true;
  const isFacebookActive = liveFooter ? (liveFooter.facebook_active !== false) : true;
  const isLinkedinActive = liveFooter ? (liveFooter.linkedin_active !== false) : true;
  const isGithubActive = liveFooter ? (liveFooter.github_active !== false) : true;

  const fbUrl = liveFooter?.facebook_url || siteConfig.creator?.facebook;
  const linkedinUrl = liveFooter?.linkedin_url || siteConfig.creator?.linkedin;
  const githubUrl = liveFooter?.github_url || siteConfig.creator?.github;

  const waNumber = String(
    liveFooter?.whatsapp_number || siteConfig.social?.whatsapp?.number || '8801521417284'
  ).replace(/\D/g, '');

  const text =
    lang === 'bn'
      ? liveFooter?.whatsapp_text_bn || siteConfig.social?.whatsapp?.textBn
      : liveFooter?.whatsapp_text_en || siteConfig.social?.whatsapp?.textEn;

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(text || '')}`;

  const copyrightText =
    lang === 'bn'
      ? liveFooter?.copyright_text_bn || 'আপনার ফাইল ও তথ্য সরাসরি আপনার ব্রাউজারেই প্রসেস করা হয়।'
      : liveFooter?.copyright_text_en || 'Your files and data are processed in your browser.';

  if (!isFooterActive) return null;

  return (
    <>
      <footer className="foot" role="contentinfo">
        <div className="wrap">
          {/* Multi-Column Desktop Footer */}
          <div className="foot-columns">
            {/* Column 1: Brand & Privacy Commitment */}
            <div className="foot-col foot-col-brand">
              <Link href="/" className="brand" aria-label="ToolGhor Home">
                <img
                  src="/assets/logo-dark.png"
                  alt="ToolGhor"
                  width={160}
                  height={40}
                  className="brand-logo"
                  style={{ height: '42px', width: 'auto' }}
                  loading="lazy"
                />
              </Link>
              <p className="foot-desc">
                {lang === 'bn'
                  ? 'দৈনন্দিন কাজের সব জরুরি অনলাইন টুল এখন এক প্ল্যাটফর্মে। সম্পূর্ণ নিরাপদ ও ব্যক্তিগত—সকল ফাইল প্রসেস হয় সরাসরি আপনার ব্রাউজারে।'
                  : 'Everyday tools, now on one platform. 100% private and secure—all processing runs directly in your browser without uploading files.'}
              </p>
              <div className="foot-socials" aria-label="Social Links">
                {isFacebookActive && fbUrl && (
                  <a
                    href={fbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="foot-social-link"
                    aria-label="Facebook"
                    title="Facebook"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </a>
                )}
                {isLinkedinActive && linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="foot-social-link"
                    aria-label="LinkedIn"
                    title="LinkedIn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                      <rect x="2" y="9" width="4" height="12"/>
                      <circle cx="4" cy="4" r="2"/>
                    </svg>
                  </a>
                )}
                {isGithubActive && githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="foot-social-link"
                    aria-label="GitHub"
                    title="GitHub"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Tool Categories */}
            <div className="foot-col">
              <h3 className="foot-heading">{lang === 'bn' ? 'টুলস ক্যাটাগরি' : 'Tool Categories'}</h3>
              <ul className="foot-links">
                <li><Link href="/#cat-documents">{lang === 'bn' ? '📄 ডকুমেন্ট ও পিডিএফ' : '📄 Document & PDF'}</Link></li>
                <li><Link href="/#cat-images">{lang === 'bn' ? '🖼️ ইমেজ ও ছবি টুলস' : '🖼️ Image Tools'}</Link></li>
                <li><Link href="/#cat-calculators">{lang === 'bn' ? '🧮 দরকারি ক্যালকুলেটর' : '🧮 Calculators'}</Link></li>
                <li><Link href="/#cat-qr">{lang === 'bn' ? '📱 কিউআর কোড টুলস' : '📱 QR Code Tools'}</Link></li>
                <li><Link href="/#cat-media">{lang === 'bn' ? '🎬 ভিডিও ও অডিও' : '🎬 Video & Audio'}</Link></li>
                <li><Link href="/#cat-resume">{lang === 'bn' ? '💼 রেজুমি ও সিভি মেকার' : '💼 Resume & CV Maker'}</Link></li>
              </ul>
            </div>

            {/* Column 3: Platform & Resources */}
            <div className="foot-col">
              <h3 className="foot-heading">{lang === 'bn' ? 'রিসোর্স ও সহায়তা' : 'Resources & Help'}</h3>
              <ul className="foot-links">
                <li><button type="button" onClick={handleOpenAbout} className="foot-link-btn">{lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About ToolGhor'}</button></li>
                <li><button type="button" onClick={handleOpenRequestTool} className="foot-link-btn">{lang === 'bn' ? 'নতুন টুলের অনুরোধ' : 'Request a Tool'}</button></li>
                <li><button type="button" onClick={handleOpenAiKeys} className="foot-link-btn">{lang === 'bn' ? 'এপিআই কি সেটিংস' : 'Connect API Keys'}</button></li>
                <li><Link href="/admin">{lang === 'bn' ? '🛡️ অ্যাডমিন কনসোল' : '🛡️ Admin Console'}</Link></li>
                {waNumber && (
                  <li>
                    <a href={waUrl} target="_blank" rel="noopener noreferrer">
                      {lang === 'bn' ? '💬 সরাসরি যোগাযোগ' : '💬 WhatsApp Contact'}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 4: Privacy & Standards */}
            <div className="foot-col">
              <h3 className="foot-heading">{lang === 'bn' ? 'গোপনীয়তা ও নিরাপত্তা' : 'Privacy & Security'}</h3>
              <div className="foot-badge-box">
                <div className="foot-badge-item">
                  <span className="foot-badge-icon">🔒</span>
                  <div>
                    <strong>{lang === 'bn' ? '১০০% ব্রাউজার প্রসেসিং' : '100% In-Browser'}</strong>
                    <p>{lang === 'bn' ? 'কোনো ফাইল সার্ভারে জমা হয় না।' : 'No file upload or storage.'}</p>
                  </div>
                </div>
                <div className="foot-badge-item">
                  <span className="foot-badge-icon">⚡</span>
                  <div>
                    <strong>{lang === 'bn' ? 'কোনো বিজ্ঞাপন বা সাইন-আপ নেই' : 'No Ads or Sign-up'}</strong>
                    <p>{lang === 'bn' ? 'সরাসরি দ্রুত ও সম্পূর্ণ ফ্রি ব্যবহার।' : 'Free and frictionless forever.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Correct Copyright Spacing */}
          <div className="foot-bottom">
            <div className="foot-bottom-text">
              © {new Date().getFullYear()} <span className="font-semibold text-emerald-500">{siteConfig.name}</span>. {copyrightText}
            </div>
            <div className="foot-bottom-tagline">
              {lang === 'bn' ? 'দৈনন্দিন কাজের বিশ্বস্ত সঙ্গী' : 'Built for speed, simplicity and privacy'}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button (Active / Inactive controllable from Admin, Dismissible with Safe-area Insets) */}
      {isWhatsappActive && !fabDismissed && (
        <div className="fab-wrapper" role="complementary" aria-label="WhatsApp Support">
          <button
            type="button"
            className="fab-dismiss-btn"
            onClick={handleDismissFab}
            aria-label={lang === 'bn' ? 'হোয়াটসঅ্যাপ বাটন বন্ধ করুন' : 'Dismiss WhatsApp button'}
            title={lang === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
          >
            ✕
          </button>
          <a
            className="fab"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            title={lang === 'bn' ? 'হোয়াটসঅ্যাপে মেসেজ পাঠান' : 'Chat on WhatsApp'}
          >
            <span className="ic" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
              </svg>
            </span>
          </a>
        </div>
      )}
    </>
  );
}

