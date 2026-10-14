'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Ultra-high-performance ambient background animation component.
 * Uses 100% GPU-composited CSS transforms without JS render loops.
 * Zero lag, zero reflow, zero battery drain.
 */
export default function BackgroundAnimation() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className="bg-ambient-canvas bg-admin-base" aria-hidden="true">
        {/* High-tech Cyber Grid Lines */}
        <div className="bg-grid-pattern-admin" />

        {/* Ambient Hardware-Accelerated Floating Orbs */}
        <div className="bg-orb bg-orb-admin-green" />
        <div className="bg-orb bg-orb-admin-cyan" />
        <div className="bg-orb bg-orb-admin-indigo" />

        {/* Soft Vignette Depth */}
        <div className="bg-vignette-admin" />
      </div>
    );
  }

  return (
    <div className="bg-ambient-canvas bg-site-base" aria-hidden="true">
      {/* Subtle Developer Micro-Dot Matrix */}
      <div className="bg-grid-pattern" />

      {/* Floating Emerald Aurora Mesh Orbs */}
      <div className="bg-orb bg-orb-emerald" />
      <div className="bg-orb bg-orb-teal" />
      <div className="bg-orb bg-orb-cyan" />

      {/* Horizon Soft Glow */}
      <div className="bg-horizon-glow" />
    </div>
  );
}
