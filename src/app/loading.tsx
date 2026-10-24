import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Loading() {
  return (
    <>
      <Header />
      <section className="hero">
        <div className="wrap hero-wrap">
          <div className="tg-skeleton" style={{ height: 36, width: 320, margin: '0 auto 16px', maxWidth: '85%' }} />
          <div className="tg-skeleton" style={{ height: 50, width: '100%', maxWidth: 560, margin: '0 auto 20px', borderRadius: 26 }} />
          <div className="chips" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="tg-skeleton" style={{ height: 32, width: 90, borderRadius: 20 }} />
            ))}
          </div>
        </div>
      </section>
      <main className="wrap cats" id="main">
        <div className="cat in-view expanded" style={{ opacity: 0.85 }}>
          <div className="cat-head">
            <div className="cat-head-info">
              <div className="tg-skeleton" style={{ height: 24, width: 180, marginBottom: 8 }} />
              <div className="tg-skeleton" style={{ height: 14, width: 260 }} />
            </div>
          </div>
          <div className="grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card tg-skeleton" style={{ height: 104, border: '1px solid var(--line, rgba(255,255,255,0.08))' }} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
