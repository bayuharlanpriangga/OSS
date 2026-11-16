# OSS — TypeScript Modular Migration Roadmap (`ROADMAP.md`)

> **Dokumen ini adalah peta jalan migrasi bertahap Orias Statistik System (OSS) dari arsitektur skrip global JS (`public/oss-js/*`, ~19.536 baris) menuju modul TypeScript yang ter-type dan teruji di Next.js.**
>
> Berbeda dengan `ARCHITECTURE.md` (yang memandu pemecahan monolith `app.js` menjadi file-file JS), `ROADMAP.md` ini memandu langkah selanjutnya: **memindahkan setiap modul satu per satu ke TypeScript secara aman tanpa memutus UI yang sudah berjalan.**

---

## 1. Strategi Utama: Hibrida & Bertahap (*Strangler Fig*)

1. **Mulai dari Engine Komputasi (`stats-engine`), bukan UI dulu.**
   Modul statistik murni (~5.482 baris) memiliki input/output numerik yang jelas, paling rawan bug tipe/`NaN`/properti hilang, dan langsung mendapat manfaat maksimal dari TypeScript + unit test.
2. **Jangan migrasi sekaligus (*Big Bang Rewrite*).**
   Kerjakan **1 modul per sesi/tahap** sesuai urutan ketergantungan (dari fungsi dasar tanpa dependensi menuju modul lanjutan).
3. **Jembatan Kompatibilitas (`window` Bridge) selama transisi.**
   Setiap modul TS yang selesai ditulis di `lib/stats/` sementara tetap diekspos ke `window` agar `analyze-run-*.js`, `output-render-*.js`, dan `onclick="..."` yang masih JS tetap berjalan normal. Setelah modul TS aktif, file JS lamanya dihapus dari `OSS_ENGINE_SCRIPTS` (`lib/oss-scripts.ts`).
4. **Render UI HTML-string (`analyze-form-render.js`, `output-render-*.js`) ditunda ke fase akhir.**
   Bagian ini lebih tepat langsung ditulis ulang menjadi komponen React (`.tsx`) per fitur, bukan sekadar diganti ekstensi ke `.ts`.

---

## 2. Aturan Main & *Definition of Done* (DoD) Per Modul

Satu modul baru boleh ditandai **`✅ Selesai`** apabila memenuhi seluruh poin berikut:

- [ ] **Kontrak Tipe Jelas:** Input & return value memakai `interface`/`type` eksplisit di `lib/types/oss.ts` atau di modul terkait (hindari `any`).
- [ ] **Pure Logic Terpisah dari DOM:** Fungsi komputasi statistik tidak membaca DOM (`document.*`) dan menerima data/opsi sebagai parameter (bukan membaca global secara diam-diam jika memungkinkan).
- [ ] **Unit Test Lulus:** Ada test kasus normal, kasus batas (*edge cases* seperti `n < 2`, `missing`, `zero variance`), dan akurasi numerik via `npx tsx --test`.
- [ ] **Bridge & Build Bersih:** Terhubung ke aplikasi (atau menggantikan file lama di `OSS_ENGINE_SCRIPTS`), lalu `npm run build` dan `npm run lint` lulus tanpa error/warning.
- [ ] **Verifikasi Runtime:** Fitur terkait diuji berjalan normal di browser (`http://localhost:3000`) tanpa console error.

---

## 3. Peta Migrasi Per Modul

Legenda Status: `⬜ Belum` · `🟡 Proses` · `✅ Selesai` · `⏭️ Langsung ke React TSX`

### Fase 0 — Fondasi Tipe & Bridge Loader (Prasyarat)

| Kode | Target File TS | Cakupan | Status |
|---|---|---|---|
| **F0-1** | `lib/types/oss.ts` | Tipe data inti: `OssVariable`, `OssRow`, `OssDataset`, `AnalyzeState`, `OutputItem`, `StatError` | `⬜ Belum` |
| **F0-2** | `lib/stats/bridge.ts` | Helper pendaftaran fungsi TS ke `window` selama masa transisi agar kompatibel dengan `public/oss-js/*` | `⬜ Belum` |
| **F0-3** | `lib/oss-scripts.ts` | Mekanisme skip/transisi saat modul JS dipindah ke bundle TS | `⬜ Belum` |

