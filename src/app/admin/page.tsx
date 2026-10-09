'use client';

import dynamic from 'next/dynamic';

const AdminClient = dynamic(() => import('./AdminClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>Loading ToolGhor Admin Console...</span>
      </div>
    </div>
  ),
});

export default function AdminPage() {
  return <AdminClient />;
}
