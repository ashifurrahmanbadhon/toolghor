'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Header() {
  const { lang, setLang } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle outside click & Escape key to close mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        menuBtnRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        navRef.current &&
        !navRef.current.contains(e.target as Node) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Prevent body scroll when drawer is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleOpenAbout = () => {
    setMobileMenuOpen(false);
    const w = window as any;
    if (w.UI && typeof w.UI.openAboutModal === 'function') {
      w.UI.openAboutModal();
    }
  };

  const handleOpenAiKeys = () => {
    setMobileMenuOpen(false);
    const w = window as any;
    if (w.UI && typeof w.UI.openAiKeysModal === 'function') {
      w.UI.openAiKeysModal();
    }
  };

  const handleOpenRequestTool = () => {
    setMobileMenuOpen(false);
    const w = window as any;
    if (w.UI && typeof w.UI.openRequestToolModal === 'function') {
      w.UI.openRequestToolModal();
    }
  };

  return (
    <header className="top" role="banner">
      <div className="wrap top-in">
        {/* Brand Logo */}
        <Link
          href="/"
          scroll={true}
          className="brand"
          aria-label="ToolGhor Home"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }
          }}
        >
          <picture>
            <source
              type="image/webp"
              data-cfg="logoDarkWebp"
              srcSet="/assets/logo-dark.webp"
            />
            <source
              data-cfg="logoDark"
              srcSet="/assets/logo-dark.png"
            />
            <img
              className="brand-logo"
              data-cfg="logo"
              src="/assets/logo-dark.png"
              alt="ToolGhor"
              width={205}
              height={50}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </Link>

        {/* Right Header Cluster */}
        <div className="top-actions-cluster">
          {/* Always Visible Language Switcher */}
          <div className="lang" role="group" aria-label={lang === 'bn' ? 'ভাষা নির্বাচন' : 'Language selection'}>
            <span className="lang-ic" aria-hidden="true">
              🌐
            </span>
            {lang === 'en' ? (
              <span className="on" aria-current="true" lang="en">
                EN
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setLang('en')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                title="English"
              >
                EN
              </button>
            )}
            {lang === 'bn' ? (
              <span className="on" aria-current="true" lang="bn">
                বাংলা
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setLang('bn')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                title="বাংলা"
              >
                বাংলা
              </button>
            )}
          </div>

          {/* Desktop Navigation Links (>= 640px) */}
          <nav className="nav-desktop" aria-label="Desktop Navigation">
            {/* Explicit Home Link */}
            <Link
              href="/"
              className={`pill nav-link-home ${pathname === '/' ? 'active' : ''}`}
              title={lang === 'bn' ? 'হোমপেজে যান' : 'Go to Homepage'}
            >
              <span aria-hidden="true">🏠</span>
              <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
            </Link>

            {/* About Button */}
            <button
              type="button"
              className="btn-top-about pill"
              id="btn-top-about"
              aria-label="About ToolGhor"
              title="About ToolGhor"
              onClick={handleOpenAbout}
            >
              <span className="btn-about-ic" aria-hidden="true">
                ℹ️
              </span>
              <span>{lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About'}</span>
            </button>

            {/* Connect API Keys */}
            <button
              type="button"
              className="btn-api-connect pill"
              id="btn-ai-keys"
              aria-label="Connect API Keys"
              title="Connect API Keys for enhanced results"
              onClick={handleOpenAiKeys}
            >
              <span className="ic" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                  <path d="M20 2v4" />
                  <path d="M22 4h-4" />
                  <circle cx="4" cy="20" r="2" />
                </svg>
              </span>
              <span>{lang === 'bn' ? 'এপিআই কি' : 'API Keys'}</span>
              <span className="api-dot" hidden suppressHydrationWarning></span>
            </button>

            {/* Request a Tool */}
            <button
              type="button"
              className="btn-request-tool pill"
              id="btn-request-tool"
              aria-label="Request a Tool"
              title="Request a new tool or suggest ideas"
              onClick={handleOpenRequestTool}
            >
              <span className="btn-req-icon" aria-hidden="true">
                🛠️
              </span>
              <span>{lang === 'bn' ? 'টুলের অনুরোধ' : 'Request a Tool'}</span>
            </button>

            {/* Admin link */}
            <Link href="/admin" className="pill pill-admin" title="Admin Console">
              <span>🛡️ {lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
            </Link>
          </nav>

          {/* Hamburger Menu Toggle (< 640px) */}
          <button
            ref={menuBtnRef}
            type="button"
            className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
            aria-label={
              mobileMenuOpen
                ? lang === 'bn'
                  ? 'মেনু বন্ধ করুন'
                  : 'Close navigation menu'
                : lang === 'bn'
                ? 'মেনু খুলুন'
                : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="hamburger-box">
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay and Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        ref={navRef}
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'bn' ? 'মোবাইল নেভিগেশন মেনু' : 'Mobile navigation menu'}
      >
        <div className="mobile-drawer-header">
          <span className="mobile-drawer-title">
            {lang === 'bn' ? 'নেভিগেশন মেনু' : 'Navigation Menu'}
          </span>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close menu'}
          >
            ✕
          </button>
        </div>

        <nav className="mobile-drawer-links" aria-label="Mobile Navigation Links">
          <Link
            href="/"
            className={`drawer-link ${pathname === '/' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="drawer-link-ic">🏠</span>
            <div className="drawer-link-text">
              <strong>{lang === 'bn' ? 'হোমপেজ' : 'Home'}</strong>
              <small>{lang === 'bn' ? 'সকল টুলসের তালিকা' : 'Browse all tools'}</small>
            </div>
          </Link>

          <button
            type="button"
            className="drawer-link drawer-btn"
            onClick={handleOpenAbout}
          >
            <span className="drawer-link-ic">ℹ️</span>
            <div className="drawer-link-text">
              <strong>{lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About ToolGhor'}</strong>
              <small>{lang === 'bn' ? 'টুলঘর ও আমাদের লক্ষ্য' : 'Learn more about us'}</small>
            </div>
          </button>

          <button
            type="button"
            className="drawer-link drawer-btn"
            onClick={handleOpenAiKeys}
          >
            <span className="drawer-link-ic">🔑</span>
            <div className="drawer-link-text">
              <strong>{lang === 'bn' ? 'এপিআই কি সেটআপ' : 'API Keys Settings'}</strong>
              <small>{lang === 'bn' ? 'Gemini ও OpenAI কানেক্ট' : 'Custom AI keys configuration'}</small>
            </div>
          </button>

          <button
            type="button"
            className="drawer-link drawer-btn"
            onClick={handleOpenRequestTool}
          >
            <span className="drawer-link-ic">🛠️</span>
            <div className="drawer-link-text">
              <strong>{lang === 'bn' ? 'টুলের অনুরোধ' : 'Request a Tool'}</strong>
              <small>{lang === 'bn' ? 'নতুন টুলের জন্য প্রস্তাব' : 'Suggest a new tool'}</small>
            </div>
          </button>

          <Link
            href="/admin"
            className="drawer-link drawer-link-admin"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="drawer-link-ic">🛡️</span>
            <div className="drawer-link-text">
              <strong>{lang === 'bn' ? 'অ্যাডমিন কনসোল' : 'Admin Console'}</strong>
              <small>{lang === 'bn' ? 'সাইট কন্ট্রোল প্যানেল' : 'Management & stats'}</small>
            </div>
          </Link>
        </nav>

        <div className="mobile-drawer-footer">
          <div className="mobile-drawer-privacy">
            <span>🔒</span>
            <small>
              {lang === 'bn'
                ? '১০০% ব্রাউজারে প্রসেসিং • নিরাপদ ও প্রাইভেট'
                : '100% In-browser • Private & Secure'}
            </small>
          </div>
        </div>
      </div>
    </header>
  );
}

