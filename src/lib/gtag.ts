export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Safe, typed wrapper around window.gtag.
 * Silently no-ops if GA is not configured or blocked by browser/adblocker.
 */
export function gtag(...args: any[]): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag(...args);
    } catch {
      // Fire-and-forget: never throw or block execution
    }
  }
}

/**
 * Tracks a pageview event for SPA route transitions.
 */
export function pageview(pagePath: string): void {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', 'page_view', {
    page_path: pagePath,
  });
}

/**
 * Tracks custom analytics events.
 */
export function trackEvent(action: string, params: Record<string, any> = {}): void {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', action, params);
}

