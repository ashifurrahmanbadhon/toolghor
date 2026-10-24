import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Loading() {
  return (
    <>
      <Header />
      <main className="guide-page-main">
        <div className="guide-article-wrap">
          <div style={{ margin: '16px 0 20px' }}>
            <div className="tg-skeleton" style={{ height: 26, width: 110, borderRadius: 6 }} />
          </div>
          <article className="guide-article">
            <header className="guide-header">
              <div className="tg-skeleton" style={{ height: 38, width: '70%', marginBottom: 14, borderRadius: 8 }} />
              <div className="tg-skeleton" style={{ height: 18, width: 220, borderRadius: 6 }} />
            </header>
            <div style={{ margin: '24px 0' }}>
              <div className="tg-skeleton" style={{ height: 16, width: '100%', marginBottom: 10, borderRadius: 4 }} />
              <div className="tg-skeleton" style={{ height: 16, width: '92%', marginBottom: 10, borderRadius: 4 }} />
              <div className="tg-skeleton" style={{ height: 16, width: '85%', borderRadius: 4 }} />
            </div>
            <div
              className="tg-skeleton"
              style={{
                height: 240,
                width: '100%',
                borderRadius: 14,
                marginBottom: 28,
                border: '1px solid var(--line, rgba(255,255,255,0.08))',
              }}
            />
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
