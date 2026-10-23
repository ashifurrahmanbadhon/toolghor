'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GENERAL_FAQ, FaqItem } from '@/data/seoData';

interface FaqAccordionProps {
  faqs?: FaqItem[];
}

export default function FaqAccordion({ faqs = GENERAL_FAQ }: FaqAccordionProps) {
  const { lang } = useApp();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="faqpage-list" role="region" aria-label="FAQ Accordion">
      {faqs.map((item, idx) => {
        const isOpen = openIndex === idx;
        const q = lang === 'bn' ? item.bn.q : item.en.q;
        const a = lang === 'bn' ? item.bn.a : item.en.a;
        const btnId = `faqpage-trigger-${idx}`;
        const panelId = `faqpage-panel-${idx}`;

        return (
          <div
            key={idx}
            className={`faqpage-card ${isOpen ? 'open' : ''}`}
          >
            <button
              type="button"
              id={btnId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleItem(idx)}
              className="faqpage-trigger"
            >
              <span className="faqpage-q">{q}</span>
              <span className="faqpage-icon-wrap" aria-hidden="true">
                <svg
                  className="faqpage-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className="faqpage-content"
            >
              <div className="faqpage-content-inner">
                <div className="faqpage-answer">
                  <p>{a}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
