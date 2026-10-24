import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Loading() {
  return (
    <>
      <Header />
      <main className="policy-docs-page">
        <div className="policy-docs-container">
          <div className="policy-docs-mobile-nav" style={{ padding: '12px 0' }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="tg-skeleton" style={{ height: 32, width: 90, borderRadius: 16, flexShrink: 0 }} />
              ))}
            </div>
          </div>
          <div className="policy-docs-layout">
            <aside className="policy-docs-sidebar">
              <div className="policy-docs-sidebar-inner" style={{ padding: 16 }}>
                <div className="tg-skeleton" style={{ height: 20, width: 130, marginBottom: 16, borderRadius: 6 }} />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="tg-skeleton" style={{ height: 36, width: '100%', marginBottom: 8, borderRadius: 8 }} />
                ))}
              </div>
            </aside>
            <div className="policy-docs-content">
              <div className="policy-docs-welcome-card" style={{ padding: 24, border: '1px solid var(--line, rgba(255,255,255,0.08))', borderRadius: 16 }}>
                <div className="tg-skeleton" style={{ height: 28, width: 140, marginBottom: 12, borderRadius: 6 }} />
                <div className="tg-skeleton" style={{ height: 16, width: '100%', marginBottom: 8, borderRadius: 4 }} />
                <div className="tg-skeleton" style={{ height: 16, width: '85%', borderRadius: 4 }} />
              </div>
              <div style={{ marginTop: 28 }}>
                <div className="tg-skeleton" style={{ height: 32, width: 200, marginBottom: 16, borderRadius: 8 }} />
                <div className="tg-skeleton" style={{ height: 180, width: '100%', borderRadius: 12, border: '1px solid var(--line, rgba(255,255,255,0.08))' }} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
