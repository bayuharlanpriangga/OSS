'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  engineReady: boolean;
}

export default function LoadingScreen({ engineReady }: LoadingScreenProps) {
  const [percent, setPercent] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const isAutostart =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1';

    const DURATION = 1400;
    let start: number | null = null;
    let rafId = 0;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let removeTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = (ts: number) => {
      if (cancelled) return;
      if (isAutostart) {
        if (engineReady) {
          setPercent(100);
          setHidden(true);
          setRemoved(true);
        } else {
          rafId = requestAnimationFrame(tick);
        }
        return;
      }
      if (start === null) start = ts;
      const elapsed = ts - start;
      const raw = (elapsed / DURATION) * 100;
      const capped = engineReady
        ? Math.min(100, Math.max(1, Math.floor(raw)))
        : Math.min(92, Math.max(1, Math.floor(raw)));
      setPercent((prev) => (capped !== prev ? capped : prev));

      if (elapsed < DURATION || !engineReady) {
        rafId = requestAnimationFrame(tick);
      } else {
        setPercent(100);
        hideTimer = setTimeout(() => {
          if (cancelled) return;
          setHidden(true);
          removeTimer = setTimeout(() => {
            if (!cancelled) setRemoved(true);
          }, 320);
        }, 120);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (hideTimer) clearTimeout(hideTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, [engineReady]);

  if (removed) return null;

  return (
    <div id="loading-screen" className={hidden ? 'hidden' : undefined} aria-hidden={hidden}>
      <div className="load-facet-mark" aria-hidden="true">
        <div className="orias-prism-mark orias-prism-mark-lg">
          <div className="orias-prism-left" />
          <div className="orias-prism-right" />
          <div className="orias-prism-core" />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="load-title">OSS</div>
        <div className="load-sub">Orias Statistik System</div>
      </div>

      <div id="load-percent" className="load-status">
        {engineReady ? 'Menyiapkan ruang kerja' : 'Memuat modul analisis'} · {percent}%
      </div>

      <div className="load-bar-wrap" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div id="load-bar" className="load-bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
