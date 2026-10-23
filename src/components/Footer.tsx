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

  useEffect(() => {
    if (customSettings) {
      setLiveFooter(customSettings);
      return;
    }
    const fetchFooter = () => {
      fetch('/api/public/data?t=' + Date.now(), { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.success && data.footerSocial) {
            setLiveFooter(data.footerSocial);
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

  if (!isFooterActive) return null;

  return (
    <>
      <footer className="foot">
        <div className="wrap foot-row">
          <div className="foot-left">
            © 2026 <span>{siteConfig.name}</span>. {copyrightText}
          </div>
          <div className="foot-links">
            <Link href="/privacy" className="foot-link">
              {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </Link>
            <span className="foot-sep" aria-hidden="true">·</span>
            <Link href="/terms" className="foot-link">
              {lang === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service'}
            </Link>
            <span className="foot-sep" aria-hidden="true">·</span>
            <Link href="/faq" className="foot-link">
              {lang === 'bn' ? 'সাধারণ জিজ্ঞাসা' : 'FAQ'}
            </Link>
            <span className="foot-sep" aria-hidden="true">·</span>
            <Link
              href="/admin"
              className="foot-link foot-admin"
              title={lang === 'bn' ? 'অ্যাডমিন কনসোল' : 'Admin Console'}
            >
              {lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}
            </Link>
          </div>
        </div>
      </footer>

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
