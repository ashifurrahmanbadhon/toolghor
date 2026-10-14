'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * ToolGhor Premium Ambient Motion Background
 * 100% Hardware GPU Accelerated (Translate3D + Scale + Opacity)
 * Zero JavaScript thread overhead, zero reflows, buttery-smooth 60/120 FPS.
 */
export default function BackgroundAnimation() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className="bg-ambient-canvas bg-admin-base" aria-hidden="true">
        {/* Futuristic Cyber Matrix Grid */}
        <div className="bg-grid-admin" />

        {/* Ambient High-Tech Floating Plasma Nodes */}
        <div className="bg-orb bg-admin-plasma-green" />
        <div className="bg-orb bg-admin-plasma-cyan" />
        <div className="bg-orb bg-admin-plasma-indigo" />

        {/* Cyber Horizon Scanline */}
        <div className="bg-admin-scanline" />

        {/* Floating Cyber Sparks */}
        <div className="cyber-spark spark-1" />
        <div className="cyber-spark spark-2" />
        <div className="cyber-spark spark-3" />
        <div className="cyber-spark spark-4" />
        <div className="cyber-spark spark-5" />

        {/* Vignette Edge Shading */}
        <div className="bg-vignette-admin" />
      </div>
    );
  }

  return (
    <div className="bg-ambient-canvas bg-site-base" aria-hidden="true">
      {/* Dynamic Geometric Micro-Grid */}
      <div className="bg-site-grid" />

      {/* Brand Flowing Aurora Plasma Waves */}
      <div className="bg-orb bg-aurora-emerald" />
      <div className="bg-orb bg-aurora-cyan" />
      <div className="bg-orb bg-aurora-mint" />
      <div className="bg-orb bg-aurora-marigold" />

      {/* Radiant Workshop Floating Sparks (Constellation of Tools) */}
      <div className="tool-spark spark-1" />
      <div className="tool-spark spark-2" />
      <div className="tool-spark spark-3" />
      <div className="tool-spark spark-4" />
      <div className="tool-spark spark-5" />
      <div className="tool-spark spark-6" />

      {/* Atmospheric Horizon Depth */}
      <div className="bg-site-horizon" />
    </div>
  );
}
