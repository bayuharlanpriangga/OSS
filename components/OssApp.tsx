'use client';

import { useEffect, useState } from 'react';
import { OSS_ENGINE_SCRIPTS, callOss } from '@/lib/oss-scripts';
import LoadingScreen from './LoadingScreen';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import OssModals from './OssModals';

declare global {
  interface Window {
    __ossBootPromise?: Promise<void>;
    __ossBooted?: boolean;
    __ossToggleTheme?: () => void;
    currentTab?: string;
    renderTab?: (tab: string) => void;
  }
}

function loadScriptSequential(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-oss-src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.ossSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load OSS module: ${src}`));
    document.body.appendChild(script);
  });
}

async function bootOssEngine(): Promise<void> {
  for (const src of OSS_ENGINE_SCRIPTS) {
    await loadScriptSequential(src);
  }
  window.__ossBooted = true;
}

export default function OssApp() {
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    let active = true;

    window.__ossToggleTheme = () => {
      const root = document.documentElement;
      const cur = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('oss_theme', next);
      } catch {
        // ignore storage restrictions
      }
      window.dispatchEvent(new CustomEvent('oss-theme-change', { detail: next }));
      if (typeof window.renderTab === 'function' && window.currentTab) {
        window.renderTab(window.currentTab);
      }
    };

    if (!window.__ossBootPromise) {
      window.__ossBootPromise = bootOssEngine();
    }

    window.__ossBootPromise
      .then(() => {
        if (active) setEngineReady(true);
      })
      .catch((err) => {
        console.error('OSS boot error:', err);
        if (active) setEngineReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <LoadingScreen engineReady={engineReady} />

      <canvas id="wc" data-testid="watercolor-canvas" aria-hidden="true" />

      <div className="orias-facet-corner" aria-hidden="true">
        <div className="orias-facet-tri-a" />
        <div className="orias-facet-tri-b" />
        <div className="orias-facet-tri-c" />
      </div>

      <div id="pa" className="page on" data-oss-ready={engineReady ? '1' : '0'}>
        <TopBar />

        <div id="mob-ov" onClick={() => callOss('closeSide')} />

        <Sidebar />

        <main id="main">
          <div id="app-content" />
        </main>
      </div>

      <input
        type="file"
        id="csv-input"
        accept=".csv,.txt"
        style={{ display: 'none' }}
        onChange={(e) => callOss('handleCSV', e.nativeEvent)}
      />
      <input
        type="file"
        id="oss-import-input"
        accept=".oss,application/json"
        style={{ display: 'none' }}
        onChange={(e) => callOss('handleOSSImport', e.nativeEvent)}
      />

      <OssModals />
    </>
  );
}
