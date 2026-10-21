'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ToolItem } from '@/data/registry';
import { useApp } from '@/context/AppContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { ASSET_VERSION } from '@/data/config';

interface ToolRunnerProps {
  tool: ToolItem;
  apiKeys?: any;
}

export default function ToolRunner({ tool, apiKeys }: ToolRunnerProps) {
  const { lang } = useApp();
  const rootRef = useRef<HTMLDivElement>(null);
  const lastTrackedSlug = useRef<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (w.Tools && typeof w.Tools[tool.slug] === 'function') {
        return false;
      }
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    // Fast script loader with proper error tracking
    async function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
        if (existing) {
          if (
            existing.getAttribute('data-loaded') === 'true' ||
            (existing as any).readyState === 'complete' ||
            (existing as any).readyState === 'loaded'
          ) {
            return resolve();
          }
          if (existing.getAttribute('data-failed') === 'true') {
            return reject(new Error(lang === 'bn' ? `স্ক্রিপ্ট লোড হতে ব্যর্থ হয়েছে: ${src}` : `Failed to load script: ${src}`));
          }
          let done = false;
          const finishOk = () => {
            if (!done) {
              done = true;
              existing.setAttribute('data-loaded', 'true');
              resolve();
            }
          };
          const finishErr = () => {
            if (!done) {
              done = true;
              existing.setAttribute('data-failed', 'true');
              reject(new Error(lang === 'bn' ? `স্ক্রিপ্ট লোড হতে ব্যর্থ হয়েছে: ${src}` : `Failed to load script: ${src}`));
            }
          };
          existing.addEventListener('load', finishOk, { once: true });
          existing.addEventListener('error', finishErr, { once: true });
          setTimeout(finishOk, 80);
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
          s.setAttribute('data-failed', 'true');
          reject(new Error(lang === 'bn' ? `স্ক্রিপ্ট লোড হতে ব্যর্থ হয়েছে: ${src}` : `Failed to load script: ${src}`));
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

        // Analytics: only track once per unique tool slug (not on language toggles)
        if (lastTrackedSlug.current !== tool.slug) {
          lastTrackedSlug.current = tool.slug;
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: tool.slug }),
          }).catch(() => {});
        }

        // Instant mounting if tool handler is ALREADY defined
        if (w.Tools && typeof w.Tools[tool.slug] === 'function' && rootRef.current) {
          if (w.UI) {
            w.UI.lang = lang;
            w.UI.digits = lang === 'bn' ? 'bn' : 'en';
            if (typeof w.UI.ensureInAppBanner === 'function') {
              w.UI.ensureInAppBanner();
            }
          }
          rootRef.current.innerHTML = '';
          w.Tools[tool.slug](rootRef.current);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Tool group script map with asset versioning to avoid stale cache
        const groupScriptMap: Record<string, string> = {
          pdf: `/assets/tools/pdf.js?v=${ASSET_VERSION}`,
          image: `/assets/tools/image.js?v=${ASSET_VERSION}`,
          calc: `/assets/tools/calc.js?v=${ASSET_VERSION}`,
          qr: `/assets/tools/qr.js?v=${ASSET_VERSION}`,
          media: `/assets/tools/media.js?v=${ASSET_VERSION}`,
          resume: `/assets/tools/resume.js?v=${ASSET_VERSION}`,
        };

        const applyApiConfig = (cfg: any) => {
          if (!cfg || !cfg.is_active) return;
          w.SITE_CONFIG = w.SITE_CONFIG || {};
          w.SITE_CONFIG.apis = w.SITE_CONFIG.apis || {};
          w.SITE_CONFIG.apis.ilovepdfActive = Boolean(cfg.ilovepdf_active);
          if (cfg.ilovepdf_public_key) {
            w.SITE_CONFIG.apis.ilovepdfPublicKey = cfg.ilovepdf_public_key.trim();
          }
        };

        applyApiConfig(apiKeys);

        // All required scripts (core, vendor, tool group) loaded in PARALLEL
        const scriptPromises: Promise<void>[] = [];
        if (!w.SITE_CONFIG) scriptPromises.push(loadScript(`/assets/config.js?v=${ASSET_VERSION}`));
        if (!w.REGISTRY) scriptPromises.push(loadScript(`/assets/registry.js?v=${ASSET_VERSION}`));
        if (!w.ICONS) scriptPromises.push(loadScript(`/assets/icons.js?v=${ASSET_VERSION}`));
        if (!w.UI) scriptPromises.push(loadScript(`/assets/ui.js?v=${ASSET_VERSION}`));

        if (tool.group === 'pdf' || tool.slug.includes('pdf')) {
          if (!w.PDFLib) scriptPromises.push(loadScript('/assets/vendor/pdf-lib.min.js'));
          if (!w.JSZip) scriptPromises.push(loadScript('/assets/vendor/jszip.min.js'));
          if (!w.pdfjsLib) scriptPromises.push(loadScript('/assets/vendor/pdf.min.js'));
        } else if (tool.group === 'image') {
          if (!w.JSZip) scriptPromises.push(loadScript('/assets/vendor/jszip.min.js'));
        } else if (tool.group === 'qr') {
          if (!w.QRCode) scriptPromises.push(loadScript('/assets/vendor/qrcode.js'));
          if (tool.slug === 'qr-decoder' && !w.jsQR) scriptPromises.push(loadScript('/assets/vendor/jsQR.js'));
        }

        const scriptUrl = groupScriptMap[tool.group];
        if (scriptUrl && (!w.Tools || typeof w.Tools[tool.slug] !== 'function')) {
          scriptPromises.push(loadScript(scriptUrl));
        }

        if (scriptPromises.length > 0) {
          await Promise.all(scriptPromises);
        }

        // Apply API keys again so DB values take precedence over /assets/config.js defaults
        applyApiConfig(apiKeys);

        // Fallback: If iLovePDF public key is still placeholder or missing, fetch from /api/public/data
        if (!w.SITE_CONFIG?.apis?.ilovepdfPublicKey || w.SITE_CONFIG.apis.ilovepdfPublicKey.startsWith('project_public_d3a21718')) {
          try {
            const pRes = await fetch('/api/public/data?t=' + Date.now(), { cache: 'no-store' });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData?.apiKeys) {
                applyApiConfig(pData.apiKeys);
              }
            }
          } catch {}
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
          if (w.UI && typeof w.UI.ensureInAppBanner === 'function') {
            w.UI.ensureInAppBanner();
          }
          setLoading(false);
        } else {
          // Fast check retry
          setTimeout(() => {
            if (isCancelled) return;
            if (rootRef.current && w.Tools && typeof w.Tools[tool.slug] === 'function') {
              rootRef.current.innerHTML = '';
              w.Tools[tool.slug](rootRef.current);
              if (w.UI && typeof w.UI.ensureInAppBanner === 'function') {
                w.UI.ensureInAppBanner();
              }
              setLoading(false);
            } else {
              setLoading(false);
              setError(
                lang === 'bn'
                  ? 'টুলটি লোড করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
                  : 'Failed to initialize tool engine. Please check your internet connection and try again.'
              );
            }
          }, 80);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error mounting tool:', err);
          setError(
            lang === 'bn'
              ? 'টুলটি লোড করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
              : (err?.message || 'Failed to initialize tool engine.')
          );
          setLoading(false);
        }
      }
    }

    initTool();

    return () => {
      isCancelled = true;
      if (typeof window !== 'undefined') {
        const w = window as any;
        if (w.UI && typeof w.UI.removeInAppBanner === 'function') {
          w.UI.removeInAppBanner();
        }
      }
    };
  }, [tool.slug, tool.group, lang, retryCount]);

  const isDownloader = tool.slug === 'video-downloader';
  const isMultiUpload = ['merge-pdf', 'jpg-to-pdf', 'compress-image', 'resize-image', 'merge-image'].includes(tool.slug);
  const isFormTool = tool.group === 'calc' || tool.slug === 'qr-generator' || tool.slug === 'currency-converter' || tool.group === 'resume';

  return (
    <div className="w-full">
      {/* Loading Skeleton */}
      {loading && (
        isDownloader ? (
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow-xs animate-pulse">
            <div className="flex gap-2 p-1 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50 w-fit">
              <div className="w-44 h-10 rounded-xl bg-white dark:bg-zinc-700 shadow-xs" />
              <div className="w-36 h-10 rounded-xl bg-transparent" />
            </div>
            <div className="w-full h-14 rounded-2xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center px-4 gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-800/60 shrink-0" />
              <div className="flex-1 h-5 rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
              <div className="w-24 sm:w-28 h-10 rounded-xl bg-emerald-600/30 shrink-0" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <div className="w-20 h-6 rounded-full bg-zinc-200/50 dark:bg-zinc-800/40" />
              <div className="w-20 h-6 rounded-full bg-zinc-200/50 dark:bg-zinc-800/40" />
              <div className="w-20 h-6 rounded-full bg-zinc-200/50 dark:bg-zinc-800/40" />
              <div className="w-20 h-6 rounded-full bg-zinc-200/50 dark:bg-zinc-800/40" />
            </div>
          </div>
        ) : (
          <div className="w-full border-2 border-dashed border-blue-200/70 dark:border-blue-900/40 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-blue-50/20 dark:bg-blue-950/10 animate-pulse">
            {isFormTool ? (
              <div className="w-full max-w-md flex flex-col gap-3 items-center">
                <div className="w-3/4 h-5 rounded-lg bg-blue-100/60 dark:bg-blue-900/30" />
                <div className="w-full h-11 rounded-xl bg-blue-100/50 dark:bg-blue-900/20" />
                <div className="w-full h-11 rounded-xl bg-blue-100/50 dark:bg-blue-900/20" />
                <div className="w-32 h-10 rounded-xl bg-blue-200/60 dark:bg-blue-800/40 mt-1" />
              </div>
            ) : isMultiUpload ? (
              <div className="flex gap-4">
                <div className="w-36 h-28 rounded-2xl bg-blue-100/60 dark:bg-blue-900/30 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-200/60 dark:bg-blue-800/40" />
                  <div className="w-20 h-4 rounded bg-blue-200/60 dark:bg-blue-800/40" />
                </div>
                <div className="w-36 h-28 rounded-2xl bg-indigo-100/60 dark:bg-indigo-900/30 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-200/60 dark:bg-indigo-800/40" />
                  <div className="w-20 h-4 rounded bg-indigo-200/60 dark:bg-indigo-800/40" />
                </div>
              </div>
            ) : (
              <div className="w-40 h-32 rounded-2xl bg-blue-100/60 dark:bg-blue-900/30 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-200/60 dark:bg-blue-800/40" />
                <div className="w-24 h-4 rounded bg-blue-200/60 dark:bg-blue-800/40" />
              </div>
            )}
            <div className="w-48 h-3.5 rounded bg-zinc-200/60 dark:bg-zinc-800/40 mt-1" />
          </div>
        )
      )}

      {/* Error indicator */}
      {error && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors"
          >
            {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
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
