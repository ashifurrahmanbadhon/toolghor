'use client';

import React from 'react';

interface PolicyMarkdownProps {
  content: string;
}

const KNOWN_SUBHEADS = new Set([
  'The Service',
  'সেবাটি',
  'Acceptable Use',
  'গ্রহণযোগ্য ব্যবহার',
  'Changes to the Service',
  'সেবার পরিবর্তন',
  'Your Responsibility',
  'আপনার দায়িত্ব',
  'General',
  'সাধারণ',
  'Your Files Stay on Your Device',
  'আপনার ফাইল আপনার ডিভাইসেই থাকে',
  'Tools That Use External Processing',
  'যেসব টুল বাইরের সেবা ব্যবহার করে',
  'Information We Collect',
  'আমরা যা সংগ্রহ করি',
  'Local Storage',
  'লোকাল স্টোরেজ',
  'How We Protect Information',
  'তথ্য সুরক্ষা',
  'No Sale of Personal Information',
  'ব্যক্তিগত তথ্য বিক্রি নয়',
  'Your Choices',
  'আপনার পছন্দ',
  'What We Store',
  'আমরা যা সংরক্ষণ করি',
  'What We Do Not Do',
  'যা আমরা করি না',
  'Managing Cookies and Storage',
  'কুকি ও স্টোরেজ ব্যবস্থাপনা',
  'Our Content',
  'আমাদের কনটেন্ট',
  'Your Content',
  'আপনার কনটেন্ট',
  'Third-Party Rights',
  'তৃতীয় পক্ষের অধিকার',
  'Reporting Infringement',
  'লঙ্ঘনের অভিযোগ',
]);

export default function PolicyMarkdown({ content }: PolicyMarkdownProps) {
  if (!content) return null;

  // Split into lines
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

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

    // Markdown subheads (## or ### or recognized section subhead)
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ') || KNOWN_SUBHEADS.has(trimmed)) {
      flushList(index);
      const headingText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h3 key={`h3-${index}`} className="policy-doc-subhead">
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
