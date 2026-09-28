'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/auth/useUser';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT_ID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

// Section 7.1: dashboard + session-builder screens only — never the question/exam screens, never
// imported from the root layout (the AdSense script only ever loads on a page that renders this).
// Renders nothing once we know the user is premium; otherwise always reserves a fixed-size
// container (even before the ad script has loaded, and even if it never does) so an ad
// appearing/failing never shifts the layout, and an ad-blocked or failed-to-load network leaves
// an empty box rather than a broken one.
export function AdSlot() {
  const { profile, loading } = useUser();
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID) return; // no ad credentials configured (e.g. local/dev) — stay reserved-but-empty

    const existing = document.querySelector<HTMLScriptElement>('script[data-pulseq-adsense]');
    if (existing) {
      setStatus('ready');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.pulseqAdsense = 'true';
    script.onload = () => setStatus('ready');
    script.onerror = () => setStatus('failed');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      setStatus('failed');
    }
  }, [status]);

  // Premium removes ads entirely (Section 7.1) — but only once we're sure, so a still-loading
  // profile doesn't briefly show, then hide, the reserved space for the common (free) case.
  if (!loading && profile?.isPremium) return null;

  const showAd = ADSENSE_CLIENT_ID && ADSENSE_SLOT_ID && status === 'ready';

  return (
    <div
      data-testid="ad-slot"
      className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md border border-subtle bg-surface"
    >
      {showAd && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={ADSENSE_SLOT_ID}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
