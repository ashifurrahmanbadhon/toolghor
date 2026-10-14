'use client';

import React, { useEffect, useRef } from 'react';

export default function SmoothCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Strictly disable on mobile/touch devices or users preferring reduced motion
    if (typeof window === 'undefined') return;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDbDisabled = (window as any).UI_SETTINGS?.cursor_animation_active === false;
    if (!hasFinePointer || prefersReducedMotion || isDbDisabled) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const ripple = rippleRef.current;
    if (!dot || !ring) return;

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovering = false;
    let isClicking = false;
    let isVisible = false;
    let rafId: number | null = null;
    let isLoopRunning = false;

    // Fast interactive element selector query
    const INTERACTIVE_SELECTOR =
      'a, button, input, textarea, select, [role="button"], .tool, .cat-head, .snapyt-table-btn, .snapyt-submit-btn, .snapyt-paste-btn, .chip, .crumb a';

    // 2. High-performance RAF lerp loop (Spring physics, auto-sleeps when idle)
    const updateCursor = () => {
      const dx = targetX - ringX;
      const dy = targetY - ringY;
      const dist = Math.abs(dx) + Math.abs(dy);

      // Lerp ring towards target
      ringX += dx * 0.22;
      ringY += dy * 0.22;

      // Transform via GPU composite layer only (0 layout, 0 reflow)
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      // Auto-sleep check: if mouse stopped moving and ring is in position, pause RAF
      if (dist > 0.08) {
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

    // 3. Pointermove (passive for instantaneous responsiveness)
    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }

      wakeLoop();
    };

    // 4. Fast hover detection via event delegation (no per-element listeners)
    const onPointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(INTERACTIVE_SELECTOR);
      if (interactive && !isHovering) {
        isHovering = true;
        ring.classList.add('cursor-ring--hover');
        dot.classList.add('cursor-dot--hover');
      } else if (!interactive && isHovering) {
        isHovering = false;
        ring.classList.remove('cursor-ring--hover');
        dot.classList.remove('cursor-dot--hover');
      }
    };

    // 5. Click feedback (crisp spring contract + ultra-fast ripple wave)
    const onPointerDown = (e: PointerEvent) => {
      isClicking = true;
      ring.classList.add('cursor-ring--click');
      dot.classList.add('cursor-dot--click');

      if (ripple) {
        ripple.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(0)`;
        ripple.classList.remove('cursor-ripple--active');
        // Force reflow for retriggering ripple animation cleanly
        void ripple.offsetWidth;
        ripple.classList.add('cursor-ripple--active');
      }
    };

    const onPointerUp = () => {
      isClicking = false;
      ring.classList.remove('cursor-ring--click');
      dot.classList.remove('cursor-dot--click');
    };

    // 6. Fade out when pointer leaves browser window
    const onMouseLeave = () => {
      isVisible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isVisible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    };

    // Attach passive listeners for maximum frame rate
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
    <div className="cursor-canvas-wrap" aria-hidden="true">
      {/* Center Precision Dot */}
      <div ref={dotRef} className="cursor-dot" />

      {/* Fluid Trailing Aura Ring */}
      <div ref={ringRef} className="cursor-ring" />

      {/* Instant Click Ripple Wave */}
      <div ref={rippleRef} className="cursor-ripple" />
    </div>
  );
}
