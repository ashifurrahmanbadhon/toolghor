import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Loading() {
  return (
    <>
      <Header />
      <div className="wrap tool-page">
        <div style={{ margin: '20px 0 16px' }}>
          <div className="tg-skeleton" style={{ height: 28, width: 120, borderRadius: 6 }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <div className="tg-skeleton" style={{ height: 36, width: 260, marginBottom: 10, borderRadius: 8 }} />
          <div className="tg-skeleton" style={{ height: 18, width: 420, maxWidth: '100%', borderRadius: 6 }} />
        </div>
        <div
          className="tg-skeleton"
          style={{
            height: 380,
            width: '100%',
            borderRadius: 16,
            border: '1px solid var(--line, rgba(255,255,255,0.08))',
            marginBottom: 32,
          }}
        />
        <div style={{ marginTop: 32 }}>
          <div className="tg-skeleton" style={{ height: 28, width: 220, marginBottom: 16, borderRadius: 8 }} />
          <div className="tg-skeleton" style={{ height: 60, width: '100%', borderRadius: 10, marginBottom: 10 }} />
          <div className="tg-skeleton" style={{ height: 60, width: '100%', borderRadius: 10 }} />
        </div>
      </div>
      <Footer />
    </>
  );
}
