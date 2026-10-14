'use client';

import React, { useEffect, useRef } from 'react';

export default function SmoothCursor() {
  const coreRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  const TRAIL_COUNT = 6;

  useEffect(() => {
    // 1. Strictly disable on mobile/touch devices or users preferring reduced motion
    if (typeof window === 'undefined') return;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDbDisabled = (window as any).UI_SETTINGS?.cursor_animation_active === false;
    if (!hasFinePointer || prefersReducedMotion || isDbDisabled) return;

    const core = coreRef.current;
    const ring = ringRef.current;
    const ripple = rippleRef.current;
    if (!core || !ring) return;

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;

    // Trail particle positions
    const trailPositions = Array.from({ length: TRAIL_COUNT }, () => ({
      x: -100,
      y: -100,
    }));

    // Staggered physics lerp factors for the fluid comet tail
    const lerpSpeeds = [0.42, 0.32, 0.24, 0.18, 0.13, 0.09];

    let isHovering = false;
    let isVisible = false;
    let rafId: number | null = null;
    let isLoopRunning = false;

    // Fast interactive element selector query
    const INTERACTIVE_SELECTOR =
      'a, button, input, textarea, select, [role="button"], .tool, .cat-head, .snapyt-table-btn, .snapyt-submit-btn, .snapyt-paste-btn, .chip, .crumb a, .brand';

    // 2. High-performance RAF lerp loop (Hardware-accelerated comet trail)
    const updateCursor = () => {
      // 1. Update orbital ring
      const dxRing = targetX - ringX;
      const dyRing = targetY - ringY;
      ringX += dxRing * 0.24;
      ringY += dyRing * 0.24;

      // 2. Direct GPU transform on core & ring (0 layout, 0 reflow)
      core.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      // 3. Update trailing comet particles
      let totalDist = Math.abs(dxRing) + Math.abs(dyRing);
      let prevX = targetX;
      let prevY = targetY;

      for (let i = 0; i < TRAIL_COUNT; i++) {
        const p = trailPositions[i];
        const speed = lerpSpeeds[i];
        p.x += (prevX - p.x) * speed;
        p.y += (prevY - p.y) * speed;

        const el = trailRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        }

        totalDist += Math.abs(prevX - p.x) + Math.abs(prevY - p.y);
        prevX = p.x;
        prevY = p.y;
      }

      // Auto-sleep check: if mouse stopped and all particles converged, pause RAF loop
      if (totalDist > 0.12) {
        rafId = requestAnimationFrame(updateCursor);
      } else {
        isLoopRunning = false;
        rafId = null;
      }
    };

    const wakeLoop = () => {
      if (!isLoopRunning) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(updateCursor);
      }
    };

    // 3. Pointermove (passive for instantaneous 120/240Hz responsiveness)
    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        core.style.opacity = '1';
        ring.style.opacity = '1';
        trailRefs.current.forEach((el) => {
          if (el) el.style.opacity = '1';
        });
      }

      wakeLoop();
    };

    // 4. Fast hover detection via event delegation
    const onPointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(INTERACTIVE_SELECTOR);
      if (interactive && !isHovering) {
        isHovering = true;
        ring.classList.add('comet-ring--hover');
        core.classList.add('comet-core--hover');
      } else if (!interactive && isHovering) {
        isHovering = false;
        ring.classList.remove('comet-ring--hover');
        core.classList.remove('comet-core--hover');
      }
    };

    // 5. Click feedback (Shockwave ripple & spring contraction)
    const onPointerDown = (e: PointerEvent) => {
      ring.classList.add('comet-ring--click');
      core.classList.add('comet-core--click');

      if (ripple) {
        ripple.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(0)`;
        ripple.classList.remove('comet-ripple--active');
        void ripple.offsetWidth;
        ripple.classList.add('comet-ripple--active');
      }
    };

    const onPointerUp = () => {
      ring.classList.remove('comet-ring--click');
      core.classList.remove('comet-core--click');
    };

    // 6. Fade out when pointer leaves browser window
    const onMouseLeave = () => {
      isVisible = false;
      core.style.opacity = '0';
      ring.style.opacity = '0';
      trailRefs.current.forEach((el) => {
        if (el) el.style.opacity = '0';
      });
    };

    const onMouseEnter = () => {
      isVisible = true;
      core.style.opacity = '1';
      ring.style.opacity = '1';
      trailRefs.current.forEach((el) => {
        if (el) el.style.opacity = '1';
      });
    };

    // Attach passive listeners
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('mouseover', onPointerOver, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });
    document.addEventListener('mouseenter', onMouseEnter, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mouseover', onPointerOver);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  return (
    <div className="comet-cursor-wrap" aria-hidden="true">
      {/* 1. Trailing Neon Comet Stardust Particles */}
      {Array.from({ length: TRAIL_COUNT }).map((_, idx) => (
        <div
          key={idx}
          ref={(el) => {
            trailRefs.current[idx] = el;
          }}
          className={`comet-particle comet-p-${idx + 1}`}
        />
      ))}

      {/* 2. Fluid Trailing Orbital Aura Ring */}
      <div ref={ringRef} className="comet-ring" />

      {/* 3. Center Precision Electric Core Dot */}
      <div ref={coreRef} className="comet-core" />

      {/* 4. Instant Click Shockwave Ripple */}
      <div ref={rippleRef} className="comet-ripple" />
    </div>
  );
}
