/**
 * Shared helper for CMS Live Simulation / Preview Mode (ToolGhor v44).
 * Fully inert when cms_preview is not present in URL search params.
 */

export interface CmsPreviewMessage {
  type: 'cms-preview';
  publicData?: any;
  previewAnchor?: string;
  guideDraft?: {
    slug: string;
    guide: any;
  } | null;
  faqDraft?: {
    scope: string;
    items: any[];
  } | null;
}

type PreviewListener = (msg: CmsPreviewMessage) => void;

let isInitialized = false;
let hasScrolledToAnchor = false;
let activeTargetAnchor = '';
let targetResizeObserver: ResizeObserver | null = null;
let measureDebounceTimer: any = null;
let lastReportedHeight = 0;
const listeners: Set<PreviewListener> = new Set();
let latestPreviewData: CmsPreviewMessage | null = null;

function getTargetElement(targetAnchor?: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const hash = targetAnchor || activeTargetAnchor || (typeof window !== 'undefined' ? window.location.hash : '');
  if (!hash) return null;
  const targetId = hash.replace(/^#/, '');
  if (!targetId) return null;

  if (targetId === 'creator-section' || targetId === 'about-modal') {
    const box = document.querySelector('.about-modal-box') as HTMLElement;
    if (box) return box;
    return document.getElementById('about-modal') || document.getElementById('creator-section');
  }

  return document.getElementById(targetId);
}

function measureAndReportHeight(targetAnchor?: string): void {
  // Strictly run inside preview iframe only
  if (typeof window === 'undefined' || window === window.top || !isPreviewMode()) return;
  const anchor = targetAnchor || activeTargetAnchor || window.location.hash || '';
  const el = getTargetElement(anchor);
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const height = Math.ceil(
    Math.max(el.offsetHeight || 0, el.scrollHeight || 0, rect.height || 0)
  );

  if (height > 0 && height !== lastReportedHeight) {
    lastReportedHeight = height;
    try {
      window.parent.postMessage(
        {
          type: 'cms-preview-height',
          height,
          anchor,
        },
        window.location.origin
      );
    } catch {}
  }
}

function scheduleMeasure(targetAnchor?: string, delay: number = 100): void {
  if (measureDebounceTimer) clearTimeout(measureDebounceTimer);
  measureDebounceTimer = setTimeout(() => {
    measureAndReportHeight(targetAnchor);
  }, delay);
}

function setupTargetObserver(targetAnchor?: string): void {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return;
  const el = getTargetElement(targetAnchor);
  if (!el) return;

  if (targetResizeObserver) {
    targetResizeObserver.disconnect();
  }

  targetResizeObserver = new ResizeObserver(() => {
    scheduleMeasure(targetAnchor, 80);
  });
  targetResizeObserver.observe(el);
}

function scrollToTargetAnchor(targetAnchor?: string): void {
  if (hasScrolledToAnchor) return;
  // Guard: Never execute scrolling on top-level window (strictly iframe only)
  if (typeof window !== 'undefined' && window === window.top) return;
  const hash = targetAnchor || (typeof window !== 'undefined' ? window.location.hash : '');
  if (!hash) return;
  const targetId = hash.replace(/^#/, '');
  if (!targetId) return;

  if (targetId === 'creator-section' || targetId === 'about-modal') {
    hasScrolledToAnchor = true;
    setTimeout(() => {
      const w = window as any;
      if (w.UI && typeof w.UI.openAboutModal === 'function') {
        if (!document.getElementById('about-modal')) {
          w.UI.openAboutModal();
        }
      }
      setupTargetObserver(hash);
      measureAndReportHeight(hash);
      const el = document.getElementById(targetId) || document.getElementById('about-modal');
      if (el) {
        // Scroll strictly inside iframe window; never call scrollIntoView which scrolls parent admin page
        const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 40);
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 200);
    setTimeout(() => {
      measureAndReportHeight(hash);
    }, 350);
    return;
  }

  const el = document.getElementById(targetId);
  if (el) {
    hasScrolledToAnchor = true;
    setTimeout(() => {
      // Scroll strictly inside iframe window; never call scrollIntoView which scrolls parent admin page
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 10);
      window.scrollTo({ top, behavior: 'smooth' });
      setupTargetObserver(hash);
      measureAndReportHeight(hash);
    }, 150);
    setTimeout(() => {
      measureAndReportHeight(hash);
    }, 350);
  }
}

/**
 * Returns true if the current page is being rendered inside the CMS Live Preview iframe.
 */
export function isPreviewMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('cms_preview') === '1' || params.get('cms_preview') === 'true';
  } catch {
    return false;
  }
}

