'use client';

import React from 'react';

interface PolicyMarkdownProps {
  content: string;
}

export default function PolicyMarkdown({ content }: PolicyMarkdownProps) {
  if (!content) return null;

  // Split into blocks by double newlines or single newlines
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (keyPrefix: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="policy-list">
          {currentList.map((item, idx) => (
            <li key={`li-${idx}`}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const renderInline = (text: string) => {
    // Replace emails with mailto links
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;
    const parts = text.split(emailRegex);

    return parts.map((part, i) => {
      if (part.match(emailRegex)) {
        return (
          <a
            key={i}
            href={`mailto:${part}`}
            className="policy-link"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(index);
      return;
    }

    // Markdown subheads (## or ###)
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      flushList(index);
      const headingText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h3 key={`h3-${index}`} className="policy-subhead">
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
      <p key={`p-${index}`} className="policy-para">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className="policy-body-content">{elements}</div>;
}
