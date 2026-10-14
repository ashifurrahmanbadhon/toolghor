'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetAlpha: number;
  pulseSpeed: number;
  color: [number, number, number]; // [r, g, b]
}

export default function BackgroundAnimation() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect user's prefers-reduced-motion setting
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    // Theme color palettes: Emerald, Cyan, Mint, subtle Marigold
    const siteColors: [number, number, number][] = [
      [16, 185, 129], // Emerald
      [6, 182, 212],  // Cyan
      [20, 184, 166], // Teal / Mint
      [52, 211, 153], // Light Mint
      [245, 158, 11], // Marigold Accent
    ];

    const adminColors: [number, number, number][] = [
      [16, 185, 129], // Neon Emerald
      [6, 182, 212],  // Cyber Cyan
      [99, 102, 241], // Indigo
      [14, 165, 233], // Electric Blue
    ];

    const colors = isAdmin ? adminColors : siteColors;

    const initCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75); // Cap DPR to 1.75 for maximum GPU efficiency
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const createParticles = () => {
      const isMobile = width < 768;
      const count = isMobile ? 18 : 36; // Highly optimized particle count for zero lag
      particles = [];

      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const initialAlpha = 0.2 + Math.random() * 0.45;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -(0.2 + Math.random() * 0.4), // Gentle upward ambient drift
          radius: 1.5 + Math.random() * 2.2,
          alpha: initialAlpha,
          targetAlpha: initialAlpha,
          pulseSpeed: 0.008 + Math.random() * 0.015,
          color,
        });
      }
    };

    initCanvasSize();
    createParticles();

    // Resize listener with debounced handler
    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initCanvasSize();
        createParticles();
      }, 150);
    };
    window.addEventListener('resize', handleResize);

    // Performance Optimization: Pause completely when tab is hidden
    let isRunning = true;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        if (!isRunning) {
          isRunning = true;
          render();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Main 60/120 FPS lightweight render loop
    const maxDistance = width < 768 ? 95 : 125;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Update and draw particles
      const pLen = particles.length;
      for (let i = 0; i < pLen; i++) {
        const p = particles[i];

        // Smooth position updates
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around borders seamlessly
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Subtle luminance breathing
        p.alpha += p.pulseSpeed;
        if (p.alpha > 0.75 || p.alpha < 0.2) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        const [r, g, b] = p.color;

        // Draw soft outer glow halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.28})`;
        ctx.fill();

        // Draw crisp core particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.9})`;
        ctx.fill();
      }

      // 2. Draw subtle connective constellation lines
      ctx.lineWidth = 0.65;
      for (let i = 0; i < pLen; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < pLen; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistance * maxDistance) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDistance) * 0.16 * Math.min(p1.alpha, p2.alpha);
            if (lineAlpha > 0.01) {
              const [r, g, b] = p1.color;
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      if (isRunning) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAdmin]);

  if (isAdmin) {
    return (
      <div className="bg-ambient-canvas bg-admin-base" aria-hidden="true">
        {/* Futuristic Cyber Matrix Grid */}
        <div className="bg-grid-admin" />

        {/* Ambient High-Tech Floating Plasma Blobs */}
        <div className="bg-orb bg-admin-plasma-green" />
        <div className="bg-orb bg-admin-plasma-cyan" />
        <div className="bg-orb bg-admin-plasma-indigo" />

        {/* Cyber Horizon Scanline */}
        <div className="bg-admin-scanline" />

        {/* Dynamic Glowing Particle Network Canvas */}
        <canvas ref={canvasRef} className="bg-particle-canvas" />

        {/* Vignette Edge Shading */}
        <div className="bg-vignette-admin" />
      </div>
    );
  }

  return (
    <div className="bg-ambient-canvas bg-site-base" aria-hidden="true">
      {/* Dynamic Geometric Micro-Grid */}
      <div className="bg-site-grid" />

      {/* Brand Flowing Aurora Plasma Waves (Continuous Smooth Drift) */}
      <div className="bg-orb bg-aurora-emerald" />
      <div className="bg-orb bg-aurora-cyan" />
      <div className="bg-orb bg-aurora-mint" />
      <div className="bg-orb bg-aurora-marigold" />

      {/* Dynamic Glowing Particle Network Canvas */}
      <canvas ref={canvasRef} className="bg-particle-canvas" />

      {/* Atmospheric Horizon Depth */}
      <div className="bg-site-horizon" />
    </div>
  );
}
