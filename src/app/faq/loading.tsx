import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Loading() {
  return (
    <>
      <Header />
      <main className="faqpage-main">
        <div className="faqpage-container">
          <header className="faqpage-header">
            <div className="tg-skeleton" style={{ height: 24, width: 100, margin: '0 auto 12px', borderRadius: 12 }} />
            <div className="tg-skeleton" style={{ height: 38, width: 280, margin: '0 auto 12px', borderRadius: 8 }} />
            <div className="tg-skeleton" style={{ height: 18, width: 440, maxWidth: '90%', margin: '0 auto', borderRadius: 6 }} />
          </header>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="tg-skeleton"
                style={{
                  height: 64,
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid var(--line, rgba(255,255,255,0.08))',
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
