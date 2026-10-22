'use client';

import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function Header() {
  const { lang, setLang } = useApp();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const enBtnRef = useRef<HTMLButtonElement | null>(null);
  const bnBtnRef = useRef<HTMLButtonElement | null>(null);
  const thumbRef = useRef<HTMLSpanElement | null>(null);
  const hasUserInteracted = useRef(false);

  // Mobile three-dot menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  useIsomorphicLayoutEffect(() => {
    const activeBtn = lang === 'en' ? enBtnRef.current : bnBtnRef.current;
    const thumb = thumbRef.current;
    const container = containerRef.current;
    if (!activeBtn || !thumb) return;

    const left = activeBtn.offsetLeft;
    const width = activeBtn.offsetWidth;
    const top = activeBtn.offsetTop;
    const height = activeBtn.offsetHeight;

    if (!hasUserInteracted.current) {
      // First mount / initial hydration: place thumb directly under active button with zero transition
      thumb.style.transition = 'none';
      thumb.style.transform = `translateX(${left}px)`;
      thumb.style.width = `${width}px`;
      if (top) thumb.style.top = `${top}px`;
      if (height) thumb.style.height = `${height}px`;

      // Force synchronous reflow
      void thumb.offsetHeight;

      // Re-enable smooth transition for future clicks
      thumb.style.transition = '';
      if (container) container.classList.add('is-ready');
    } else {
      // User-initiated click: smoothly glide and resize thumb
      thumb.style.transform = `translateX(${left}px)`;
      thumb.style.width = `${width}px`;
      if (top) thumb.style.top = `${top}px`;
      if (height) thumb.style.height = `${height}px`;
    }
  }, [lang]);

  useEffect(() => {
    const handleResize = () => {
      const activeBtn = lang === 'en' ? enBtnRef.current : bnBtnRef.current;
      const thumb = thumbRef.current;
      if (!activeBtn || !thumb) return;

      thumb.style.transition = 'none';
      thumb.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
      thumb.style.width = `${activeBtn.offsetWidth}px`;
      if (activeBtn.offsetTop) thumb.style.top = `${activeBtn.offsetTop}px`;
      if (activeBtn.offsetHeight) thumb.style.height = `${activeBtn.offsetHeight}px`;
      void thumb.offsetHeight;
      thumb.style.transition = '';
    };

    window.addEventListener('resize', handleResize, { passive: true });
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(handleResize).catch(() => {});
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [lang]);

  const handleOpenAbout = () => {
    const w = window as any;
    if (w.UI && typeof w.UI.openAboutModal === 'function') {
      w.UI.openAboutModal();
    }
  };

  const handleOpenAiKeys = () => {
    const w = window as any;
    if (w.UI && typeof w.UI.openAiKeysModal === 'function') {
      w.UI.openAiKeysModal();
    }
  };

  const handleOpenRequestTool = () => {
    const w = window as any;
    if (w.UI && typeof w.UI.openRequestToolModal === 'function') {
      w.UI.openRequestToolModal();
    }
  };

  return (
    <header className="top">
      <div className="wrap top-in">
        <Link
          href="/"
          scroll={true}
          className="brand"
          aria-label="ToolGhor"
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

        {/* Desktop Header Actions (Pill Row - Desktop Only) */}
        <div className="top-actions" style={{ marginInlineStart: 'auto' }}>
          {/* About Button */}
          <button
            type="button"
            className="btn-top-about"
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

          {/* Language Switcher */}
          <div ref={containerRef} className="lang" role="group" aria-label="Language">
            <span className="lang-ic" aria-hidden="true">
              🌐
            </span>
            <span
              ref={thumbRef}
              className="lang-thumb"
              aria-hidden="true"
            />
            <button
              ref={enBtnRef}
              type="button"
              className={`lang-btn ${lang === 'en' ? 'on' : ''}`}
              aria-pressed={lang === 'en'}
              onClick={() => {
                if (lang !== 'en') {
                  hasUserInteracted.current = true;
                  setLang('en');
                }
              }}
              title="English"
            >
              EN
            </button>
            <button
              ref={bnBtnRef}
              type="button"
              className={`lang-btn ${lang === 'bn' ? 'on' : ''}`}
              aria-pressed={lang === 'bn'}
              onClick={() => {
                if (lang !== 'bn') {
                  hasUserInteracted.current = true;
                  setLang('bn');
                }
              }}
              title="বাংলা"
            >
              বাংলা
            </button>
          </div>

          {/* Connect API Keys */}
          <button
            type="button"
            className="btn-api-connect"
            id="btn-ai-keys"
            aria-label="Connect API Keys"
            title="Connect API Keys for enhanced results"
            onClick={handleOpenAiKeys}
          >
            <span className="ic" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
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
            className="btn-request-tool"
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
        </div>

        {/* Mobile Three-Dot (⋮) Menu (Mobile Only, Single Top-Right Row) */}
        <div ref={mobileMenuRef} className="mobile-menu-wrap">
          <button
            type="button"
            className={`btn-mobile-menu ${isMenuOpen ? 'open' : ''}`}
            aria-label="Navigation menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title={lang === 'bn' ? 'মেনু' : 'Menu'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="12" cy="5" r="2.2" />
              <circle cx="12" cy="12" r="2.2" />
              <circle cx="12" cy="19" r="2.2" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="mobile-menu-dropdown" role="menu">
              {/* 1. About */}
              <button
                type="button"
                className="mobile-menu-item"
                role="menuitem"
                onClick={() => {
                  handleOpenAbout();
                  setIsMenuOpen(false);
                }}
              >
                <span className="mobile-menu-ic" aria-hidden="true">ℹ️</span>
                <span>{lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About'}</span>
              </button>

              {/* 2. Language Switcher (EN / বাংলা) */}
              <div className="mobile-menu-lang-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mobile-menu-ic" aria-hidden="true">🌐</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>
                    {lang === 'bn' ? 'ভাষা' : 'Language'}
                  </span>
                </div>
                <div className="mobile-menu-lang-toggle" role="group" aria-label="Language">
                  <button
                    type="button"
                    className={`mobile-lang-btn ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => {
                      if (lang !== 'en') {
                        hasUserInteracted.current = true;
                        setLang('en');
                      }
                    }}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={`mobile-lang-btn ${lang === 'bn' ? 'active' : ''}`}
                    onClick={() => {
                      if (lang !== 'bn') {
                        hasUserInteracted.current = true;
                        setLang('bn');
                      }
                    }}
                  >
                    বাংলা
                  </button>
                </div>
              </div>

              {/* 3. API Keys */}
              <button
                type="button"
                className="mobile-menu-item"
                role="menuitem"
                onClick={() => {
                  handleOpenAiKeys();
                  setIsMenuOpen(false);
                }}
              >
                <span className="mobile-menu-ic" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
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
              </button>

              {/* 4. Request a Tool */}
              <button
                type="button"
                className="mobile-menu-item"
                role="menuitem"
                onClick={() => {
                  handleOpenRequestTool();
                  setIsMenuOpen(false);
                }}
              >
                <span className="mobile-menu-ic" aria-hidden="true">🛠️</span>
                <span>{lang === 'bn' ? 'টুলের অনুরোধ' : 'Request a Tool'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
