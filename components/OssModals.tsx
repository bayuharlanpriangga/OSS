'use client';

import { Search, X } from 'lucide-react';
import { callOss } from '@/lib/oss-scripts';

export default function OssModals() {
  return (
    <>
      <div id="oss-pwa-banner">
        <div className="pwa-icon">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            width={36}
            height={36}
            style={{ borderRadius: '4px' }}
            alt="OSS"
          />
        </div>
        <div className="pwa-text">
          <div className="pwa-title">Pasang OSS sebagai Aplikasi</div>
          <div className="pwa-sub">
            Akses luring, simpan sesi ke berkas, dan buka dari layar utama.
          </div>
        </div>
        <button className="pwa-btn" type="button" onClick={() => callOss('installPWA')}>
          Pasang
        </button>
        <button
          className="pwa-dismiss"
          type="button"
          onClick={() => callOss('dismissPWABanner')}
          title="Tutup"
          aria-label="Tutup banner pemasangan"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div id="toast" role="status" aria-live="polite" />

      <div id="oss-dialog-overlay" role="dialog" aria-modal="true">
        <div id="oss-dialog-box">
          <div id="oss-dialog-icon" />
          <div id="oss-dialog-title" />
          <div id="oss-dialog-msg" />
          <div id="oss-dialog-input-wrap">
            <input
              id="oss-dialog-input"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div id="oss-dialog-btns">
            <button className="dlg-btn-cancel" id="oss-dialog-cancel" type="button">
              Batal
            </button>
            <button className="dlg-btn-ok" id="oss-dialog-ok" type="button">
              OK
            </button>
          </div>
        </div>
      </div>

      <div
        id="csel-modal"
        onClick={(e) => {
          if (e.target === e.currentTarget) callOss('closeCsel');
        }}
        role="dialog"
        aria-modal="true"
      >
        <div id="csel-box">
          <div id="csel-hdr">
            <span id="csel-title">Pilih Opsi</span>
            <button
              id="csel-close"
              type="button"
              onClick={() => callOss('closeCsel')}
              aria-label="Tutup pilihan"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          <div id="csel-srch" style={{ display: 'none' }}>
            <input
              id="csel-inp"
              type="text"
              placeholder="Cari opsi…"
              autoComplete="off"
              onInput={(e) => callOss('filterCsel', (e.target as HTMLInputElement).value)}
            />
          </div>
          <div id="csel-list" />
        </div>
      </div>

      <div
        id="cmd-ov"
        onClick={(e) => {
          if (e.target === e.currentTarget) callOss('closeCmd');
        }}
        role="dialog"
        aria-modal="true"
      >
        <div id="cmd-box">
          <div id="cmd-search-row">
            <span id="cmd-search-icon" aria-hidden="true">
              <Search size={16} strokeWidth={2} />
            </span>
            <input
              id="cmd-inp"
              className="inp"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                minHeight: '38px',
                padding: 0,
                width: 'auto',
              }}
              placeholder="Cari analisis atau perintah…"
              onInput={(e) => callOss('renderCmdResults', (e.target as HTMLInputElement).value)}
              onKeyDown={(e) => callOss('cmdKeyNav', e.nativeEvent)}
              aria-label="Cari analisis atau perintah"
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => callOss('closeCmd')}
              aria-label="Tutup pencarian perintah"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          <div
            id="cmd-list"
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              padding: '6px',
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>
      </div>
    </>
  );
}
