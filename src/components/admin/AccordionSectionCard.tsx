'use client';

import React from 'react';
import LivePreviewPanel from './LivePreviewPanel';

export interface AccordionSectionCardProps {
  id: string;
  title: string;
  badge?: string;
  badgeColor?: 'green' | 'amber' | 'blue' | 'slate';
  subtitle?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  collapsible?: boolean;
  children: React.ReactNode;
  previewUrl?: string;
  previewAnchor?: string;
  draftData?: any;
  guideDraft?: any;
  faqDraft?: any;
  actionButton?: React.ReactNode;
}

export default function AccordionSectionCard({
  id,
  title,
  badge,
  badgeColor = 'green',
  subtitle,
  isExpanded,
  onToggle,
  collapsible = false,
  children,
  previewUrl,
  previewAnchor,
  draftData,
  guideDraft,
  faqDraft,
  actionButton,
}: AccordionSectionCardProps) {
  const isCollapsible = Boolean(collapsible);
  const effectivelyExpanded = isCollapsible ? Boolean(isExpanded) : true;

  const badgeStyles = {
    green: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    amber: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    blue: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
    slate: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' },
  }[badgeColor];

  return (
    <div
      id={`section-card-${id}`}
      style={{
        background: '#111827',
        border: `1px solid ${effectivelyExpanded ? '#334155' : '#1f2937'}`,
        borderRadius: '16px',
        marginBottom: '20px',
        overflow: 'visible',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Header Bar */}
      <div
        onClick={isCollapsible ? onToggle : undefined}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: effectivelyExpanded ? '#0f172a' : '#111827',
          borderBottom: effectivelyExpanded ? '1px solid #1f2937' : 'none',
          borderRadius: effectivelyExpanded ? '15px 15px 0 0' : '15px',
          cursor: isCollapsible ? 'pointer' : 'default',
          userSelect: 'none',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', minWidth: 0, flex: '1 1 auto' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc', wordBreak: 'break-word' }}>
            {title}
          </h2>
          {badge && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: badgeStyles.bg,
                color: badgeStyles.text,
                border: `1px solid ${badgeStyles.border}`,
                whiteSpace: 'nowrap',
              }}
            >
              {badge}
            </span>
          )}
          {subtitle && (
            <span style={{ fontSize: '13px', color: '#94a3b8', wordBreak: 'break-word' }}>
              — {subtitle}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
          {actionButton && (
            <div onClick={(e) => e.stopPropagation()}>
              {actionButton}
            </div>
          )}

          {/* Only render collapse/expand toggle button and chevron when collapsible is true */}
          {isCollapsible && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: effectivelyExpanded ? '#10b981' : '#94a3b8',
                padding: '6px 12px',
                borderRadius: '8px',
                background: effectivelyExpanded ? 'rgba(16, 185, 129, 0.1)' : '#1e293b',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{effectivelyExpanded ? 'Collapse' : 'Expand'}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{
                  transform: effectivelyExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div
        style={{
          display: effectivelyExpanded ? 'block' : 'none',
          padding: '20px 16px',
        }}
      >
        {previewUrl ? (
          <div className="admin-split-layout">
            <div className="admin-editor-pane" style={{ minWidth: 0, maxWidth: '100%' }}>
              {children}
            </div>
            <div className="admin-preview-pane" style={{ minWidth: 0, position: 'sticky', top: '16px' }}>
              {effectivelyExpanded && draftData && (
                <LivePreviewPanel
                  url={previewUrl}
                  previewAnchor={previewAnchor}
                  title={`LIVE PREVIEW • ${title.toUpperCase()}`}
                  draftData={draftData}
                  guideDraft={guideDraft}
                  faqDraft={faqDraft}
                />
              )}
            </div>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>
    </div>
  );
}
