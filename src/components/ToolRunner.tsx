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
          if (tool.slug === 'qr-decoder' && !w.jsQR) vendorPromises.push(loadScript('/assets/vendor/jsQR.js'));
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

  // Contextual loading message based on tool group
  const getLoadingMessage = () => {
    switch (tool.group) {
      case 'pdf':
        return lang === 'bn' ? 'পিডিএফ ইঞ্জিন লোড হচ্ছে…' : 'Loading PDF engine…';
      case 'image':
        return lang === 'bn' ? 'ইমেজ প্রসেসিং ইঞ্জিন প্রস্তুত হচ্ছে…' : 'Loading image engine…';
      case 'calc':
        return lang === 'bn' ? 'ক্যালকুলেটর ইঞ্জিন লোড হচ্ছে…' : 'Loading calculator…';
      case 'qr':
        return lang === 'bn' ? 'কিউআর কোড ইঞ্জিন প্রস্তুত হচ্ছে…' : 'Loading QR code engine…';
      case 'media':
        return lang === 'bn' ? 'মিডিয়া প্রসেসর প্রস্তুত হচ্ছে…' : 'Loading media engine…';
      case 'resume':
        return lang === 'bn' ? 'রেজুমি স্টুডিও প্রস্তুত হচ্ছে…' : 'Loading Resume Studio…';
      default:
        return lang === 'bn' ? 'টুলটি প্রস্তুত হচ্ছে…' : 'Preparing tool workspace…';
    }
  };

  const getLoadingSubtitle = () => {
    return lang === 'bn'
      ? 'ফাইলগুলো সম্পূর্ণ আপনার ব্রাউজারে সুরক্ষিতভাবে প্রসেস হবে'
      : 'Files and data process 100% locally in your browser';
  };

  return (
    <div className="w-full">
      {/* Friendly Contextual Loading State with Indeterminate Progress & Skeleton */}
      {loading && (
        <div className="tool-loading-box py-10 px-4">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center">
            {/* Spinning Indicator with Emerald Pulse */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 animate-ping absolute" />
              <Loader2 className="w-9 h-9 animate-spin text-emerald-500 relative z-10" />
            </div>

            {/* Stage Title */}
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              {getLoadingMessage()}
            </h3>

            {/* Subtitle / Trust reminder */}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              {getLoadingSubtitle()}
            </p>

            {/* Indeterminate Progress Bar */}
            <div className="w-full max-w-xs h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-8">
              <div className="h-full bg-emerald-500 rounded-full animate-indeterminate" />
            </div>

            {/* Skeleton Workspace Placeholder */}
            <div className="w-full space-y-3 opacity-60 pointer-events-none">
              <div className="h-28 w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/30 flex items-center justify-center">
                <div className="h-4 w-32 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              <div className="flex gap-3 justify-center">
                <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-700/60 rounded-lg animate-pulse" />
                <div className="h-9 w-28 bg-emerald-600/30 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm my-4">
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
