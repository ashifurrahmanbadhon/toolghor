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
const listeners: Set<PreviewListener> = new Set();
let latestPreviewData: CmsPreviewMessage | null = null;

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
      const el = document.getElementById(targetId) || document.getElementById('about-modal');
      if (el) {
        // Scroll strictly inside iframe window; never call scrollIntoView which scrolls parent admin page
        const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 40);
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 200);
    return;
  }

  const el = document.getElementById(targetId);
  if (el) {
    hasScrolledToAnchor = true;
    setTimeout(() => {
      // Scroll strictly inside iframe window; never call scrollIntoView which scrolls parent admin page
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 10);
      window.scrollTo({ top, behavior: 'smooth' });
    }, 150);
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

    // Auto-scroll to section anchor once after initial draft is applied
    if (event.data.previewAnchor) {
      activeTargetAnchor = event.data.previewAnchor;
      scrollToTargetAnchor(event.data.previewAnchor);
    } else if (typeof window !== 'undefined' && window.location.hash) {
      activeTargetAnchor = window.location.hash;
      scrollToTargetAnchor(window.location.hash);
    }
  });

  // Also attempt scroll if loaded directly with hash in preview iframe
  if (typeof window !== 'undefined' && window.location.hash) {
    activeTargetAnchor = window.location.hash;
    setTimeout(() => {
      scrollToTargetAnchor(window.location.hash);
    }, 200);
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
