'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Shield,
  LayoutDashboard,
  Wrench,
  FileText,
  Sliders,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';

export default function FloatingAdminPanel() {
  const { lang } = useApp();
  const isBn = lang === 'bn';
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/admin/session', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(Boolean(data.loggedIn));
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Listen for tab sync broadcasts when logging in/out
    let ch: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        ch = new BroadcastChannel('toolghor_sync');
        ch.onmessage = () => {
          checkSession();
        };
      } catch {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'toolghor_admin_auth') {
        checkSession();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (ch) ch.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      try {
        sessionStorage.removeItem('toolghor_admin_auth');
        localStorage.removeItem('toolghor_admin_auth');
        localStorage.removeItem('toolghor_admin_remember');
      } catch {}
      setIsLoggedIn(false);
      setIsOpen(false);
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const ch = new BroadcastChannel('toolghor_sync');
          ch.postMessage('refresh');
          setTimeout(() => ch.close(), 200);
        } catch {}
      }
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        router.push('/');
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoggingOut(false);
    }
  };

  // Render nothing if visitor is logged-out
  if (!isLoggedIn) return null;

  const quickLinks = [
    {
      label: isBn ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard',
      href: '/admin?tab=overview',
      icon: <LayoutDashboard size={15} style={{ color: '#38bdf8' }} />,
    },
    {
      label: isBn ? 'টুলস ম্যানেজার (২৭টি)' : 'Tools Manager (27)',
      href: '/admin?tab=tools',
      icon: <Wrench size={15} style={{ color: '#10b981' }} />,
    },
    {
      label: isBn ? 'পলিসি ও শর্তাবলী' : 'Terms & Policies',
      href: '/admin?tab=policies',
      icon: <FileText size={15} style={{ color: '#a855f7' }} />,
    },
    {
      label: isBn ? 'কনটেন্ট এডিটর' : 'Content Editing',
      href: '/admin?tab=hero',
      icon: <Sliders size={15} style={{ color: '#f59e0b' }} />,
    },
  ];

  return (
    <>
      {/* Floating Pill Trigger Button (Bottom-Left) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isBn ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}
        title={isBn ? 'অ্যাডমিন শর্টকাট' : 'Admin Quick Access'}
        style={{
          position: 'fixed',
          bottom: '22px',
          left: '22px',
          zIndex: 990,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '9px 15px',
          borderRadius: '999px',
          background: '#090d16',
          color: '#f8fafc',
          border: '1px solid rgba(16, 185, 129, 0.45)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.45)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'inline-block',
          }}
        />
        <Shield size={14} style={{ color: '#10b981' }} />
        <span>{isBn ? 'অ্যাডমিন' : 'Admin'}</span>
      </button>

      {/* Floating Panel Popup */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            bottom: '72px',
            left: '22px',
            zIndex: 991,
            width: '270px',
            maxWidth: 'calc(100vw - 44px)',
            background: '#0b0f19',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
            padding: '14px',
            animation: 'adminFadeSlide 0.18s ease-out forwards',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '10px',
              marginBottom: '10px',
              borderBottom: '1px solid #1f2937',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Shield size={16} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#f8fafc' }}>
                ToolGhor Admin
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '3px',
                borderRadius: '6px',
                display: 'grid',
                placeItems: 'center',
              }}
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Quick Links List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
            {quickLinks.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '9px 11px',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ExternalLink size={12} style={{ color: '#475569' }} />
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#1f2937', margin: '4px 0 10px' }} />

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 11px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loggingOut) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
            }}
            onMouseLeave={(e) => {
              if (!loggingOut) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            <LogOut size={14} />
            <span>{loggingOut ? (isBn ? 'লগআউট হচ্ছে...' : 'Logging out...') : (isBn ? 'লগআউট করুন' : 'Log Out')}</span>
          </button>
        </div>
      )}
    </>
  );
}
