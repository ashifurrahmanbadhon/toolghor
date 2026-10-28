'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ASSET_VERSION as BUILT_VERSION } from '@/data/config';
// Version marker: 20261028_v48
import { useApp } from '@/context/AppContext';
import { isPreviewMode } from '@/lib/previewMode';

export default function VersionUpdateChecker() {
  const { lang } = useApp();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastCheckTime = useRef<number>(0);
  const isChecking = useRef<boolean>(false);

  const checkVersion = async () => {
    // Disable in CMS preview mode
    if (isPreviewMode()) return;

    // Guard: check at most once per minute
    const now = Date.now();
    if (now - lastCheckTime.current < 60000 || isChecking.current) {
      return;
    }
    lastCheckTime.current = now;
    isChecking.current = true;

    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.version && data.version !== BUILT_VERSION) {
        setUpdateAvailable(true);
      }
    } catch {
      // Offline or network error stays completely silent
    } finally {
      isChecking.current = false;
    }
  };

  useEffect(() => {
    // Unregister any service workers on load (future-proof)
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().catch(() => {});
          }
        }).catch(() => {});
      }
    } catch {}

    // Check version on mount
    checkVersion();

    // Check on tab visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check every 5 minutes (300,000 ms)
    const intervalId = setInterval(() => {
      checkVersion();
    }, 300000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  if (!updateAvailable || dismissed) {
    return null;
  }

  const handleRefresh = () => {
    try {
      window.location.reload();
    } catch {
      window.location.href = window.location.href;
    }
  };

  const bannerText =
    lang === 'bn'
      ? '🔄 নতুন আপডেট এসেছে — ওয়েবসাইটটি Refresh করুন'
      : '🔄 New update available — Please refresh';
  const refreshText = lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh';

  return (
    <div
      role="alert"
      className="version-update-banner"
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(90deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
        color: '#ffffff',
        borderBottom: '1px solid rgba(147, 197, 253, 0.35)',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        fontSize: '13.5px',
        fontWeight: 600,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        {bannerText}
      </span>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={handleRefresh}
          style={{
            background: '#ffffff',
            color: '#1d4ed8',
            border: 'none',
            borderRadius: '999px',
            padding: '5px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: '34px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {refreshText}
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '6px 8px',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
