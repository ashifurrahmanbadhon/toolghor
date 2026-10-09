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

    async function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        // check if script already exists
        const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
        if (existing) {
          if (existing.getAttribute('data-loaded') === 'true') {
            return resolve();
          }
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
          return;
        }

        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = () => {
          s.setAttribute('data-loaded', 'true');
          resolve();
        };
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });
    }

    async function initTool() {
      try {
        setLoading(true);
        setError(null);

        // Ensure root element is set up
        if (!document.body.getAttribute('data-root')) {
          document.body.setAttribute('data-root', '/');
        }
        document.body.setAttribute('data-tool', tool.slug);
        document.documentElement.lang = lang;

        // Track tool usage in analytics database
        try {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: tool.slug }),
          }).catch(() => {});
        } catch {}

        // 1. Load config, registry, icons, UI core
        await loadScript('/assets/config.js');
        await loadScript('/assets/registry.js');
        await loadScript('/assets/icons.js');
        await loadScript('/assets/ui.js');

        // 2. Load vendor libraries based on tool needs or group
        if (tool.group === 'pdf' || tool.slug.includes('pdf')) {
          await loadScript('/assets/vendor/pdf-lib.min.js').catch(() => {});
          await loadScript('/assets/vendor/jszip.min.js').catch(() => {});
          await loadScript('/assets/vendor/pdf.min.js').catch(() => {});
        } else if (tool.group === 'image') {
          await loadScript('/assets/vendor/jszip.min.js').catch(() => {});
        } else if (tool.group === 'qr') {
          await loadScript('/assets/vendor/qrcode.js').catch(() => {});
        }

        // 3. Load tool group script
        const groupScriptMap: Record<string, string> = {
          pdf: '/assets/tools/pdf.js',
          image: '/assets/tools/image.js',
          calc: '/assets/tools/calc.js',
          qr: '/assets/tools/qr.js',
          media: '/assets/tools/media.js',
          resume: '/assets/tools/resume.js'
        };

        const scriptUrl = groupScriptMap[tool.group];
        if (scriptUrl) {
          await loadScript(scriptUrl);
        }

        if (isCancelled) return;

        // Sync UI lang
        const w = window as any;
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
          // If tool function is not found, check if it's still defining or custom
          setTimeout(() => {
            if (isCancelled) return;
            if (rootRef.current && w.Tools && typeof w.Tools[tool.slug] === 'function') {
              rootRef.current.innerHTML = '';
              w.Tools[tool.slug](rootRef.current);
              setLoading(false);
            } else {
              setLoading(false);
            }
          }, 300);
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
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium">
            {lang === 'bn' ? 'টুলটি লোড হচ্ছে...' : 'Loading tool components...'}
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
