'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { FaqItem } from '@/data/seoData';

interface ToolFaqProps {
  faqs?: FaqItem[];
}

export default function ToolFaq({ faqs }: ToolFaqProps) {
  const { lang } = useApp();

  if (!faqs || faqs.length === 0) return null;

  const sectionTitle = lang === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions (FAQ)';

  return (
    <section className="faq-section" aria-label={sectionTitle}>
      <h2>{sectionTitle}</h2>
      <div className="faq-list">
        {faqs.map((item, idx) => {
          const q = lang === 'bn' ? item.bn.q : item.en.q;
          const a = lang === 'bn' ? item.bn.a : item.en.a;
          return (
            <div key={idx} className="faq-item">
              <h3 className="faq-q">{q}</h3>
              <p className="faq-a">{a}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
