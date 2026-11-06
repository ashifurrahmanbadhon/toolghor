'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { siteConfig } from '@/data/config';
import { ContentTexts, DEFAULT_CONTENT_TEXTS } from '@/data/contentTexts';
import { isPreviewMode, initPreviewMode, subscribePreview } from '@/lib/previewMode';

interface FooterProps {
  customSettings?: any;
  contentTexts?: ContentTexts;
}

export default function Footer({ customSettings, contentTexts: initialContentTexts }: FooterProps) {
  const { lang } = useApp();
  const [liveFooter, setLiveFooter] = useState<any>(customSettings || null);
  const [contentTexts, setContentTexts] = useState<ContentTexts>(
    initialContentTexts || DEFAULT_CONTENT_TEXTS
  );

  useEffect(() => {
    // CMS Preview Mode subscription
    let unsubPreview: (() => void) | null = null;
    if (isPreviewMode()) {
      initPreviewMode();
      unsubPreview = subscribePreview((msg) => {
        if (msg.publicData?.footerSocial) setLiveFooter(msg.publicData.footerSocial);
        if (msg.publicData?.contentTexts) setContentTexts(msg.publicData.contentTexts);
      });
    }

    if (customSettings) {
      setLiveFooter(customSettings);
      return () => {
        if (unsubPreview) unsubPreview();
      };
    }
    const fetchFooter = () => {
      fetch('/api/public/data?t=' + Date.now(), { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.success) {
            if (data.footerSocial) setLiveFooter(data.footerSocial);
            if (data.contentTexts) setContentTexts(data.contentTexts);
          }
        })
        .catch(() => {});
    };

    fetchFooter();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('toolghor_sync');
        channel.onmessage = (evt) => {
          if (evt.data === 'refresh') fetchFooter();
        };
      } catch {}
    }

    return () => {
      if (channel) channel.close();
      if (unsubPreview) unsubPreview();
    };
  }, [customSettings]);

  const isFooterActive = liveFooter ? liveFooter.is_active : true;
  const isWhatsappActive = liveFooter ? (liveFooter.whatsapp_active !== false) : true;

  const waNumber = String(
    liveFooter?.whatsapp_number || siteConfig.social?.whatsapp?.number || '8801700000000'
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

  const [showToTop, setShowToTop] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      if (isStandalone) {
        setIsInstalled(true);
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch {}
    setDeferredPrompt(null);
  };

  const canInstall = !isInstalled && !!deferredPrompt;

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setShowToTop(y > 600);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBackToTop = () => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  if (!isFooterActive) return null;

  return (
    <>
      <footer className="foot" id="footer-section">
        <div className="wrap foot-row">
          <div className="foot-left">
            © 2026 <span>{siteConfig.name}</span>. {copyrightText}
          </div>
          <div className="foot-links">
            <Link href="/guides" className="foot-link">
              {lang === 'bn' ? (contentTexts.footer?.guides_bn || 'গাইড') : (contentTexts.footer?.guides_en || 'Guides')}
            </Link>
            <span className="foot-sep" aria-hidden="true">·</span>
            <Link href="/faq" className="foot-link">
              {lang === 'bn' ? (contentTexts.footer?.faq_bn || 'সাধারণ জিজ্ঞাসা') : (contentTexts.footer?.faq_en || 'FAQ')}
            </Link>
            <span className="foot-sep" aria-hidden="true">·</span>
            <Link href="/terms" className="foot-link">
              {lang === 'bn' ? (contentTexts.footer?.terms_bn || 'ব্যবহারের শর্তাবলী') : (contentTexts.footer?.terms_en || 'Terms of Service')}
            </Link>
            <span className="foot-sep" aria-hidden="true">·</span>
            <Link href="/privacy" className="foot-link">
              {lang === 'bn' ? (contentTexts.footer?.privacy_bn || 'গোপনীয়তা নীতি') : (contentTexts.footer?.privacy_en || 'Privacy Policy')}
            </Link>
            <span className="foot-sep" aria-hidden="true">·</span>
            <Link
              href="/admin"
              className="foot-link foot-admin"
              title={lang === 'bn' ? 'অ্যাডমিন কনসোল' : 'Admin Console'}
            >
              {lang === 'bn' ? (contentTexts.footer?.admin_bn || 'অ্যাডমিন') : (contentTexts.footer?.admin_en || 'Admin')}
            </Link>
          </div>
        </div>

        {/* PWA Install Button — quiet, standalone element, shown only when beforeinstallprompt is active */}
        {canInstall && (
          <div className="wrap foot-install-bar" style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleInstallClick}
              className="foot-install-btn"
              aria-label={lang === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 500,
                color: 'var(--ink-2, #a1a1aa)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--line, rgba(255, 255, 255, 0.1))',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--ink, #ffffff)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--ink-2, #a1a1aa)';
                e.currentTarget.style.borderColor = 'var(--line, rgba(255, 255, 255, 0.1))';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{lang === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}</span>
            </button>
          </div>
        )}
      </footer>

      {/* Floating Back-to-Top Button */}
      <button
        type="button"
        onClick={handleBackToTop}
        className={`to-top-fab ${isWhatsappActive ? 'has-wa' : ''} ${showToTop ? 'show' : ''}`}
        aria-label={lang === 'bn' ? (contentTexts.footer?.back_to_top_bn || 'উপরে যান') : (contentTexts.footer?.back_to_top_en || 'Back to top')}
        title={lang === 'bn' ? (contentTexts.footer?.back_to_top_bn || 'উপরে যান') : (contentTexts.footer?.back_to_top_en || 'Back to top')}
        tabIndex={showToTop ? 0 : -1}
        aria-hidden={!showToTop}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>

      {/* Floating WhatsApp Action Button */}
      {isWhatsappActive && (
        <a
          className="fab"
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          title="WhatsApp"
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
      )}
    </>
  );
}
