import type { ConsentState } from './storage';
import { connectCmp } from './cmp';
interface Config {
  adsEnabled: boolean;
  clientId: string;
  analyticsToken: string;
  cmpRequired: boolean;
  cmpScriptUrl: string;
}
declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}
const config: Config = JSON.parse(
  document.getElementById('site-config')?.textContent || '{}',
);
let consent: ConsentState | null = null;
let adScript: Promise<void> | undefined;
let analyticsLoaded = false;
let cmpConnected = false;
let cmpAllowed = !config.cmpRequired;
function loadAds() {
  if (!adScript)
    adScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.clientId)}`;
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        adScript = undefined;
        reject(new Error('AdSense no disponible'));
      };
      document.head.append(script);
    });
  return adScript;
}
const elements = Array.from(
  document.querySelectorAll<HTMLElement>('[data-ad-slot]'),
);
const near = new Set<HTMLElement>();
const started = new Set<HTMLElement>();
let running = false;
let reconcileAgain = false;
const visible = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
};
async function reconcileAds() {
  if (!consent?.ads || !config.adsEnabled || !cmpAllowed) return;
  if (running) {
    reconcileAgain = true;
    return;
  }
  const waiting = [...near].filter((el) => !started.has(el));
  if (!waiting.length) return;
  running = true;
  try {
    await loadAds();
    if (!consent?.ads || !cmpAllowed) return;
    for (const element of waiting) {
      // A maximum of three rendered slots intersect a viewport. Hidden surfaces retain their reserved space.
      const occupied = [...started].filter(
        (el) => visible(el) && el.dataset['adSuppressed'] !== 'true',
      ).length;
      if (occupied >= 3 && visible(element)) continue;
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.dataset['adClient'] = config.clientId;
      ins.dataset['adSlot'] = element.dataset['adSlot'];
      ins.dataset['adFormat'] =
        element.dataset['adFormat'] === 'in-article' ? 'fluid' : 'auto';
      if (element.dataset['adFormat'] === 'in-article')
        ins.dataset['adLayout'] = 'in-article';
      ins.dataset['fullWidthResponsive'] = 'true';
      element.querySelector('.ad-surface')?.append(ins);
      started.add(element);
      (window.adsbygoogle ||= []).push({});
    }
  } catch {
    /* Mantener el hueco reservado si el proveedor está bloqueado. */
  } finally {
    running = false;
    if (reconcileAgain) {
      reconcileAgain = false;
      void reconcileAds();
    }
  }
}
function enforceLimit() {
  let count = 0;
  for (const element of started) {
    const suppress = visible(element) && ++count > 3;
    element.dataset['adSuppressed'] = String(suppress);
  }
  void reconcileAds();
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) near.add(entry.target as HTMLElement);
        else near.delete(entry.target as HTMLElement);
      }
      void reconcileAds();
    },
    { rootMargin: '180px' },
  );
  elements.forEach((el) => observer.observe(el));
} else elements.forEach((el) => near.add(el));
window.addEventListener('scroll', enforceLimit, { passive: true });
window.addEventListener('resize', enforceLimit);
export function updateServices(next: ConsentState) {
  consent = next;
  if (
    next.ads &&
    config.adsEnabled &&
    config.cmpRequired &&
    !cmpConnected &&
    config.cmpScriptUrl
  ) {
    cmpConnected = true;
    connectCmp(config.cmpScriptUrl, (allowed) => {
      if (cmpAllowed && !allowed && started.size) {
        window.location.reload();
        return;
      }
      cmpAllowed = allowed;
      void reconcileAds();
    });
  }
  void reconcileAds();
  if (next.analytics && config.analyticsToken && !analyticsLoaded) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.dataset['cfBeacon'] = JSON.stringify({
      token: config.analyticsToken,
      spa: false,
    });
    document.head.append(script);
    analyticsLoaded = true;
  }
}
