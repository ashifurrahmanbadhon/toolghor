'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ToolItem } from '@/data/registry';
import { useApp } from '@/context/AppContext';
import { Loader2, AlertCircle } from 'lucide-react';

interface ToolRunnerProps {
  tool: ToolItem;
}

export default function ToolRunner({ tool }: ToolRunnerProps) {
  const { lang } = useApp();
  const rootRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    // Fast script loader that resolves immediately if script is already present or loaded
    async function loadScript(src: string): Promise<void> {
      return new Promise((resolve) => {
        const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
        if (existing) {
          if (
            existing.getAttribute('data-loaded') === 'true' ||
            (existing as any).readyState === 'complete' ||
            (existing as any).readyState === 'loaded'
          ) {
            return resolve();
          }
          // Attach listener with fast timeout fallback so it never hangs
          let done = false;
          const finish = () => {
            if (!done) {
              done = true;
              existing.setAttribute('data-loaded', 'true');
              resolve();
            }
          };
          existing.addEventListener('load', finish, { once: true });
          existing.addEventListener('error', finish, { once: true });
          setTimeout(finish, 80);
          return;
        }

        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => {
          s.setAttribute('data-loaded', 'true');
          resolve();
        };
        s.onerror = () => {
          s.setAttribute('data-loaded', 'true');
          resolve();
        };
        document.body.appendChild(s);
      });
    }

    async function initTool() {
      try {
        const w = window as any;

        // Ensure root element setup
        if (!document.body.getAttribute('data-root')) {
          document.body.setAttribute('data-root', '/');
        }
        document.body.setAttribute('data-tool', tool.slug);
        document.documentElement.lang = lang;

        // Analytics (non-blocking in background)
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: tool.slug }),
        }).catch(() => {});

        // Instant mounting if tool handler is ALREADY defined
        if (w.Tools && typeof w.Tools[tool.slug] === 'function' && rootRef.current) {
          if (w.UI) {
            w.UI.lang = lang;
            w.UI.digits = lang === 'bn' ? 'bn' : 'en';
          }
          rootRef.current.innerHTML = '';
          w.Tools[tool.slug](rootRef.current);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // 1. Parallel load core scripts if not yet ready
        const corePromises: Promise<void>[] = [];
        if (!w.SITE_CONFIG) corePromises.push(loadScript('/assets/config.js'));
        if (!w.CATEGORIES) corePromises.push(loadScript('/assets/registry.js'));
        if (!w.ICONS) corePromises.push(loadScript('/assets/icons.js'));
        if (!w.UI) corePromises.push(loadScript('/assets/ui.js'));
        if (corePromises.length > 0) {
          await Promise.all(corePromises);
        }

        // 2. Parallel load vendor scripts based on tool group
        const vendorPromises: Promise<void>[] = [];
        if (tool.group === 'pdf' || tool.slug.includes('pdf')) {
          if (!w.PDFLib) vendorPromises.push(loadScript('/assets/vendor/pdf-lib.min.js'));
          if (!w.JSZip) vendorPromises.push(loadScript('/assets/vendor/jszip.min.js'));
          if (!w.pdfjsLib) vendorPromises.push(loadScript('/assets/vendor/pdf.min.js'));
        } else if (tool.group === 'image') {
          if (!w.JSZip) vendorPromises.push(loadScript('/assets/vendor/jszip.min.js'));
        } else if (tool.group === 'qr') {
          if (!w.QRCode) vendorPromises.push(loadScript('/assets/vendor/qrcode.js'));
        }
        if (vendorPromises.length > 0) {
          await Promise.all(vendorPromises);
        }

        // 3. Load tool group script if handler not ready
        const groupScriptMap: Record<string, string> = {
          pdf: '/assets/tools/pdf.js',
          image: '/assets/tools/image.js',
          calc: '/assets/tools/calc.js',
          qr: '/assets/tools/qr.js',
          media: '/assets/tools/media.js',
          resume: '/assets/tools/resume.js',
        };

        const scriptUrl = groupScriptMap[tool.group];
        if (scriptUrl && (!w.Tools || typeof w.Tools[tool.slug] !== 'function')) {
          await loadScript(scriptUrl);
        }

        if (isCancelled) return;

        // Sync UI lang
        if (w.UI) {
          w.UI.lang = lang;
          w.UI.digits = lang === 'bn' ? 'bn' : 'en';
        }

        // Render tool into root
        if (rootRef.current && w.Tools && typeof w.Tools[tool.slug] === 'function') {
          rootRef.current.innerHTML = '';
          w.Tools[tool.slug](rootRef.current);
          setLoading(false);
        } else {
          // Fast check retry
          setTimeout(() => {
            if (isCancelled) return;
            if (rootRef.current && w.Tools && typeof w.Tools[tool.slug] === 'function') {
              rootRef.current.innerHTML = '';
              w.Tools[tool.slug](rootRef.current);
              setLoading(false);
            } else {
              setLoading(false);
            }
          }, 80);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error mounting tool:', err);
          setError(err?.message || 'Failed to initialize tool engine.');
          setLoading(false);
        }
      }
    }

    initTool();

    return () => {
      isCancelled = true;
    };
  }, [tool.slug, tool.group, lang]);

  return (
    <div className="w-full">
      {/* Loading indicator */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-semibold tracking-wide">
            {lang === 'bn' ? 'টুলটি প্রস্তুত হচ্ছে…' : 'Preparing tool workspace…'}
          </p>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Tool Container */}
      <div
        ref={rootRef}
        id="tool-root"
        className={`tool-container ${loading ? 'hidden' : 'block'}`}
      />
    </div>
  );
}
