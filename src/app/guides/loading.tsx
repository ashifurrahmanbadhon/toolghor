import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Loading() {
  return (
    <>
      <Header />
      <main className="guide-index-main">
        <div className="guide-index-wrap">
          <header className="guide-index-header">
            <div className="tg-skeleton" style={{ height: 24, width: 120, margin: '0 auto 12px', borderRadius: 12 }} />
            <div className="tg-skeleton" style={{ height: 38, width: 220, margin: '0 auto 12px', borderRadius: 8 }} />
            <div className="tg-skeleton" style={{ height: 18, width: 380, maxWidth: '90%', margin: '0 auto', borderRadius: 6 }} />
          </header>
          <div className="guide-cards-grid">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="guide-card tg-skeleton"
                style={{
                  height: 220,
                  border: '1px solid var(--line, rgba(255,255,255,0.08))',
                  borderRadius: 14,
                }}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
