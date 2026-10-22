'use client';

import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function Header() {
  const { lang, setLang } = useApp();

  // Three-dot menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

        {/* Three-Dot (⋮) Menu Button on Right Side of Header */}
        <div ref={menuRef} className="header-menu-wrap" style={{ marginInlineStart: 'auto' }}>
          <button
            type="button"
            className={`btn-header-menu ${isMenuOpen ? 'open' : ''}`}
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
            <div className="header-menu-dropdown" role="menu">
              {/* 1. About */}
              <button
                type="button"
                className="header-menu-item"
                role="menuitem"
                onClick={() => {
                  handleOpenAbout();
                  setIsMenuOpen(false);
                }}
              >
                <span className="header-menu-ic" aria-hidden="true">ℹ️</span>
                <span>{lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About'}</span>
              </button>

              {/* 2. Language Switcher (EN / বাংলা) */}
              <div className="header-menu-lang-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="header-menu-ic" aria-hidden="true">🌐</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>
                    {lang === 'bn' ? 'ভাষা' : 'Language'}
                  </span>
                </div>
                <div className="header-menu-lang-toggle" role="group" aria-label="Language">
                  <button
                    type="button"
                    className={`header-lang-btn ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => {
                      if (lang !== 'en') {
                        setLang('en');
                      }
                    }}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={`header-lang-btn ${lang === 'bn' ? 'active' : ''}`}
                    onClick={() => {
                      if (lang !== 'bn') {
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
                className="header-menu-item"
                role="menuitem"
                onClick={() => {
                  handleOpenAiKeys();
                  setIsMenuOpen(false);
                }}
              >
                <span className="header-menu-ic" aria-hidden="true">
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
                className="header-menu-item"
                role="menuitem"
                onClick={() => {
                  handleOpenRequestTool();
                  setIsMenuOpen(false);
                }}
              >
                <span className="header-menu-ic" aria-hidden="true">🛠️</span>
                <span>{lang === 'bn' ? 'টুলের অনুরোধ' : 'Request a Tool'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