---

### Fase 1 — Pure Math, Distribusi & Modul Ringan (Ketergantungan Rendah)

> Urutan dimulai dari file yang paling kecil dan menjadi pondasi rumus modul lain.

| Kode | Sumber JS (`public/oss-js/...`) | Baris | Target TS (`lib/stats/...`) | Ketergantungan Utama | Status |
|---|---|---|---|---|---|
| **M1-1** | `stats-engine/stats-distributions.js` | 180 | `lib/stats/distributions.ts` | Mandiri (`erf`, `normCDF`, `normInv`, `tCDF`, `tCrit`, `fCDF`, `chiCDF`, `gammaSer`, `betaInc`) | `⬜ Belum` |
| **M1-2** | `stats-engine/stats-crosstab.js` | 19 | `lib/stats/crosstab.ts` | `distributions` (`chiCDF`) | `⬜ Belum` |
| **M1-3** | `stats-engine/stats-metaanalysis.js` | 84 | `lib/stats/metaanalysis.ts` | `distributions` (`normCDF`, `normInv`, `pChiSquare`) | `⬜ Belum` |
| **M1-4** | `stats-engine/stats-roc.js` | 74 | `lib/stats/roc.ts` | `distributions` (`normCDF`, `normInv`) + formatter `SE` | `⬜ Belum` |
| **M1-5** | `stats-engine/stats-timeseries.js` | 154 | `lib/stats/timeseries.ts` | `core-basic` (`mean`, `vari`, `f4`) | `⬜ Belum` |

---

### Fase 2 — Core Parametric, Nonparametric, Imputation & Power

| Kode | Sumber JS (`public/oss-js/...`) | Baris | Target TS (`lib/stats/...`) | Ketergantungan Utama | Status |
|---|---|---|---|---|---|
| **M2-1** | `stats-engine/stats-core-basic.js` | 761 | `lib/stats/core-basic.ts` | `distributions`, helper statistik dasar (`SE`) | `⬜ Belum` |
| **M2-2** | `stats-engine/stats-nonparametric.js` | 305 | `lib/stats/nonparametric.ts` | `distributions`, `core-basic` | `⬜ Belum` |
| **M2-3** | `stats-engine/stats-imputation.js` | 121 | `lib/stats/imputation.ts` | `core-basic` | `⬜ Belum` |
| **M2-4** | `stats-engine/stats-poweranalysis.js` | 344 | `lib/stats/poweranalysis.ts` | `distributions`, non-central `t`/`F`/`chi` internal | `⬜ Belum` |

---

### Fase 3 — Advanced & Multivariate Engine

| Kode | Sumber JS (`public/oss-js/...`) | Baris | Target TS (`lib/stats/...`) | Ketergantungan Utama | Status |
|---|---|---|---|---|---|
| **M3-1** | `stats-engine/stats-core-advanced.js` | 1.433 | `lib/stats/core-advanced.ts` | Aljabar matriks (`matInv`, eigen), Multiple/Logistic/Hierarchical Reg, EFA, CFA, MANOVA | `⬜ Belum` |
| **M3-2** | `stats-engine/stats-glm-hlm.js` | 417 | `lib/stats/glm-hlm.ts` | `distributions`, `core-advanced` | `⬜ Belum` |
| **M3-3** | `stats-engine/stats-discriminant-cluster.js` | 460 | `lib/stats/discriminant-cluster.ts` | `core-advanced` (eigen, matriks) | `⬜ Belum` |
| **M3-4** | `stats-engine/stats-survival.js` | 209 | `lib/stats/survival.ts` | `distributions`, `core-advanced` | `⬜ Belum` |
| **M3-5** | `stats-engine/stats-bayesian.js` | 230 | `lib/stats/bayesian.ts` | `distributions`, `core-basic` | `⬜ Belum` |
| **M3-6** | `stats-engine/stats-mediation-sem.js` | 691 | `lib/stats/mediation-sem.ts` | `core-basic`, `core-advanced` | `⬜ Belum` |

---

### Fase 4 — Data Layer, State & Session Management

> Setelah seluruh perhitungan bertipe aman, pindahkan pengelola data dan state global.

