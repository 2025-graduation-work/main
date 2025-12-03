// Lightweight Google Maps loader used across the app.
// Ensures the Maps JS is injected only once and returns a promise
// that resolves when `window.google.maps` is available.

export type LoadOptions = {
  libraries?: string[];
  language?: string;
  region?: string;
};

const GLOBAL_KEY = '__gmaps_loader_promise';

function makeUrl(apiKey: string, opts?: LoadOptions) {
  const params = new URLSearchParams();
  params.set('key', apiKey);
  params.set('v', 'weekly');
  if (opts?.language) params.set('language', opts.language);
  if (opts?.region) params.set('region', opts.region);
  if (opts?.libraries && opts.libraries.length) {
    params.set('libraries', opts.libraries.join(','));
  }
  // loading=async helps suppress console warnings about non-async loads
  params.set('loading', 'async');
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}

export function loadGoogleMaps(opts?: LoadOptions): Promise<typeof window.google> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - attach promise to window for cross-module singleton
  if ((globalThis as any)[GLOBAL_KEY]) return (globalThis as any)[GLOBAL_KEY];

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) {
    const p = Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set'));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (globalThis as any)[GLOBAL_KEY] = p;
    return p;
  }

  const url = makeUrl(apiKey, { libraries: opts?.libraries ?? ['places'], language: opts?.language ?? 'ja', region: opts?.region });

  const promise = new Promise<typeof window.google>((resolve, reject) => {
    // If already available, resolve immediately
    if ((globalThis as any).google && (globalThis as any).google.maps) {
      resolve((globalThis as any).google);
      return;
    }

    // create script
    const existing = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => {
        if ((globalThis as any).google && (globalThis as any).google.maps) resolve((globalThis as any).google);
        else reject(new Error('Google Maps loaded but `window.google.maps` not found'));
      });
      existing.addEventListener('error', (e) => reject(new Error('Failed to load Google Maps script')));
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    script.id = 'gmaps-loader';
    script.onload = () => {
      if ((globalThis as any).google && (globalThis as any).google.maps) {
        resolve((globalThis as any).google);
      } else {
        reject(new Error('Google Maps loaded but `window.google.maps` not found'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (globalThis as any)[GLOBAL_KEY] = promise;
  return promise;
}

export function isGoogleMapsLoaded(): boolean {
  return Boolean((globalThis as any).google && (globalThis as any).google.maps);
}
