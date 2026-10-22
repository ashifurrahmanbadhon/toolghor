'use client';

import React from 'react';

import { getHeadingSlug, KNOWN_SUBHEADS_SET } from '@/data/policiesDefaults';

interface PolicyMarkdownProps {
  content: string;
}

export default function PolicyMarkdown({ content }: PolicyMarkdownProps) {
  if (!content) return null;

  // Split into lines
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let headingCount = 0;

  const flushList = (keyPrefix: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="policy-doc-list">
          {currentList.map((item, idx) => (
            <li key={`li-${idx}`}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const renderInline = (text: string) => {
    // Support bold markdown (**text**) and emails
    const boldRegex = /(\*\*[^*]+\*\*)/g;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;

    const boldParts = text.split(boldRegex);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return (
          <strong key={`b-${bIdx}`} style={{ fontWeight: 700, color: 'var(--ink)' }}>
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      const emailParts = bPart.split(emailRegex);
      return emailParts.map((part, eIdx) => {
        if (part.match(emailRegex)) {
          return (
            <a key={`e-${bIdx}-${eIdx}`} href={`mailto:${part}`} className="policy-doc-link">
              {part}
            </a>
          );
        }
        return part;
      });
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(index);
      return;
    }

    const lower = trimmed.toLowerCase();

    // Markdown subheads (## or ### or recognized section subhead)
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ') || KNOWN_SUBHEADS_SET.has(lower)) {
      flushList(index);
      const headingText = trimmed.replace(/^#+\s*/, '');
      headingCount++;
      const headingId = getHeadingSlug(headingText, headingCount);
      elements.push(
        <h3 key={`h3-${index}`} id={headingId} className="policy-doc-subhead">
          {headingText}
        </h3>
      );
      return;
    }

    // Bullet items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const itemText = trimmed.replace(/^[-*•]\s*/, '');
      currentList.push(itemText);
      return;
    }

    // Regular line or paragraph
    flushList(index);
    elements.push(
      <p key={`p-${index}`} className="policy-doc-para">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className="policy-doc-body">{elements}</div>;
}