| Kode | Sumber JS (`public/oss-js/...`) | Baris | Target TS (`lib/...`) | Status |
|---|---|---|---|---|
| **M4-1** | `core/html-helpers.js` + `core/app-helpers.js` | 103 | `lib/core/helpers.ts` | `⬜ Belum` |
| **M4-2** | `data/weight-cases.js` + `data/dataset-manager.js` | 203 | `lib/data/dataset-store.ts` | `⬜ Belum` |
| **M4-3** | `data/data-transform.js` + `data/imputation.js` + `data/missing-data.js` | 409 | `lib/data/transforms.ts` | `⬜ Belum` |
| **M4-4** | `session/session-save-restore.js` + `session/oss-filesystem.js` | 296 | `lib/session/storage.ts` | `⬜ Belum` |

---

### Fase 5 — Export, APA Formatter & SVG Chart Engine

| Kode | Sumber JS (`public/oss-js/...`) | Baris | Target TS | Status |
|---|---|---|---|---|
| **M5-1** | `output/apa-copy.js` | 561 | `lib/export/apa-formatter.ts` | `⬜ Belum` |
| **M5-2** | `export/export-excel.js` + `export/export-word.js` + `export/export-dialog.js` | 1.123 | `lib/export/*.ts` | `⬜ Belum` |
| **M5-3** | `charts/svg-charts-core.js` + 10 chart spesifik | 1.185 | `components/charts/*.tsx` atau `lib/charts/*.ts` | `⬜ Belum` |

---

### Fase 6 — Modernisasi UI ke Komponen React (`.tsx`)

> Tidak disarankan mengubah file HTML-string ini menjadi `.ts` mentah; lebih bersih dipecah langsung menjadi komponen React TSX per modul fitur.

| Kode | Sumber JS (`public/oss-js/...`) | Baris | Target React TSX | Status |
|---|---|---|---|---|
| **M6-1** | `data/data-view.js` + `data/spreadsheet-mode.js` + `data/variable-view.js` | 1.294 | `components/data/*` | `⏭️ Langsung ke React TSX` |
| **M6-2** | `analyze/analyze-tab-shell.js` + `analyze-subtab-ui.js` + `analyze-form-helpers.js` + `analyze-form-render.js` | 4.550 | `components/analyze/*` (pecah per kategori analisis) | `⏭️ Langsung ke React TSX` |
| **M6-3** | `analyze/analyze-run-basic.js` + `analyze-run-advanced.js` | 634 | Hook/action pemanggil `lib/stats/*` | `⬜ Belum` |
| **M6-4** | `output/output-view-shell.js` + `output-power-render.js` + `output-render-basic.js` + `output-render-advanced.js` | 2.156 | `components/output/*` | `⏭️ Langsung ke React TSX` |
| **M6-5** | `ui-misc/*` (`ai-view.js`, `syntax-view.js`, `pivot-view.js`, `cmd-palette.js`, `custom-select.js`, dll.) + `core/router.js` | 1.328 | `components/*` | `⏭️ Langsung ke React TSX` |

---

## 4. Langkah Eksekusi Pertama (Siap Dimulai Sekarang)

Untuk memulai migrasi secara aman tanpa mengganggu aplikasi yang berjalan:

1. **Kerjakan Fase 0 (`F0-1` & `F0-2`):** Buat `lib/types/oss.ts` dan `lib/stats/bridge.ts`.
2. **Kerjakan Modul Pertama (`M1-1`):** Migrasi `public/oss-js/stats-engine/stats-distributions.js` (180 baris) ke `lib/stats/distributions.ts` beserta unit test di `lib/stats/__tests__/distributions.test.ts`.
3. **Verifikasi:** Pastikan `npx tsx --test`, `npm run build`, `npm run lint`, dan browser check lulus sebelum lanjut ke `M1-2` (`stats-crosstab.js`) dan `M1-3` (`stats-metaanalysis.js`).

---

## 5. Changelog Migrasi

| Tanggal | Kode | Modul | Ringkasan |
|---|---|---|---|
| — | — | Inisialisasi | `ROADMAP.md` dibuat untuk memandu migrasi bertahap JS → TypeScript per modul. |
