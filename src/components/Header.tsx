'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function Header() {
  const { lang, setLang } = useApp();

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
        <Link href="/" className="brand" aria-label="ToolGhor">
          <picture>
            <source
              type="image/webp"
              data-cfg="logoDarkWebp"
              srcSet="/assets/logo-dark.webp"
              media="(prefers-color-scheme: dark)"
            />
            <source
              data-cfg="logoDark"
              srcSet="/assets/logo-dark.png"
              media="(prefers-color-scheme: dark)"
            />
            <source type="image/webp" data-cfg="logoWebp" srcSet="/assets/logo.webp" />
            <img
              className="brand-logo"
              data-cfg="logo"
              src="/assets/logo.png"
              alt="ToolGhor"
              width={205}
              height={50}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </Link>

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
          <div className="lang" role="group" aria-label="Language">
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
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px' }}
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
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px' }}
                title="বাংলা"
              >
                বাংলা
              </button>
            )}
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

          {/* Admin link */}
          <Link href="/admin" className="pill" title="Admin Console">
            <span>🛡️ {lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
