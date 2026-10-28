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
  const [stageWidth, setStageWidth] = useState(0);
  const [stageHeight, setStageHeight] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<{ desktop?: number; mobile?: number }>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determine if this preview targets an anchored section on the homepage (/)
  const isAnchoredSection = Boolean(
    previewAnchor &&
    (url === '/' || url === '' || url.startsWith('/?') || url.startsWith('/#'))
  );

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

  // Track stage dimensions for computing desktop scale to fit
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setStageWidth(entry.contentRect.width);
        setStageHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode]);

  // Reset measured height when switching target section / anchor
  useEffect(() => {
    setMeasuredHeights({});
  }, [url, previewAnchor]);

  // Mobile logical height: anchored sections fit the target block (+ ≈24px padding, clamped min 220, max 1350)
  // Full-page targets keep tall frame: mobile 844
  const mobileLogicalHeight = useMemo(() => {
    if (isAnchoredSection) {
      const currentMeasured = measuredHeights.mobile;
      if (typeof currentMeasured === 'number' && currentMeasured > 0) {
        return Math.min(1350, Math.max(220, Math.round(currentMeasured + 24)));
      }
      return 220; // Until measurement arrives, show min height (no tall flash)
    }
    return 844;
  }, [isAnchoredSection, measuredHeights.mobile]);

  // Desktop scale to fit (matches Portfolio exactly):
  // Fixed 1440x900 logical viewport scaled to the stage:
  // scale = min(1, stageWidth / 1464, stageHeight / 924), clamped to min 0.2
  const desktopScale = useMemo(() => {
    const w = stageWidth > 0 ? stageWidth : (containerWidth > 0 ? containerWidth : 1440);
    const h = stageHeight > 0 ? stageHeight : 600;
    const scaleW = w / 1464;
    const scaleH = h / 924;
    return Math.min(1, Math.max(0.2, Math.min(scaleW, scaleH)));
  }, [stageWidth, stageHeight, containerWidth]);

  // Display path pill showing the section's actual target path (e.g. /, /#main, /tools/merge-pdf)
  const displayPath = useMemo(() => {
    const hash = previewAnchor
      ? (previewAnchor.startsWith('#') ? previewAnchor : `#${previewAnchor}`)
      : '';
    if (url.includes('#')) return url;
    return `${url}${hash}`;
  }, [url, previewAnchor]);

  // Ensure cms_preview=1 is attached to iframe src (hash omitted to prevent browser from auto-scrolling parent page)
  const iframeSrc = useMemo(() => {
    const separator = url.includes('?') ? '&' : '?';
    const cleanUrl = url.replace(/#.*$/, '');
    return `${cleanUrl}${separator}cms_preview=1`;
  }, [url]);

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

  // Handle iframe ready message and section height reporting
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'cms-preview-ready') {
        setIsIframeLoaded(true);
        sendDraft();
      }
      if (e.data?.type === 'cms-preview-height') {
        const h = Number(e.data.height);
        if (!Number.isNaN(h) && h > 0) {
          setMeasuredHeights((prev) => ({
            ...prev,
            [viewMode]: h,
          }));
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [draftData, guideDraft, faqDraft, previewAnchor, viewMode]);

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    sendDraft();
  };

  const handleReload = () => {
    if (iframeRef.current && hasIntersected) {
      setIsIframeLoaded(false);
      setMeasuredHeights({});
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
        height: 'auto',
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
            maxWidth: '100%',
            overflowWrap: 'anywhere',
            wordBreak: 'break-all',
            lineHeight: 1.4,
          }}
          title={displayPath}
        >
          {displayPath}
        </div>

        {/* Right: Desktop / Mobile toggle + Refresh + Open In New Tab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

      {/* Frame Container / Stage: Defined 600px height on desktop, dark background, flex center */}
      <div
        ref={stageRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: viewMode === 'mobile' ? 'flex-start' : 'center',
          justifyContent: 'center',
          padding: viewMode === 'mobile' ? '24px 12px' : '12px',
          background: viewMode === 'mobile' ? '#070a12' : '#0b0f19',
          overflow: viewMode === 'mobile' ? 'auto' : 'hidden',
          height: viewMode === 'desktop' ? '600px' : 'auto',
          minHeight: viewMode === 'desktop' ? '600px' : (isAnchoredSection ? undefined : '660px'),
          position: 'relative',
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
              minHeight: viewMode === 'desktop' ? '600px' : (isAnchoredSection ? `${mobileLogicalHeight}px` : '660px'),
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
          // Desktop: fixed logical viewport 1440×900 for EVERY section, scaled to fit the 600px stage
          <div
            style={{
              width: `${Math.round(1440 * desktopScale)}px`,
              height: `${Math.round(900 * desktopScale)}px`,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '8px',
              border: '1px solid #1e293b',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              background: '#090d16',
              flexShrink: 0,
            }}
          >
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              title={`Preview of ${url}`}
              onLoad={handleIframeLoad}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1440px',
                height: '900px',
                border: 'none',
                background: '#09130f',
                display: 'block',
                transform: `scale(${desktopScale})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
        ) : (
          // Mobile: page shown inside a phone frame (thick rounded border, centred) at 390×mobileLogicalHeight, scaled to fit
          <div
            style={{
              width: '390px',
              height: `${mobileLogicalHeight}px`,
              borderRadius: '38px',
              border: '10px solid #1e293b',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              position: 'relative',
              background: '#090d16',
              transform: phoneScale < 1 ? `scale(${phoneScale})` : undefined,
              transformOrigin: 'top center',
              marginBottom: phoneScale < 1 ? `${(phoneScale - 1) * mobileLogicalHeight}px` : undefined,
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
                height: `${mobileLogicalHeight}px`,
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