/**
 * Initializes preview mode protections and message listeners.
 * Completely inert if not in preview mode.
 */
export function initPreviewMode(): void {
  if (typeof window === 'undefined' || isInitialized || !isPreviewMode()) return;
  isInitialized = true;

  // 1. Listen for same-origin cms-preview messages from AdminClient
  window.addEventListener('message', (event) => {
    // Security: Only accept messages from same origin
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== 'cms-preview') return;

    latestPreviewData = event.data;
    listeners.forEach((fn) => {
      try {
        fn(event.data);
      } catch (err) {
        console.error('[cms-preview error]:', err);
      }
    });

    // Auto-scroll to section anchor once after initial draft is applied and setup height observation
    if (event.data.previewAnchor) {
      activeTargetAnchor = event.data.previewAnchor;
      scrollToTargetAnchor(event.data.previewAnchor);
      setupTargetObserver(event.data.previewAnchor);
      scheduleMeasure(event.data.previewAnchor, 100);
      scheduleMeasure(event.data.previewAnchor, 300);
    } else if (typeof window !== 'undefined' && window.location.hash) {
      activeTargetAnchor = window.location.hash;
      scrollToTargetAnchor(window.location.hash);
      setupTargetObserver(window.location.hash);
      scheduleMeasure(window.location.hash, 100);
      scheduleMeasure(window.location.hash, 300);
    } else if (activeTargetAnchor) {
      setupTargetObserver(activeTargetAnchor);
      scheduleMeasure(activeTargetAnchor, 100);
      scheduleMeasure(activeTargetAnchor, 300);
    }
  });

  // Also attempt scroll and measurement if loaded directly with hash in preview iframe
  if (typeof window !== 'undefined' && window.location.hash) {
    activeTargetAnchor = window.location.hash;
    setTimeout(() => {
      scrollToTargetAnchor(window.location.hash);
      setupTargetObserver(window.location.hash);
      scheduleMeasure(window.location.hash, 100);
    }, 200);
  }

  // Listen for iframe window resize (e.g. desktop <-> mobile toggles) to re-measure at new layout width
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      scheduleMeasure(activeTargetAnchor, 80);
    });
  }

  // 2. Suppress /api/analytics/track and block mutating writes
  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : input?.url || '';

      // Suppress analytics tracking in preview visits
      if (urlStr.includes('/api/analytics/track')) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, previewSuppressed: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      // Block any mutation writes (POST, PUT, DELETE, PATCH) to /api/ in preview
      const method = (init?.method || 'GET').toUpperCase();
      if (urlStr.includes('/api/') && method !== 'GET' && method !== 'HEAD') {
        console.warn(`[cms-preview] Blocked mutation request to ${urlStr} in preview mode.`);
        return Promise.resolve(
          new Response(JSON.stringify({ success: false, previewBlocked: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      return originalFetch.apply(this, [input, init]);
    };
  }

  // 3. Block form submissions in preview mode
  window.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );

  // 4. Intercept link clicks: stay in preview mode (?cms_preview=1), allow in-page anchors
  window.addEventListener(
    'click',
    (e) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;

      // Allow hash/in-page anchors
      if (href.startsWith('#')) return;
      // Allow javascript: void
      if (href.startsWith('javascript:')) return;

      // For internal links, stay in preview mode
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin) {
          e.preventDefault();
          url.searchParams.set('cms_preview', '1');
          window.location.href = url.pathname + url.search + url.hash;
        } else {
          // Block external navigation in preview iframe
          e.preventDefault();
        }
      } catch {}
    },
    true
  );

  // 5. Notify parent admin window that preview iframe is ready for initial draft sync
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'cms-preview-ready' }, window.location.origin);
    }
  } catch {}
}

/**
 * Subscribes to live CMS preview updates.
 * If preview data was already received, invokes listener immediately.
 */
export function subscribePreview(listener: PreviewListener): () => void {
  listeners.add(listener);
  if (latestPreviewData) {
    try {
      listener(latestPreviewData);
    } catch {}
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns latest cached preview message, if any.
 */
export function getLatestPreviewData(): CmsPreviewMessage | null {
  return latestPreviewData;
}
