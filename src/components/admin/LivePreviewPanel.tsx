'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface LivePreviewPanelProps {
  url: string;
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
  title = 'LIVE SIMULATION',
  draftData,
  guideDraft,
  faqDraft,
}: LivePreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Ensure cms_preview=1 is attached
  const iframeSrc = useMemo(() => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cms_preview=1`;
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
    } catch (e) {
      // Cross-origin guards
    }
  };

  // Debounced send on draft data changes (~300ms)
  useEffect(() => {
    if (!isIframeLoaded) return;
    const timer = setTimeout(sendDraft, 300);
    return () => clearTimeout(timer);
  }, [draftData, guideDraft, faqDraft, isIframeLoaded]);

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
  }, [draftData, guideDraft, faqDraft]);

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    sendDraft();
  };

  const handleReload = () => {
    if (iframeRef.current) {
      setIsIframeLoaded(false);
      iframeRef.current.src = iframeSrc;
    }
  };

  return (
    <div
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
      {/* Simulation Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', color: '#f8fafc' }}>
            {title}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px' }}>
            ({url})
          </span>
        </div>

        {/* Desktop / Mobile Toggle & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                gap: '4px',
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
                gap: '4px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              MOBILE
            </button>
          </div>

          <button
            type="button"
            onClick={handleReload}
            title="Reload preview frame"
            style={{
              padding: '5px 8px',
              background: '#1e293b',
              border: 'none',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sub-bar with Hint */}
      <div
        style={{
          padding: '6px 16px',
          background: 'rgba(56, 189, 248, 0.05)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#38bdf8',
        }}
      >
        <span>Preview only — Save to publish.</span>
        <span style={{ color: '#64748b' }}>
          {viewMode === 'desktop' ? 'Full Viewport' : '390 × 844'}
        </span>
      </div>

      {/* Frame Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: viewMode === 'mobile' ? '20px 10px' : '0',
          background: viewMode === 'mobile' ? '#070a12' : '#0b0f19',
          overflow: 'hidden',
          minHeight: '660px',
        }}
      >
        <div
          style={{
            width: viewMode === 'mobile' ? '390px' : '100%',
            height: viewMode === 'mobile' ? '844px' : '100%',
            minHeight: viewMode === 'mobile' ? '844px' : '660px',
            maxHeight: viewMode === 'mobile' ? '844px' : 'none',
            borderRadius: viewMode === 'mobile' ? '32px' : '0',
            border: viewMode === 'mobile' ? '6px solid #1e293b' : 'none',
            boxShadow: viewMode === 'mobile' ? '0 20px 40px rgba(0,0,0,0.6)' : 'none',
            overflow: 'hidden',
            position: 'relative',
            background: '#090d16',
            transition: 'width 0.2s ease, height 0.2s ease',
          }}
        >
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={`Preview of ${url}`}
            onLoad={handleIframeLoad}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#09130f',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}
