'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface LivePreviewPanelProps {
  url: string;
  previewAnchor?: string;
  title?: string;
  draftData: {
    hero?: any;
    announcement?: any;
    categories?: any;
    tools?: any;
    footerSocial?: any;
    creatorAbout?: any;
    uiSettings?: any;
    policies?: any;
    removeAiLabel?: any;
    contentTexts?: any;
    apiKeys?: any;
  };
  guideDraft?: {
    slug: string;
    guide: any;
  } | null;
  faqDraft?: {
    scope: string;
    items: any[];
  } | null;
}

export default function LivePreviewPanel({
  url,
  previewAnchor,
  title = 'LIVE SIMULATION',
  draftData,
  guideDraft,
  faqDraft,
}: LivePreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Lazy loading: only mount/load iframe when panel approaches viewport
  useEffect(() => {
    if (hasIntersected) return;
    const el = rootRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasIntersected(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasIntersected]);

  // Track container width for scaling mobile phone frame gracefully
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Display path pill showing the section's actual target path (e.g. /, /#main, /tools/merge-pdf)
  const displayPath = useMemo(() => {
    const hash = previewAnchor
      ? (previewAnchor.startsWith('#') ? previewAnchor : `#${previewAnchor}`)
      : '';
    if (url.includes('#')) return url;
    return `${url}${hash}`;
  }, [url, previewAnchor]);

  // Ensure cms_preview=1 and anchor are attached to iframe src
  const iframeSrc = useMemo(() => {
    const separator = url.includes('?') ? '&' : '?';
    const cleanUrl = url.replace(/#.*$/, '');
    const hash = previewAnchor
      ? (previewAnchor.startsWith('#') ? previewAnchor : `#${previewAnchor}`)
      : (url.includes('#') ? url.substring(url.indexOf('#')) : '');
    return `${cleanUrl}${separator}cms_preview=1${hash}`;
  }, [url, previewAnchor]);

  // Compile safe publicData payload (flags only, strictly zero secret keys)
  const compilePayload = () => {
    const rawApi = draftData.apiKeys;
    const safeApiKeys = rawApi
      ? {
          is_active: Boolean(rawApi.is_active),
          gemini_active: Boolean(rawApi.gemini_active),
          openai_active: Boolean(rawApi.openai_active),
          convertapi_active: Boolean(rawApi.convertapi_active),
          removebg_active: Boolean(rawApi.removebg_active),
          ilovepdf_active: Boolean(rawApi.ilovepdf_active),
          ilovepdf_public_key: typeof rawApi.ilovepdf_public_key === 'string' ? rawApi.ilovepdf_public_key.trim() : '',
        }
      : null;

    const payload: any = {
      type: 'cms-preview',
      previewAnchor,
      publicData: {
        success: true,
        hero: draftData.hero,
        announcement: draftData.announcement,
        categories: draftData.categories,
        tools: draftData.tools,
        footerSocial: draftData.footerSocial,
        creatorAbout: draftData.creatorAbout,
        uiSettings: draftData.uiSettings,
        policies: draftData.policies,
        removeAiLabel: draftData.removeAiLabel,
        contentTexts: draftData.contentTexts,
        apiKeys: safeApiKeys,
      },
    };

    if (guideDraft) payload.guideDraft = guideDraft;
    if (faqDraft) payload.faqDraft = faqDraft;

    return payload;
  };

  const sendDraft = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      const payload = compilePayload();
      iframeRef.current.contentWindow.postMessage(payload, window.location.origin);
    } catch {
      // Cross-origin guards
    }
  };

  // Debounced send on draft data changes (~300ms)
  useEffect(() => {
    if (!isIframeLoaded) return;
    const timer = setTimeout(sendDraft, 300);
    return () => clearTimeout(timer);
  }, [draftData, guideDraft, faqDraft, isIframeLoaded, previewAnchor]);

  // Handle iframe ready message
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'cms-preview-ready') {
        setIsIframeLoaded(true);
        sendDraft();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [draftData, guideDraft, faqDraft, previewAnchor]);

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    sendDraft();
  };

  const handleReload = () => {
    if (iframeRef.current && hasIntersected) {
      setIsIframeLoaded(false);
      iframeRef.current.src = iframeSrc;
    }
  };

  const handleOpenExternal = () => {
    const livePath = displayPath.replace(/(\?|&)cms_preview=[^&]*/, '').replace(/\?$/, '');
    const fullLiveUrl = typeof window !== 'undefined' ? `${window.location.origin}${livePath}` : livePath;
    window.open(fullLiveUrl, '_blank');
  };

  // Compute scale for mobile phone frame if pane is narrower than 430px
  const phoneScale = containerWidth > 0 && containerWidth < 430 ? Math.max(0.68, (containerWidth - 28) / 410) : 1;

  return (
    <div
      ref={rootRef}
      style={{
        background: '#0b0f19',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '740px',
      }}
    >
      {/* Simulation Header: Reference Design Match */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Left: 3 macOS dots (red/yellow/green) + bold LIVE SIMULATION label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ef4444',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#eab308',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: '#f8fafc',
              marginLeft: '4px',
            }}
          >
            LIVE SIMULATION
          </span>
        </div>

        {/* Centre: Pill showing current preview path */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '999px',
            padding: '3px 12px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#cbd5e1',
            letterSpacing: '0.2px',
            maxWidth: '280px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={displayPath}
        >
          {displayPath}
        </div>

        {/* Right: Desktop / Mobile toggle + Refresh + Open In New Tab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Desktop (monitor) / Mobile (phone) Toggle */}
          <div
            style={{
              display: 'inline-flex',
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              title="Desktop viewport"
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                background: viewMode === 'desktop' ? '#10b981' : 'transparent',
                color: viewMode === 'desktop' ? '#ffffff' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              DESKTOP
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              title="Mobile phone viewport (390×844)"
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                background: viewMode === 'mobile' ? '#10b981' : 'transparent',
                color: viewMode === 'mobile' ? '#ffffff' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              MOBILE
            </button>
          </div>

          {/* Refresh icon button (reloads the iframe) */}
          <button
            type="button"
            onClick={handleReload}
            title="Reload preview frame"
            style={{
              padding: '6px 8px',
              background: '#1e293b',
              border: 'none',
              borderRadius: '6px',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>

          {/* Open-in-new-tab icon button (opens live page without preview param) */}
          <button
            type="button"
            onClick={handleOpenExternal}
            title="Open live page in new tab"
            style={{
              padding: '6px 8px',
              background: '#1e293b',
              border: 'none',
              borderRadius: '6px',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: viewMode === 'mobile' ? 'flex-start' : 'stretch',
          justifyContent: 'center',
          padding: viewMode === 'mobile' ? '24px 12px' : '0',
          background: viewMode === 'mobile' ? '#070a12' : '#0b0f19',
          overflow: viewMode === 'mobile' ? 'auto' : 'hidden',
          minHeight: '660px',
        }}
      >
        {!hasIntersected ? (
          // Lazy loading placeholder: zero network load until approached
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '660px',
              color: '#64748b',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid #334155',
                borderTopColor: '#10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>
              Connecting live simulation...
            </span>
          </div>
        ) : viewMode === 'desktop' ? (
          // Desktop: frame fills the block width
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={`Preview of ${url}`}
            onLoad={handleIframeLoad}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '660px',
              border: 'none',
              background: '#09130f',
              display: 'block',
            }}
          />
        ) : (
          // Mobile: page shown inside a phone frame (thick rounded border, centred) at 390×844, scaled to fit
          <div
            style={{
              width: '390px',
              height: '844px',
              borderRadius: '38px',
              border: '10px solid #1e293b',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              position: 'relative',
              background: '#090d16',
              transform: phoneScale < 1 ? `scale(${phoneScale})` : undefined,
              transformOrigin: 'top center',
              marginBottom: phoneScale < 1 ? `${(phoneScale - 1) * 844}px` : undefined,
              flexShrink: 0,
            }}
          >
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              title={`Preview of ${url}`}
              onLoad={handleIframeLoad}
              style={{
                width: '390px',
                height: '844px',
                border: 'none',
                background: '#09130f',
                display: 'block',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
