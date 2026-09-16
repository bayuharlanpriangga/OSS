# OSS — Orias Statistik System — Architecture Map & Split Roadmap

> **File ini adalah "peta jalan" pemisahan kode OSS dari monolith → modular.**
> Dibuat supaya setiap sesi Claude (atau kamu sendiri) langsung tahu:
> 1. Fitur X ada di file mana (sekarang / setelah dipisah)
> 2. Bagian mana yang **sudah** dipisah dan mana yang **belum**
> 3. Aturan main biar hasil pisahnya konsisten, gak bentrok, dan gak merusak app yang jalan

---

## 0. CARA PAKAI FILE INI (WAJIB DIBACA CLAUDE SEBELUM MENGERJAKAN APAPUN)

1. **Sebelum mulai kerja apapun di OSS**, baca dulu seluruh file ini untuk tahu konteks & status terkini.
2. Cari fitur/section yang diminta user di **Bagian 3 (Peta Fitur → File)**. Kolom **Status** memberitahu apakah kode itu:
   - `⬜ BELUM` → kodenya masih nyampur di `app.js` (dan `style.css`) lama, lokasi ditandai dengan baris perkiraan.
   - `✅ SUDAH` → kodenya sudah dipindah ke file target di kolom **File Target**. Kerjakan di file itu, JANGAN cari lagi di `app.js`.
   - `🟡 SEBAGIAN` → sebagian sudah dipindah, sebagian masih nyampur (dijelaskan di kolom Catatan).
3. **Setiap kali kamu (Claude) selesai memisahkan satu bagian ke file baru**, kamu WAJIB:
   - Update kolom **Status** bagian itu jadi `✅ SUDAH` (atau `🟡 SEBAGIAN` kalau belum tuntas).
   - Isi kolom **File Target** dengan path file yang benar.
   - Tambahkan 1 baris baru di **Bagian 6 — Riwayat Pemisahan (Changelog)** dengan format yang sudah dicontohkan.
   - Update urutan `<script>` di `index.html` sesuai Bagian 4.
   - **Jangan** tandai ✅ kalau belum benar-benar dites jalan (minimal: dibuka di browser, tidak ada error di console).
4. **Nomor baris di kolom "Lokasi di app.js (baseline)" akan berubah/tidak valid lagi** begitu ada bagian lain yang sudah dipindah keluar (karena app.js jadi lebih pendek). Baris itu HANYA valid untuk baseline snapshot tanggal **7 Agustus 2026** (18.345 baris). Kalau butuh cari lokasi pasti, **selalu grep nama fungsi/marker komentarnya**, jangan percaya nomor baris mentah-mentah setelah ada perubahan.
5. Kerjakan **satu bagian per sesi** (sesuai urutan prioritas di Bagian 5, atau sesuai permintaan user). Jangan coba pisahkan banyak sekaligus — itu penyebab kena limit.
6. Semua fungsi tetap **global** (attached ke `window` atau var global biasa, TIDAK pakai ES module `import/export`) kecuali user secara eksplisit minta migrasi ke ES modules. Ini supaya `onclick="..."` inline di HTML yang di-generate lewat `innerHTML` tetap jalan tanpa refactor besar-besaran.

---

## 1. KONDISI SAAT INI (Baseline Snapshot — 7 Agustus 2026)

| File | Baris | Peran |
|---|---|---|
| `index.html` | 295 | Shell HTML kosong — hampir semua konten di-render lewat JS ke `#app-content`. Berisi loading screen, watercolor canvas, top bar, side nav, dialog system, PWA banner. |
| `style.css` | 1.235 | Semua styling (1 file, sudah cukup rapi per-section pakai comment header, belum perlu dipecah prioritas tinggi). |
| `app.js` | **18.345** | **MONOLITH** — semua logic: engine statistik, semua UI render, semua export, semua state. Ini target utama pemisahan. |
| `manifest.json` | 46 | PWA manifest — sudah rapi, tidak perlu dipecah. |
| `sw.js` | 114 | Service worker (cache strategy) — sudah rapi, tidak perlu dipecah. |

**Fokus roadmap ini = memecah `app.js`.** `style.css`, `manifest.json`, `sw.js` dianggap sudah "selesai" dan tidak masuk roadmap split (kecuali nanti diminta).

---

## 2. TARGET STRUKTUR DIREKTORI (Tujuan Akhir)

```
/OSS/
├── index.html
├── manifest.json
├── sw.js
├── style.css
└── js/
    ├── core/
    │   ├── watercolor-bg.js       (animasi canvas background)
    │   ├── router.js              (page router + app tab switching)
    │   ├── icons.js                (SVG ICON SYSTEM / objek IC)
    │   ├── dialog.js               (OSS Dialog Engine — pengganti confirm/alert/prompt)
    │   ├── loading-screen.js       (loading screen + dismiss logic)
    │   └── state.js                (global state: vars, dataArr, currentASub, aState, dll)
    │
    ├── stats-engine/
    │   ├── stats-core-basic.js     (descriptive, t-test, ANOVA 1-way, korelasi, regresi dasar)
    │   ├── stats-core-advanced.js  (matrix ops, multiple reg, EFA, CFA, MANOVA, canonical corr)
    │   ├── stats-nonparametric.js  (Mann-Whitney, Kruskal, Wilcoxon, Fisher, Cohen's Kappa)
    │   ├── stats-distributions.js  (helper distribusi: tCrit, betaInc, gammaSer, erf, normInv, fCDF, chiCDF)
    │   ├── stats-glm-hlm.js        (GLM Poisson/NegBin, HLM 2-level/3-level/ICC)
    │   ├── stats-bayesian.js       (Bayesian t-test, Bayesian correlation, posterior)
    │   ├── stats-discriminant-cluster.js (LDA, K-Means, Hierarchical Clustering)
    │   ├── stats-survival.js       (Kaplan-Meier, Log-Rank, Cox PH)
    │   ├── stats-mediation-sem.js  (Mediation, Moderation, SEM/lavaan syntax)
    │   ├── stats-metaanalysis.js   (Meta-analysis: forest plot data, funnel plot data)
    │   ├── stats-poweranalysis.js  (Power analysis, sensitivity, power plot)
    │   ├── stats-timeseries.js     (Time series analysis)
    │   ├── stats-roc.js            (ROC curve + ROC compare)
    │   ├── stats-imputation.js     (Multiple Imputation / MICE)
    │   └── stats-crosstab.js       (Chi-Square Test of Independence untuk Crosstab)
    │
    ├── data/
    │   ├── dataset-manager.js      (MULTI-DATASET SYSTEM — tab dataset, array `datasets`)
    │   ├── data-view.js            (tab Data: tabel, sort, search, select rows, windowed render)
    │   ├── spreadsheet-mode.js     (SPREADSHEET / BULK EDIT MODE)
    │   ├── variable-view.js        (tab Variables: edit mode, picker TYPE/MEASURE/ROLE)
    │   ├── data-transform.js       (Compute/Transform, Recode, Filter Cases)
    │   ├── weight-cases.js         (Weight Cases)
    │   └── missing-data.js         (Missing Data Analysis — Little's MCAR, pattern matrix)
    │
    ├── analyze/
    │   ├── analyze-form-render.js  (renderer form config raksasa — switch per `currentASub`)
    │   └── analyze-subtab-ui.js    (sliding pill indicator, sub-tab switching UI)
    │
    ├── charts/
    │   ├── svg-charts-core.js      (chart dasar: bar/line/scatter/pie/boxplot SVG)
    │   ├── forest-funnel-plot.js   (Forest Plot & Funnel Plot untuk meta-analysis)
    │   ├── sem-mediation-diagram.js(diagram path SEM & mediation)
    │   └── interaction-plot.js     (interaction plot Two-Way/Three-Way ANOVA)
    │
    ├── output/
    │   ├── output-view-shell.js    (tab group system Output View, dispatcher utama)
    │   ├── output-render-basic.js  (render hasil: descriptive s/d regression/GLM/MANOVA)
    │   ├── output-render-advanced.js(render hasil: HLM, EFA/CFA, SEM, discriminant, cluster,
    │   │                             power, ROC, survival, Bayesian, time series, meta-analysis)
    │   ├── output-power-render.js  (renderPowerOutput khusus)
    │   └── apa-copy.js             (fitur copy tabel format APA)
    │
    ├── export/
    │   ├── export-word.js          (generate & download .doc, per-output & bulk)
    │   ├── export-excel.js         (export ke Excel via SheetJS)
    │   └── export-dialog.js        (dialog pilih output yang mau diexport)
    │
    ├── session/
    │   ├── session-save-restore.js (save/restore session snapshot, dirty-flag tracking)
    │   └── oss-filesystem.js       (save/open file `.oss` — File System Access API + fallback input)
    │
    └── ui-misc/
        ├── ai-view.js              (tab AI — chat history & UI)
        ├── syntax-view.js          (tab Syntax — tampilan syntax ala SPSS)
        ├── pivot-view.js           (tab Pivot table)
        ├── cmd-palette.js          (Command Palette / Ctrl+K)
        ├── custom-select.js        (Custom Select — modal bottom sheet picker)
        ├── activity-loading-popup.js (popup "sedang memproses...")
        ├── pwa-install.js          (register SW, install prompt, tombol Install App)
        └── badges.js               (updateBadges — badge N=cases, missing, dll)
```

> Catatan: struktur ini **target**, bukan berarti harus persis segini banyaknya di awal. Kalau kepanjangan, boleh digabung 2-3 file jadi 1 dulu (misal semua `stats-*` kecil digabung dulu), yang penting **konsisten dengan tabel di Bagian 3** dan ditandai di changelog.

---

## 3. PETA FITUR → FILE (Detail per Section)

Legend status: `⬜ BELUM` · `🟡 SEBAGIAN` · `✅ SUDAH`

### A. Core / Bootstrap

| # | Fitur / Section | Lokasi di `app.js` (baseline 7 Agu 2026) | File Target | Status |
|---|---|---|---|---|
| A1 | Watercolor Canvas Animation (background) | baris 1–112 | `js/core/watercolor-bg.js` | ✅ SUDAH |
| A2 | Page Router (`appReady`, fixed-position page isolation) | baris 113–172 | `js/core/router.js` | ✅ SUDAH |
| A3 | SVG Icon System (objek `IC`) | baris 173–212 | `js/core/icons.js` | ✅ SUDAH |
| A4 | OSS Dialog Engine (custom confirm/alert/prompt) | baris 3358–3423 | `js/core/dialog.js` | ✅ SUDAH |
| A5 | Loading Screen dismiss logic | baris 18313–akhir | `js/core/loading-screen.js` | ✅ SUDAH |
| A6 | App Tab Switching + Side Nav active state + `TAB_LABELS` | baris 16421–16519 | `js/core/router.js` (gabung dengan A2) | ✅ SUDAH |
| A7 | Update Badges (N=cases, missing, dll) | baris 16521–16543 | `js/ui-misc/badges.js` | ✅ SUDAH |

> ⚠️ **Temuan A7 (sudah diselesaikan)**: ada **2 fungsi `updateBadges()`** di `app.js` — dead code lama (~baris 3315, isi `badge-vars`/`badge-out`/`wc-badge`) dan versi aktif (~baris 16150, isi `badge-cases`/`tb-cases`/`tb-miss` + panggil `renderDsSidebar()`). User dikonfirmasi (2026-09-13): **pakai versi aktif, versi lama dihapus permanen** (bukan cuma dipindah). Mirip kasus H1/H2 (`saveSession`) yang masih menunggu keputusan serupa di Bagian H.

### B. Statistics Engine (fungsi murni komputasi, tanpa DOM)

| # | Fitur / Section | Lokasi di `app.js` (baseline) | File Target | Status |
|---|---|---|---|---|
| B1 | Distribusi helper (`tCrit`, `lnG`, `betaCF`, `incBeta`, `gammaSer/CF`, `erf`, `normInv`, `quantile`, `fCDF`, `chiCDF`, dll) | baris 217–417 (nyampur dgn B2) | `js/stats-engine/stats-distributions.js` | ✅ SUDAH |
| B2 | Descriptive, T-Test (indep/paired/one-sample), One-way ANOVA + Tukey HSD, Pearson/Spearman, Linear Regression sederhana | baris 418–998 | `js/stats-engine/stats-core-basic.js` | ✅ SUDAH |
| B3 | Matrix ops (matMul/matT/matDet/matInv), Multiple Regression, Repeated Measures ANOVA | baris 598–996 | `js/stats-engine/stats-core-advanced.js` | ✅ SUDAH |
| B4 | Nonparametric: Mann-Whitney (+exact dist), Kruskal-Wallis, Wilcoxon, Cronbach's Alpha, Cohen's Kappa, Fisher Exact | baris 1038–1362 | `js/stats-engine/stats-nonparametric.js` | ✅ SUDAH |
| B5 | Format helper (`f4`, `f1`, `pFmt`, `dLabel`, `effLabel`), Cohen's d CI, eta² CI | baris 1362–1410 | gabung ke `js/stats-engine/stats-core-basic.js` | ✅ SUDAH |
| B6 | GLM Univariate, Bonferroni, Partial Correlation, Canonical Correlation | baris 1411–1703 | `js/stats-engine/stats-glm-hlm.js` (GLM) + `stats-core-advanced.js` (partial/canonical corr) | ✅ SUDAH |
| B7 | Posthoc: LSD, Bonferroni, Holm-Bonferroni | baris 1704–1783 | `js/stats-engine/stats-core-basic.js` | ✅ SUDAH |
| B8 | EFA (Exploratory Factor Analysis) + Varimax rotation, CFA (Confirmatory) | baris 1784–2182 | `js/stats-engine/stats-core-advanced.js` | ✅ SUDAH |
| B9 | MANOVA (Pillai, Wilks, Hotelling-Lawley, Roy) | baris 2183–2423 | `js/stats-engine/stats-core-advanced.js` | ✅ SUDAH |
| B10 | Two-Way ANOVA (Factorial 2×k) | baris 2424–2550 | `js/stats-engine/stats-core-basic.js` | ✅ SUDAH |
| B11 | Three-Way ANOVA (Factorial A×B×C) + sparse cell warning tiering | baris 2551–3252 | `js/stats-engine/stats-core-basic.js` | ✅ SUDAH |
| B12 | Meta-Analysis core (effect size pooling, heterogeneity, forest/funnel data) | baris 9790–10028 | `js/stats-engine/stats-metaanalysis.js` | ✅ SUDAH |
| B13 | Mediation computation core | baris 10137–10320 | `js/stats-engine/stats-mediation-sem.js` | ✅ SUDAH |
| B14 | Power Analysis computation | baris 10321–10685 | `js/stats-engine/stats-poweranalysis.js` | ✅ SUDAH |
| B15 | Moderation Analysis computation | baris 10686–11017 | `js/stats-engine/stats-mediation-sem.js` | ✅ SUDAH |
| B16 | Multiple Imputation (MICE — PMM/Normal) | baris 11018–11162 | `js/stats-engine/stats-imputation.js` | ✅ SUDAH |
| B17 | ROC Curve + ROC Compare | baris 11163–11321 | `js/stats-engine/stats-roc.js` | ✅ SUDAH |
| B18 | Survival Analysis (Kaplan-Meier, Log-Rank, Cox PH) | baris 11322–11785 | `js/stats-engine/stats-survival.js` | ✅ SUDAH |
| B19 | SEM core computation + generate lavaan syntax | baris 11848–12420 | `js/stats-engine/stats-mediation-sem.js` | ✅ SUDAH |
| B20 | Bayesian Statistics Engine | baris 12421–12955 | `js/stats-engine/stats-bayesian.js` | ✅ SUDAH |
| B21 | Discriminant Analysis (LDA) computation | baris 12956–13209 | `js/stats-engine/stats-discriminant-cluster.js` | ✅ SUDAH |
| B22 | Cluster Analysis (K-Means & Hierarchical) computation | baris 13210–13761 | `js/stats-engine/stats-discriminant-cluster.js` | ✅ SUDAH |
| B23 | Weight Cases (logic non-UI) | baris 13762–13818 | `js/data/weight-cases.js` | ✅ SUDAH |
| B24 | Hierarchical Regression toggle helper + Logistic Regression | baris 6141–6274, 16789–16849 | `js/stats-engine/stats-core-advanced.js` (hanya `logisticReg`, lihat catatan) | 🟡 SEBAGIAN |
| B25 | GLM Poisson/NegBin, HLM 2-level/3-level/ICC render+compute (nyampur) | baris 6910–7476 | `js/stats-engine/stats-glm-hlm.js` | ✅ SUDAH (2026-09-16) |
| B26 | Time Series Analysis | ~~baris 9323–9656~~ (grep marker: `TIME SERIES (ARIMA + Decomposition)`, di dalam analyze-form-render) | `js/stats-engine/stats-timeseries.js` | ✅ SUDAH |
| B27 | Chi-Square Test of Independence (Crosstab) — statistic, df, p, Cramér's V, deteksi expected freq <5 | *(tidak tercatat di baseline asli — ditemukan saat scan B4)* | `js/stats-engine/stats-crosstab.js` | ✅ SUDAH |

> Catatan penting untuk B: banyak fungsi ini ada di dalam **1 IIFE besar** (mirip namespace `Stat`). Saat dipisah, pastikan cara ekspos fungsinya (`window.Stat = {...}` atau taruh semua langsung di global scope) **konsisten** — jangan campur 2 gaya beda di file yang berbeda, biar gampang dipanggil dari file lain.
>
> **Strategi yang dipakai (dikonfirmasi jalan di B1):** fungsi-fungsi di dalam `var SE = (() => {...})()` dipindah keluar IIFE jadi **fungsi global biasa** (bukan ES module), lalu di akhir IIFE (yang masih tersisa di app.js) ada `return {...}` yang isinya cuma nama-nama fungsi tsb — karena semua sudah jadi global, `return {mean, std, ...}` tetap jalan (JS fallback ke global scope). Jadi `SE.mean(...)` dkk dari luar tetap jalan seperti biasa TANPA perlu ubah pemanggil di tempat lain. Lanjutkan pola ini untuk B2 dst.
>
> ⚠️ **Temuan baru saat scan struktur B (belum diperbaiki, tunggu keputusan user sebelum lanjut ke B2/B3):**
> 1. **`matMul`, `matT`, `matDet`, `matInv` dideklarasikan 2x dengan signature BEDA** — versi pertama (dipakai `multipleReg`, sekitar baris lama 416–468) pakai bentuk `matMul(A,m,n,B,p)` dll; versi kedua (dipakai EFA/CFA/`manovaProper`, sekitar baris lama 1906–1944) pakai bentuk `matMul(A,B)` 1-2 argumen. Karena deklarasi fungsi kedua **menimpa** yang pertama di scope yang sama, kemungkinan besar `multipleReg` saat ini memanggil versi matriks yang salah (signature tidak cocok) → **kemungkinan bug aktif di fitur Multiple Regression**. Belum disentuh — butuh keputusan user: mau di-rename biar tidak tabrakan (misal `matMulReg` vs `matMulSq`), atau dicek dulu apakah memang masih berfungsi normal di app.
> 2. **Ditemukan saat mengerjakan B2/B5 (belum diperbaiki, cuma dicatat — sesuai instruksi user "biarkan dulu apa adanya"):** ternyata ada **2 deklarasi `pFmt` lain** di luar IIFE `SE` yang berbeda dari `pFmt` versi B5 yang baru dipindah — satu di dalam scope lokal modul lain (sekitar baris app.js saat ini ~8987, isi `if(p<0.001) return '<0.001'; ...`), satu lagi top-level global (sekitar baris ~14920). Karena scoping JS (local shadowing di dalam fungsi/IIFE masing-masing), kemungkinan ini **tidak** menimbulkan bug langsung seperti kasus `matMul`/`f1` (beda scope, bukan overwrite di scope yang sama) — tapi tetap technical debt yang sebaiknya dirapikan nanti. Belum disentuh.
> 3. **`f1` dideklarasikan 2x dengan isi beda total** — versi pertama (~baris lama 1154) `f1(v){return f4(v,1);}` (format angka 1 desimal), versi kedua (~baris lama 2506) `f1(x){return isFinite(x)?Math.round(x*10)/10:'—';}` (bulatkan 1 desimal, beda cara handle non-finite). Versi kedua yang aktif dipakai sekarang. Belum dihapus — sama kasusnya dengan `updateBadges`/`fCDF`, tunggu konfirmasi user.

> ⚠️ **Temuan B21 (belum diperbaiki)**: di `computeLDA` (`js/stats-engine/stats-discriminant-cluster.js`), baris `wilksP=pFmt(1-SE.chi2CDF?SE.chi2CDF(chiSq,dfW_chi):NaN)` kemungkinan bug operator-precedence — `1-SE.chi2CDF` (angka dikurangi function) selalu jadi `NaN`, dan `NaN` di posisi kondisi ternary selalu falsy, jadi `wilksP` kemungkinan **selalu** bernilai `pFmt(NaN)='—'`, tidak pernah benar-benar menghitung p-value Wilks' Lambda. Kemungkinan bug aktif di fitur Discriminant Analysis, mirip kasus `matMul` di atas. Belum disentuh, tunggu konfirmasi user.

> ⚠️ **Temuan B23 / C3 (sudah diselesaikan)**: dua baris tabel yang tampak terpisah — B23 "Weight Cases (logic non-UI)" dan C3 "Weight helpers (dipakai lintas fitur)" — ternyata menunjuk ke **kode yang sama persis** (`getNEff`/`getWeightedRows`, cuma 1 pasang fungsi di app.js, bukan 2 pasang di 2 lokasi berbeda seperti tersirat baseline). Dipisah sekali ke `js/data/weight-cases.js`, kedua baris ditandai selesai. Temuan tambahan (belum diperbaiki): `getWeightedRows()` dicek grep di seluruh app.js — **tidak pernah dipanggil** kecuali disebut di komentar dokumentasi; tidak ada fungsi analisis statistik manapun yang benar-benar menerapkan weighting lewat fungsi ini. Fitur Weight Cases kemungkinan baru menghitung N efektif secara kosmetik (lewat `getNEff()`), belum benar-benar mempengaruhi hasil analisis. Tunggu konfirmasi user.

> ⚠️ **Temuan B24 (SEBAGIAN, belum dipindah semua sesuai tabel — lihat penjelasan)**: tabel B24 menulis "Hierarchical Regression toggle helper + Logistic Regression" sebagai 1 baris. Setelah dicek, ini sebenarnya 2 hal beda sifat:
> 1. `logisticReg` (computation murni, IRLS binary + multinomial logistic regression) — **sudah dipindah** ke `js/stats-engine/stats-core-advanced.js` sebagai fungsi global, pola sama B1-B23.
> 2. `toggleHrBlock` ("Hierarchical Regression toggle helper") — ternyata murni state helper yang memanggil `renderASub()` (trigger UI), **pola PERSIS SAMA** dengan `semAddLatent`/`semRemoveLatent`/dst di B19 yang sengaja TIDAK dipindah ke stats-engine karena itu "UI state", bukan "computation". Supaya konsisten, `toggleHrBlock` (+ `runHierarchicalReg`, UI wiring) **TETAP DIBIARKAN di app.js**, menyimpang dari teks literal tabel roadmap. Kalau user mau tetap ikuti tabel literal, tinggal bilang.
> 
> Temuan tambahan: fungsi `logisticReg` sebelumnya berbagi scope dengan deklarasi LOKAL `function f1(x){...}` (isi persis sama dengan `f1` global dari B5, temuan duplikat `f1` B1) — setelah `logisticReg` dipindah keluar, `f1` lokal ini sekarang **benar-benar jadi dead code** (sebelumnya masih dipakai `logisticReg`). Belum dihapus, sama kasusnya dengan duplikat `f1` yang sudah dicatat sejak B1.

### C. Data Management (tab Data & Variables)

| # | Fitur / Section | Lokasi di `app.js` (baseline) | File Target | Status |
|---|---|---|---|---|
| C1 | Multi-Dataset System (array `datasets`, tab dataset) | ~~baris 3253–3357~~ (grep marker: `MULTI-DATASET SYSTEM`, baris 65–195 di app.js snapshot sesi ini, 12.603 baris) | `js/data/dataset-manager.js` | ✅ SUDAH (2026-09-18) |
| C2 | Analyze sub-tab state helper (`aState`, field helpers) | baris 3454–3573 | `js/analyze/analyze-subtab-ui.js` | ⬜ BELUM |
| C3 | Weight helpers (dipakai lintas fitur, didefinisikan awal) | baris 3550–3573 | `js/data/weight-cases.js` | ✅ SUDAH (digabung dengan B23 — lihat catatan) |
| C4 | HTML Helpers umum (`sigBadge`, dll) | baris 3977–3999 | `js/core/state.js` atau util bersama | ⬜ BELUM |
| C5 | Custom Select — Modal Bottom Sheet picker | baris 4000–4125 | `js/ui-misc/custom-select.js` | ⬜ BELUM |
| C6 | Data View — tabel utama, sort/search/select, windowed rendering | baris 4131–4267 | `js/data/data-view.js` | ⬜ BELUM |
| C7 | Spreadsheet (Bulk Edit) Mode | baris 4268–4898 | `js/data/spreadsheet-mode.js` | ⬜ BELUM |
| C8 | Variable View — edit mode, inline add/change, picker TYPE/MEASURE/ROLE | baris 4899–5692 | `js/data/variable-view.js` | ⬜ BELUM |
| C9 | Sliding pill indicator untuk sub-tabs | baris 5693–5736 | `js/analyze/analyze-subtab-ui.js` | ⬜ BELUM |
| C10 | Transform (Compute), Recode, Filter Cases | baris 6493–6557 | `js/data/data-transform.js` | ⬜ BELUM |
| C11 | Missing Data Analysis (Little's MCAR, pattern matrix render) | baris 8348–8615 | `js/data/missing-data.js` | ⬜ BELUM |

### D. Analyze — Form Renderer (raksasa, disarankan dipecah lebih halus lagi nanti)

| # | Fitur / Section | Lokasi di `app.js` (baseline) | File Target | Status |
|---|---|---|---|---|
| D1 | Switch besar render form per `currentASub` (descriptive → metaanalysis, ~50 jenis analisis) | baris 5737–9785 | `js/analyze/analyze-form-render.js` | ⬜ BELUM |

> **D1 ini ~4.000 baris sendirian.** Kalau kena limit waktu dipisahkan, boleh dipecah lagi per kelompok analisis (mis. `analyze-form-basic.js`, `analyze-form-advanced.js`, `analyze-form-multivariate.js`) — kalau dipecah lebih halus dari rencana awal, **update juga tabel struktur direktori di Bagian 2** biar tetap sinkron.

### E. Charts (SVG Rendering)

| # | Fitur / Section | Lokasi di `app.js` (baseline) | File Target | Status |
|---|---|---|---|---|
| E1 | SVG Charts umum (bar/line/scatter/dll, palet warna `PAL2`) | baris 3671–3785 | `js/charts/svg-charts-core.js` | ⬜ BELUM |
| E2 | Interaction Plot (Two-Way / Three-Way ANOVA) | baris 3676–3750 | `js/charts/interaction-plot.js` | ⬜ BELUM |
| E3 | ANOVA Source Table renderer | baris 3751–3976 | `js/output/output-render-basic.js` | ⬜ BELUM |
| E4 | Forest Plot SVG | baris 9878–9959 | `js/charts/forest-funnel-plot.js` | ⬜ BELUM |
| E5 | Funnel Plot SVG | baris 9960–10028 | `js/charts/forest-funnel-plot.js` | ⬜ BELUM |
| E6 | Mediation path diagram SVG | baris 10091–10136 | `js/charts/sem-mediation-diagram.js` | ⬜ BELUM |
| E7 | SEM Path Diagram SVG | baris 12159–12244 | `js/charts/sem-mediation-diagram.js` | ⬜ BELUM |

### F. Output View (tampilan hasil analisis)

| # | Fitur / Section | Lokasi di `app.js` (baseline) | File Target | Status |
|---|---|---|---|---|
| F1 | Output View — Tab Group System (shell/container) | baris 13935–13951 | `js/output/output-view-shell.js` | ⬜ BELUM |
| F2 | Ringkasan per-tipe output (dispatcher singkat by `o.type`) | baris 13952–14212 | `js/output/output-view-shell.js` | ⬜ BELUM |
| F3 | `renderOutput()` — render detail basic (descriptive s/d GLM/Poisson/MANOVA) | baris 14213–14966 | `js/output/output-render-basic.js` | ⬜ BELUM |
| F4 | `renderOutput()` lanjutan — HLM, Alpha, Kappa, EFA, CFA, SEM, Mediation, Discriminant, Cluster | baris 14967–15414 | `js/output/output-render-advanced.js` | ⬜ BELUM |
| F5 | `renderOutput()` lanjutan — Power, Moderation, MI, ROC, Survival, Cox, Bayesian, Time Series, Meta-analysis | baris 15415–15701 | `js/output/output-render-advanced.js` | ⬜ BELUM |
| F6 | `renderPowerOutput()` khusus + helper lain sesudahnya | baris 15702–16329 | `js/output/output-power-render.js` | ⬜ BELUM |
| F7 | APA-format table copy (`buildAPAText`, per-output & bulk copy) | tersebar di dalam F3–F5 (cari via `buildAPAText`) | `js/output/apa-copy.js` | ⬜ BELUM |

### G. Export

| # | Fitur / Section | Lokasi di `app.js` (baseline) | File Target | Status |
|---|---|---|---|---|
| G1 | Build & download satu output sebagai `.doc` | baris 17075–17099 | `js/export/export-word.js` | ⬜ BELUM |
| G2 | Build HTML untuk satu output (mode table/chart/both) | baris 17100–17193 | `js/export/export-word.js` | ⬜ BELUM |
| G3 | Get chart SVG string untuk output tertentu | baris 17194–17239 | `js/export/export-word.js` | ⬜ BELUM |
| G4 | Per-Output Export Dialog | baris 16963–17075, 16966–17239 | `js/export/export-dialog.js` | ⬜ BELUM |
| G5 | Export Word Dialog (pilih group/sub-type) | baris 17240–17459 | `js/export/export-dialog.js` | ⬜ BELUM |
| G6 | Build & download output terpilih sebagai `.doc` (bulk) | baris 17460–17519 | `js/export/export-word.js` | ⬜ BELUM |
| G7 | `exportToWord()` — assembly HTML final + trigger download | baris 17520–17642 | `js/export/export-word.js` | ⬜ BELUM |
| G8 | Export ke Excel (SheetJS) | baris 16850–16962 | `js/export/export-excel.js` | ⬜ BELUM |

### H. Session, File System, & Autosave

| # | Fitur / Section | Lokasi di `app.js` (baseline) | File Target | Status |
|---|---|---|---|---|
| H1 | `saveSession()` (versi ringkas, quick save) | baris 16382–16420 | `js/session/session-save-restore.js` | ⬜ BELUM |
| H2 | `saveSession()` (versi lengkap + export) | baris 16721–16788 | `js/session/session-save-restore.js` (gabung dgn H1, cek duplikasi!) | ⬜ BELUM |
| H3 | Dirty-flag tracking (tandai ada perubahan belum tersimpan) | baris 17928–17972 | `js/session/session-save-restore.js` | ⬜ BELUM |
| H4 | Build session snapshot (struktur sama dgn saveSession) | baris 17973–17984 | `js/session/session-save-restore.js` | ⬜ BELUM |
| H5 | Restore snapshot dari object | baris 17985–18000 | `js/session/session-save-restore.js` | ⬜ BELUM |
| H6 | File System — Save/Open `.oss` (project file penelitian) | baris 17918–18001 | `js/session/oss-filesystem.js` | ⬜ BELUM |
| H7 | `saveToFile()` | baris 18001–18053 | `js/session/oss-filesystem.js` | ⬜ BELUM |
| H8 | Save-As (selalu buka picker) | baris 18054–18059 | `js/session/oss-filesystem.js` | ⬜ BELUM |
| H9 | Import/Open File (`importFromFile`, `handleOSSImport`) | baris 18060–18151 | `js/session/oss-filesystem.js` | ⬜ BELUM |

> ⚠️ **Perhatian saat mengerjakan H1 & H2**: ada 2 fungsi `saveSession()` di baseline (baris 16382 dan 16721) — kemungkinan salah satunya sisa/duplikat lama yang belum dibersihkan. **Cek dulu isi keduanya, tanya ke user kalau ragu mana yang dipakai**, jangan langsung digabung sembarangan.

### I. UI Misc (fitur pendukung lain)

| # | Fitur / Section | Lokasi di `app.js` (baseline) | File Target | Status |
|---|---|---|---|---|
| I1 | Syntax View (tampilan ala syntax SPSS) | baris 13819–13906 | `js/ui-misc/syntax-view.js` | ⬜ BELUM |
| I2 | Pivot View | baris 13907–13932 | `js/ui-misc/pivot-view.js` | ⬜ BELUM |
| I3 | AI View (chat history + UI tab AI) | baris 16330–16379 | `js/ui-misc/ai-view.js` | ⬜ BELUM |
| I4 | Command Palette (Ctrl+K) | baris 16544–16718 | `js/ui-misc/cmd-palette.js` | ⬜ BELUM |
| I5 | Activity Loading Popup System (popup "sedang memproses...") | baris 17643–17917 | `js/ui-misc/activity-loading-popup.js` | ⬜ BELUM |
| I6 | PWA — Service Worker registration, install prompt, tombol Install App | baris 18152–18287 | `js/ui-misc/pwa-install.js` | ⬜ BELUM |

---

## 4. ATURAN TEKNIS SAAT MEMISAHKAN FILE

1. **Tidak pakai ES Modules** (`import`/`export`) kecuali diminta lain — semua file baru tetap `<script>` biasa yang dimuat berurutan lewat `index.html`, supaya semua fungsi & variabel tetap global dan bisa dipanggil dari `onclick="..."` hasil `innerHTML`.
2. **Urutan `<script>` di `index.html` itu penting** — file yang isinya dipakai duluan harus dimuat duluan. Urutan yang disarankan:
   ```html
   <!-- 1. Core & state paling awal -->
   <script src="js/core/icons.js"></script>
   <script src="js/core/state.js"></script>
   <script src="js/core/dialog.js"></script>
   <script src="js/core/watercolor-bg.js"></script>

   <!-- 2. Stats engine (murni komputasi, tidak butuh DOM) -->
   <script src="js/stats-engine/stats-distributions.js"></script>
   <script src="js/stats-engine/stats-core-basic.js"></script>
   <script src="js/stats-engine/stats-core-advanced.js"></script>
   <script src="js/stats-engine/stats-nonparametric.js"></script>
   <!-- ...dst sesuai yang sudah dipisah... -->

   <!-- 3. Data layer -->
   <script src="js/data/dataset-manager.js"></script>
   <script src="js/data/data-view.js"></script>
   <!-- ...dst... -->

   <!-- 4. Analyze, charts, output, export -->
   <!-- 5. Session & file system -->
   <!-- 6. UI misc + router (paling akhir, karena manggil semua di atas) -->
   <script src="js/core/router.js"></script>
   ```
   Setiap kali satu file baru ditambahkan, **update urutan ini juga** di `index.html` dan di bagian ini.
3. **Setiap file baru dimulai dengan header komentar** singkat: nama modul, fitur yang dicover, dan dependency-nya (fungsi/var global apa dari file lain yang dia butuhkan). Contoh:
   ```js
   // ════════════════════════════════════════════════════════════
   // js/data/variable-view.js
   // Fitur: tab Variables — edit mode, inline add/change, picker TYPE/MEASURE/ROLE
   // Depends on: vars[], IC (icons.js), ossDialog (dialog.js), showToast()
   // ════════════════════════════════════════════════════════════
   ```
4. **Jangan ubah logic saat memindahkan** — pemisahan tahap ini murni "potong-tempel" + rapikan dependency. Kalau nemu bug/duplikat (seperti kasus H1/H2 di atas), catat & tanya user dulu, jangan sekaligus refactor logic tanpa izin.
5. **Setelah setiap pemisahan, wajib dites**: buka app di browser, cek console tidak ada `ReferenceError`/`is not defined`, dan coba jalankan fitur yang baru dipindah.
6. **Commit / simpan per-bagian kecil.** Jangan pernah mencoba memisahkan lebih dari 1-2 baris tabel di Bagian 3 dalam satu sesi kalau bagian itu besar (seperti D1 yang ~4000 baris) — pecah jadi beberapa sesi.
7. **WAJIB: setiap temuan (bug, duplikat, dead code, dependency aneh, penamaan bentrok, dll) yang muncul saat mengerjakan SATU bagian tabel HARUS dicatat**, tidak boleh cuma disimpan di kepala/percakapan lalu hilang di sesi berikutnya. Formatnya:
   - **Di catatan atas tabel section yang relevan (Bagian 3)** — pakai format `⚠️ **Temuan [kode bagian]**: ...` tepat di atas tabel A/B/C/dst yang sedang dikerjakan, supaya sesi berikutnya yang buka bagian itu langsung lihat sebelum mulai kerja (bukan cuma terkubur di changelog panjang Bagian 6).
   - **Di baris changelog Bagian 6** milik bagian yang sedang dikerjakan saat itu — jelaskan apa yang ditemukan, kenapa itu temuan (bukan cuma dipindah), dan status-nya (belum diperbaiki / sudah diperbaiki + alasan/konfirmasi user).
   - **Di header komentar file baru** kalau temuan itu langsung relevan dengan fungsi yang ada di file itu (biar siapapun yang buka filenya langsung tahu, tanpa perlu balik baca ARCHITECTURE.md).
   - Temuan TIDAK BOLEH diperbaiki diam-diam tanpa dicatat + tanpa konfirmasi user (lihat poin 4) — tapi mencatatnya WAJIB dilakukan meski keputusan perbaikannya masih menunggu.
   - Kalau temuan itu berupa 2 baris tabel (misal B23/C3) yang ternyata menunjuk ke kode yang sama persis, itu juga temuan yang wajib dicatat (bukan cuma dipisah diam-diam & ditandai selesai tanpa penjelasan).

---

## 5. URUTAN PRIORITAS DISARANKAN

Karena dependency paling sedikit → paling banyak, urutan pengerjaan yang disarankan:

1. **A (Core)** — paling independen, base untuk semua.
2. **B (Stats Engine)** — pure functions, tidak sentuh DOM, resiko break paling kecil.
3. **C (Data Management)** — depends on A + sedikit B.
4. **E (Charts)** — depends on B (data hasil komputasi) + A (icons).
5. **G, H (Export & Session)** — depends on state dari C.
6. **F (Output View)** — depends on B, E.
7. **D (Analyze Form Render)** — paling besar & paling banyak dependency, cocok dikerjakan terakhir & bertahap per kelompok analisis.
8. **I (UI Misc)** — bisa disisipkan kapan saja karena relatif independen.

Silakan menyimpang dari urutan ini kalau user minta fitur spesifik duluan — urutan ini cuma saran default.

---

## 6. RIWAYAT PEMISAHAN (CHANGELOG)
| 2026-09-16 | B26 | `js/stats-engine/stats-timeseries.js` (baru) | Dipindah sbg fungsi global, pola sama B1-B25: `tsACF`, `tsPACF`, `tsDiff`, `tsARIMA` (AR via Yule-Walker, MA via ACF residual, AIC/BIC, forecast 1-step + 95% CI, ACF/PACF/residual-ACF), `tsDecomp` (Classical Decomposition additive/multiplicative — moving average trend, seasonal index, remainder, seasonal strength). Dependency `SE.mean`/`SE.f4`/`SE.vari` diakses lewat `SE.` di dalam function body (runtime), aman dipindah ke file pre-`app.js`, pola sama B13/B15/B19/B21. **Scope B26 murni lokasi preview** (`analyze-form-render`, sub-tab Time Series) sesuai kolom "Lokasi" di tabel roadmap — `runTimeSeries()` (fungsi terpisah untuk tombol "▶ Run", ada implementasi duplikat sendiri `tsACF2`/`tsDiff2` + inline ARIMA/decomp) **BUKAN** bagian lokasi ini dan sengaja **tidak disentuh**, biar scope tetap 1 lokasi per sesi. **Temuan penting (✅ DIPERBAIKI 2026-09-16, sesi ini juga)**: `SE.vari` ternyata **tidak pernah** dimasukkan ke `return {...}` objek `SE` di `app.js` — persis pola bug `SE.matInv` (ditemukan & diperbaiki di sesi lain, lihat Bagian 8) dan `SE.fCDF`/`SE.chiCDF` (B1). Dampaknya: mode **Decomposition** pada Time Series Analysis (baik preview maupun tombol "Run", dua-duanya manggil `SE.vari`) selalu gagal diam-diam (`tsRes._err` di preview, kemungkinan error ter-catch di `runSafe` untuk tombol Run) — mode **ARIMA tidak terdampak** (tidak pakai `SE.vari`). Dikonfirmasi BUKAN regresi dari split ini: diuji dgn Node `vm` module load urutan file persis seperti `index.html`, `typeof SE.vari` sudah `undefined` SEBELUM `stats-timeseries.js` disentuh sama sekali. **Sudah diperbaiki** atas permintaan user: `vari` ditambahkan ke return list `SE` di `app.js` (lihat Bagian 8). Diverifikasi ulang setelah fix via Node `vm` module: `SE.vari(Y)` sekarang mengembalikan nilai identik dengan implementasi manual, `tsDecomp` jalan normal untuk additive maupun multiplicative tanpa workaround, `tsARIMA` (tidak pakai `SE.vari`) dicek tetap tidak berubah. Diverifikasi via Node `vm` module (urutan load persis `index.html`, `stats-timeseries.js` dimuat sebelum `app.js`): `tsARIMA` konvergen pada data sintetis trend+seasonal (AIC/BIC/forecast masuk akal, ACF/PACF meluruh sesuai pola AR), `tsDecomp` diuji terpisah dengan `SE.vari` di-patch sementara (khusus test awal sebelum fix, bukan bagian file yang dipindah) untuk membuktikan logic dekomposisinya sendiri sudah benar & tidak berubah dari versi asli — hasil `strength`/`sse` masuk akal untuk data dengan pola trend+seasonal jelas. `index.html` diupdate: `stats-timeseries.js` (baru) dimuat setelah `stats-discriminant-cluster.js`, sebelum `app.js`. |

> Tambahkan 1 baris baru di sini SETIAP KALI selesai memisahkan sesuatu. Format: tanggal, bagian yang dipisah (kode # dari tabel Bagian 3), file tujuan, catatan singkat.

| Tanggal | Bagian (#) | File Tujuan | Catatan |
|---|---|---|---|
| 2026-08-07 | — | — | README arsitektur ini dibuat pertama kali. Belum ada file yang dipisah — semua kode masih 100% di `app.js` monolith (18.345 baris). |
| 2026-09-13 | A1 | `js/core/watercolor-bg.js` | Watercolor canvas animation, murni IIFE self-contained, tidak ada dependency ke file lain. |
| 2026-09-13 | A2, A6 | `js/core/router.js` | Digabung sesuai rencana Bagian 2: page router (`appReady`, `enterApp`, `toggleSide`, `closeSide`) + tab switching (`switchTab`, `TAB_LABELS`, `SUB_TO_GROUP`, `openAnalyze`, dst). Boot sequence akhir app.js (`updateBadges(); renderDsSidebar(); loadSession(); enterApp();`) juga dipindah ke sini karena isinya trigger routing awal. `index.html` diupdate: `router.js` dimuat **setelah** `app.js` karena masih depend ke banyak fungsi render yang belum dipisah. |
| 2026-09-13 | A3 | `js/core/icons.js` | Objek `IC` (SVG icon system), pure data, tidak ada dependency. |
| 2026-09-13 | A4 | `js/core/dialog.js` | `escDlg()` + `ossDialog()`. Catatan: ada komentar sisa di app.js "`Duplikat ossDialog dihapus`" dekat akhir file — dicek, itu memang cuma komentar penanda lama, tidak ada kode duplikat aktif untuk A4 ini. |
| 2026-09-13 | A5 | `js/core/loading-screen.js` | Loading screen progress bar dismiss logic, self-contained IIFE. |
| 2026-09-13 | A7 | `js/ui-misc/badges.js` | User konfirmasi pakai versi aktif (~baris lama 16150). Versi lama/dead code (~baris lama 3315) **dihapus permanen**, bukan dipindah. `index.html` diupdate: `badges.js` dimuat setelah `app.js`, sebelum `router.js`. |
| 2026-09-13 | B8 | `js/stats-engine/stats-core-advanced.js` (ditambah) | Dipindah sbg fungsi global, pola sama B1-B7: `efa`, `cfa`, `kmoLabel`, `jacobiEigen`, `varimaxRotate` — ditambahkan (append) ke `stats-core-advanced.js`. **Sesuai rencana**: duplikat kedua `matMul/matT/matDet/matInv` (signature array 2D, dipakai EFA/CFA) sekarang **menimpa** versi B3 (signature flat-array, dipakai `multipleReg`) di file yang sama — persis mereplikasi behavior asli app.js monolith, bukan bug baru. Tidak ada perubahan `index.html` (append ke file yang sudah dimuat). |
| 2026-09-13 | B7 | `js/stats-engine/stats-core-basic.js` (ditambah) | Dipindah sbg fungsi global, pola sama B1-B6: `lsdPosthoc`, `bonferroniPosthoc`, `holmBonferroni` — ditambahkan (append) ke `stats-core-basic.js` yang sudah ada dari B2/B5, tidak perlu tag `<script>` baru di `index.html`. **Temuan**: `holmBonferroni` dipanggil `SE.lsdPosthoc`/`SE.bonferroniPosthoc` ada di UI (pilihan post-hoc method ANOVA), tapi **`holmBonferroni` sendiri tidak dipanggil di mana pun** (tidak ada opsi 'holm' di UI) — sepertinya dead code / fitur belum di-wire ke UI. Belum disentuh, cuma dicatat. |
| 2026-09-13 | B27 (baru) | `js/stats-engine/stats-crosstab.js` | Fungsi `chiSquare` (Chi-Square Test of Independence untuk Crosstab) ternyata **tidak tercatat** di tabel roadmap manapun sejak awal (bukan bagian B1-B26 baseline). Ditambahkan sebagai row baru **B27** dan dipisah jadi file sendiri sesuai permintaan user, karena murni fungsi komputasi tanpa DOM (sama seperti B1-B4), bukan digabung ke `stats-nonparametric.js`. |
| 2026-09-13 | B6 | `js/stats-engine/stats-glm-hlm.js` (baru) + `js/stats-engine/stats-core-advanced.js` (ditambah) | Dipindah sbg fungsi global, pola sama B1-B4: `glmUnivariate`, `bonferroni` → file baru `stats-glm-hlm.js`; `partialCorr`, `canonicalCorr` → ditambahkan (append) ke `stats-core-advanced.js` yang sudah ada dari B3, sesuai pemetaan tabel B6 (GLM & korelasi target file beda). `index.html` diupdate: `stats-crosstab.js` dimuat setelah `stats-nonparametric.js`, `stats-glm-hlm.js` setelah itu — keduanya sebelum `app.js`. |
| 2026-09-13 | B4 | `js/stats-engine/stats-nonparametric.js` | Dipindah sbg fungsi global (bukan IIFE), pola sama B1-B3: `mwExactDist`, `mannWhitney`, `kruskalWallis`, `wilcoxon`, `cronbachAlpha`, `cohenKappa`, `fisherExact`. **Temuan baru**: `chiSquare` (chi-square untuk crosstab), yang lokasinya persis nempel setelah `fisherExact`, ternyata **tidak ada di tabel roadmap Bagian 3 manapun** (bukan bagian B1-B26 yang tercatat) — sengaja **tidak** diikutkan dan dibiarkan di app.js sampai ada keputusan mau dipetakan ke mana (kemungkinan perlu ditambah row baru di tabel B atau masuk section C sebagai bagian dari Crosstab UI). `index.html` diupdate: `stats-nonparametric.js` dimuat setelah `stats-core-advanced.js`, sebelum `app.js`. |
| 2026-09-13 | B3 | `js/stats-engine/stats-core-advanced.js` | Dipindah sbg fungsi global (bukan IIFE), pola sama B1/B2: `matMul`, `matT`, `matDet`, `matInv` (signature `matMul(A,m,n,B,p)` dkk, dipakai `multipleReg`), `multipleReg`, `repeatedMeasuresAnova`. Sesuai konfirmasi user, duplikat `matMul/matT/matDet/matInv` **dibiarkan apa adanya** — versi kedua (dipakai EFA/CFA/manovaProper, B8/B9) belum dipindah, nanti kalau dipindah ke file yang sama akan menimpa versi ini persis seperti behavior asli di app.js monolith (bukan bug baru). `index.html` diupdate: `stats-core-advanced.js` dimuat setelah `stats-core-basic.js`, sebelum `app.js`. |
| 2026-09-13 | HOTFIX (B1) | `app.js` | User lapor `SyntaxError: Identifier 'normCDF' has already been declared` yang bikin seluruh `app.js` gagal parse (efek domino: `missCount is not a function` dkk). Penyebab: sisa `function normCDF(z){...}` (dead code) di `app.js` yang lolos tidak terhapus waktu sesi B1, bentrok scope global dengan `normCDF` yang sudah ada di `js/stats-engine/stats-distributions.js`. **Dihapus permanen** dari `app.js` (bukan dipindah — sudah ada versi aktifnya di `stats-distributions.js`). Dicek dgn `node --check`, tidak ada syntax error lagi. |
| 2026-09-13 | B2, B5 | `js/stats-engine/stats-core-basic.js` | Dipindah sbg fungsi global (bukan IIFE), pola sama dgn B1: `sw`, `ksTest`, `levene`, `descriptive`, `tTest`, `onewayANOVA`, `qrangeCDF`, `tukeyHSD`, `qrangeCDF_inv`, `pearsonR`, `spearmanR`, `linearReg`, `oneSampleT`, `pairedTTest` (B2) + `f4`, `f1`, `pFmt`, `dLabel`, `effLabel`, `cohenDCI`, `eta2CI` (B5, versi yang ada di dalam IIFE `SE` — bukan versi duplikat lain di luar `SE`). Duplikat `matMul/matT/matDet/matInv` & `f1` (temuan B1) **dibiarkan apa adanya** sesuai konfirmasi user (2026-09-13) — belum diperbaiki, cuma dipindahkan. Ditemukan temuan baru: 2 deklarasi `pFmt` lain di luar `SE` (beda scope, dicatat di atas tabel B, belum diperbaiki). `index.html` diupdate: `stats-core-basic.js` dimuat setelah `stats-distributions.js`, sebelum `app.js`. |\n| 2026-09-13 | B1 | `js/stats-engine/stats-distributions.js` | Dipindah sbg fungsi global (bukan IIFE) — lihat catatan strategi di atas tabel B. Ditemukan & diselesaikan: (1) duplikat `fCDF` — versi lama (`betaInc`/`lnGamma`, dead code) **dihapus permanen** sesuai konfirmasi user, cuma versi aktif (Wilson-Hilferty/`incompleteBeta`) yang dipindah; (2) `fCDF` & `chiCDF` ternyata dipanggil di banyak tempat via `SE.fCDF`/`SE.chiCDF` tapi tidak pernah ada di `return {...}` objek `SE` (bug lama) — sesuai konfirmasi user, **ditambahkan** ke return list di app.js supaya `SE.fCDF`/`SE.chiCDF` benar-benar terisi. `index.html` diupdate: `stats-distributions.js` dimuat SEBELUM `app.js` (karena `return {fCDF, chiCDF,...}` di app.js butuh fungsi ini sudah ada). Ditemukan juga (belum diperbaiki, lihat catatan ⚠️ di atas tabel B): duplikat `matMul/matT/matDet/matInv` (signature beda, kemungkinan bug di Multiple Regression) dan duplikat `f1`. |
| 2026-09-15 | B13 | `js/stats-engine/stats-mediation-sem.js` (baru) | Dipindah sbg fungsi global: `computeMediation` (Baron-Kenny 4-step, Sobel test, Bootstrap CI untuk indirect effect, mendukung multi-mediator). Depends on global `data` (dataset aktif) dan namespace `SE.*` (`pearsonR`, `mean`, `std`, `tP`, `normCDF`, `f4`, `matInv`) — semua diakses lewat `SE.` bukan pemanggilan langsung, jadi aman dipindah ke file yang dimuat SEBELUM `app.js`: fungsi baru benar-benar jalan saat dipanggil user (runtime, setelah `SE` terbentuk), bukan saat file di-parse. File ini rencananya juga jadi tujuan B15 (Moderation) & B19 (SEM core) sesuai peta Bagian 2 — belum dikerjakan, baru B13 yang masuk. **Catatan**: rendering SVG path diagram (`svgMediationPath`) BUKAN bagian B13, tetap di `app.js`. `index.html` diupdate: `stats-mediation-sem.js` (baru) dimuat setelah `stats-metaanalysis.js`, sebelum `app.js`. |
| 2026-09-15 | B12 | `js/stats-engine/stats-metaanalysis.js` (baru) | Dipindah sbg fungsi global: `computeMetaAnalysis` (Fixed-Effect Inverse-Variance + Random-Effects DerSimonian-Laird, Cochran's Q, I², tau², data per-studi untuk Forest/Funnel Plot). Fungsi ini **self-contained** — semua helper (`f4`, `f3`, `pFmt`, `pChiSquare`, `normCDF2`) didefinisikan lokal di dalamnya, tidak pakai `isV`/`req`/`mean`/dll dari `stats-distributions.js`, jadi dipindah apa adanya tanpa perlu cek dependency. **Catatan penting**: rendering SVG-nya (`svgMetaForestPlot`, `svgMetaFunnelPlot`), yang lokasinya persis nempel setelah `computeMetaAnalysis` di app.js, **BELUM** ikut dipindah — itu rencananya masuk `js/charts/forest-funnel-plot.js` (bagian E, belum ada nomor row di tabel), dibiarkan dulu di `app.js`. `index.html` diupdate: `stats-metaanalysis.js` (baru) dimuat setelah `stats-glm-hlm.js`, sebelum `app.js`. |
| 2026-09-15 | B11 | `js/stats-engine/stats-core-basic.js` (ditambah) | Dipindah sbg fungsi global, pola sama B1-B10: `threewayANOVA` (Three-Way ANOVA Factorial A×B×C, Type I SS — 3 main effect + 3 interaksi two-way + 1 interaksi three-way + error), termasuk sistem sparse-cell 3-tier warning (empty cell = hard stop model singular, singleton cell = caution non-blocking). Helper privat `cellVals`, `cellMean`, `effect` tetap sebagai closure lokal di dalam fungsi (bukan dipindah terpisah) — tidak ada konflik nama dengan fungsi lain di file. Dependency (`isV`, `req`, `mean`, `fCDF`, `f4`, `pFmt`) semuanya sudah global dari B1/B2/B5. Tidak ada perubahan `index.html` (append ke file yang sudah dimuat sebelum `app.js`). |
| 2026-09-15 | B10 | `js/stats-engine/stats-core-basic.js` (ditambah) | Dipindah sbg fungsi global, pola sama B1-B9: `twowayANOVA` (Two-Way ANOVA Factorial 2×k, Type I SS — main effect A, main effect B, interaksi A×B, error). Fungsi ini self-contained, tidak ada helper privat yang perlu dipindah/di-rename. Dependency (`isV`, `req`, `mean`, `fCDF`, `f4`, `pFmt`) semuanya sudah global dari B1/B2/B5 sebelumnya, tidak ada konflik nama ditemukan. Tidak ada perubahan `index.html` (append ke file yang sudah dimuat sebelum `app.js`). |
| 2026-09-15 | B9 | `js/stats-engine/stats-core-advanced.js` (ditambah) | Dipindah sbg fungsi global (bukan IIFE), pola sama B3/B6/B8: `manovaProper` (Pillai, Wilks, Hotelling-Lawley, Roy, Box's M). **Temuan 1**: `manovaProper` punya 3 helper privat yang cuma dipakai olehnya sendiri — `chi2CDF`, `regularizedGammaP`, `regularizedGammaQ` (dicek: tidak dipakai di tempat lain dalam closure `SE` app.js, beda dari `SE.chi2CDF` yang di-fallback terpisah dgn implementasi sendiri di baris lain app.js) — ketiganya ikut dipindah bersama `manovaProper`. **Temuan 2 (setelah `stats-core-advanced.js` asli diupload user)**: file tujuan **sudah punya fungsi global `chi2CDF`** yang dipakai Bartlett's test (EFA, ~baris 589) & fit index CFA (~baris 775) — sumbernya bukan dari B9, kemungkinan sudah ada sejak B8/sebelumnya tapi tidak tercatat di changelog manapun. Kalau helper privat `manovaProper` (nama sama: `chi2CDF`) ditempel apa adanya, dia akan **menimpa** `chi2CDF` yang sudah dipakai Bartlett/CFA tsb (beda dari kasus duplikat `matMul` B8 yang memang sengaja meniru bug asli monolith). Untuk MENGHINDARI regresi ke fitur B8 yang sudah jalan, 3 helper privat itu **di-rename** (bukan cuma potong-tempel): `chi2CDF→manovaChi2CDF`, `regularizedGammaP→manovaRegGammaP`, `regularizedGammaQ→manovaRegGammaQ`, dan 1 titik pemanggilan internal di `manovaProper` (perhitungan p-value Box's M) diupdate mengikuti nama baru. **Nilai/rumus perhitungan `manovaProper` sendiri tidak berubah sama sekali** — murni rename identifier privat untuk hindari tabrakan scope global, bukan perubahan logic. Dependency lain (`isV`, `mean`, `req`, `matMul`/`matT`/`matDet`/`matInv` versi 2D — sudah ada di file ini dari B8 —, `jacobiEigen` — juga sudah ada dari B8 —, `f4`, `pFmt`, `lnG`) sudah global/tersedia, tidak perlu dipindah ulang. Tidak ada perubahan `index.html`. |
| 2026-09-15 | B14 | `js/stats-engine/stats-poweranalysis.js` (baru) | Dipindah sbg fungsi global (bukan IIFE): `normCDFpw`, `normInvpw`, `powerFromNcpT`, `powerFromNcpF`, `computePower`, `effectLabels2`. Semua dependency ke `SE.*` (`normCDF`, `normInv`, `fInv`, `fCritApprox`, `chiCritApprox`, `f4`) diakses lewat `SE.` di dalam function body, bukan di top-level, jadi aman dipindah ke file yang dimuat SEBELUM `app.js` (baru benar-benar jalan saat dipanggil user, setelah `SE` terbentuk). **Temuan penting — TIDAK ikut dipindah**: 3 blok `if(!SE.fInv){...}` / `if(!SE.fCritApprox){...}` / `if(!SE.chiCritApprox){...}` yang nempel persis setelah `effectLabels2` di app.js lama. Ini beda dari isi `computePower` — ini top-level statement yang langsung dieksekusi saat script diparse (bukan di dalam function), dan langsung menulis ke objek `SE` itu sendiri (bukan cuma membaca lewat `SE.`). Karena `var SE = (() => {...})();` baru terbentuk di awal eksekusi `app.js` (baris 4-543), kalau 3 blok ini dipindah ke file yang dimuat SEBELUM `app.js`, akan langsung `ReferenceError: SE is not defined` saat file itu diparse — beda kasus dengan B1 (`fCDF`/`chiCDF` yang butuh dimuat sebelum app.js) karena di sana yang butuh urutan itu adalah *pembaca* (`return {...}` di app.js), bukan *penulis* top-level ke `SE` dari file lain. Ketiganya **dibiarkan tetap di app.js**, di lokasi yang sama persis (tidak dipindah posisi), karena aman & tidak berubah perilaku — sudah tereksekusi sebelum user sempat memanggil `computePower` yang butuh `SE.fInv`/dst. Juga **tidak dipindah** (sesuai pola B12/B13, rencana masuk bagian charts/section E nanti): `svgPowerCurve`, `svgSensitivityCurve` (rendering SVG), dan `runPowerAnalysis` (UI wiring, depends `aState`/`addOutput`) — ketiganya tetap di `app.js`. **Temuan minor**: `powerFromNcpT` ternyata tidak dipanggil di mana pun (baik di app.js lama maupun setelah dipindah) — sepertinya dead code, dipindahkan apa adanya tanpa dihapus, cuma dicatat di sini. `index.html` diupdate: `stats-poweranalysis.js` (baru) dimuat setelah `stats-mediation-sem.js`, sebelum `app.js`. |
| 2026-09-15 | B15 | `js/stats-engine/stats-mediation-sem.js` (ditambah) | Dipindah sbg fungsi global, pola sama B1-B14: `computeModeration` (OLS dengan interaction term X×W + covariates, simple slopes W Mean±1SD, Johnson-Neyman region of significance). Ditambahkan (append) ke `stats-mediation-sem.js` yang sudah ada dari B13 (`computeMediation`) — sesuai rencana peta Bagian 2 (file target sama untuk B13/B15/B19). Dependency (`data` global, `SE.isV`, `SE.mean`, `SE.std`, `SE.matInv`, `SE.fP`, `SE.tP`, `SE.normInv`, `SE.validNums`, `SE.f4`, `SE.pFmt`) semua diakses lewat `SE.` di dalam function body, aman dipindah ke file pre-app.js (pola sama B13). Helper privat `olsAug`/`matInvLocal` di dalam `computeModeration` tetap closure lokal (tidak dipindah terpisah) — dicek, namanya kebetulan sama dengan `matInvLocal` milik `computeMediation` (juga closure lokal di fungsinya sendiri), tapi karena keduanya scoped di dalam function masing-masing (bukan global), **tidak ada konflik/tabrakan** — dua-duanya aman hidup berdampingan di file yang sama. **Tidak ikut dipindah** (pola sama B12/B13/B14, rencana masuk bagian charts/section E nanti): `svgModerationPlot`, `svgSimpleSlopesPlot`, `svgJohnsonNeymanPlot` (rendering SVG) dan `runModeration` (UI wiring, depends `aState`/`addOutput`) — ketiganya tetap di `app.js`. Tidak ada perubahan `index.html` (append ke file yang sudah dimuat sebelum `app.js` sejak B13). |
| 2026-09-15 | B16 | `js/stats-engine/stats-imputation.js` (baru) | Dipindah sbg fungsi global: `computeMICE` (MICE — Multivariate Imputation by Chained Equations, metode PMM & Normal, pooling lewat Rubin's Rules). Dependency: `vars` (global metadata variabel) dan `isMiss` (global helper cek missing, `var isMiss=v=>...` didefinisikan di awal app.js baris 803) — dua-duanya diakses langsung by-name (bukan lewat `SE.`), tapi tetap aman dipindah ke file pre-app.js karena hanya dipanggil di dalam body `computeMICE` (runtime, setelah `vars`/`isMiss` terbentuk saat app.js jalan), bukan top-level. Dependency lain (`SE.matInv`, `SE.mean`, `SE.std`, `SE.validNums`, `SE.f4`) juga lewat `SE.`, pola sama B1-B15. Helper privat `olsPredict`, `pmm`, `normalImpute` tetap closure lokal di dalam `computeMICE`, tidak ada konflik nama global. **Tidak ikut dipindah**: `toggleMIVar`, `runMultipleImputation` (UI wiring, depends `aState`/`renderASub`/`addOutput`/`updateBadges`/`showToast`) — tetap di `app.js`. `index.html` diupdate: `stats-imputation.js` (baru) dimuat setelah `stats-poweranalysis.js`, sebelum `app.js`. |
| 2026-09-15 | B17 | `js/stats-engine/stats-roc.js` (baru) | Dipindah sbg fungsi global: `computeROC` (kurva TPR/FPR per threshold, AUC trapezoidal, 95% CI Hanley-McNeil, titik optimal Youden index) dan `deLongTest` (test pembanding 2 AUC untuk ROC Compare). Dependency: `isMiss` (global by-name, sama pola B16) dan `SE.*` (`isV`, `normInv`, `normCDF`, `f4`, `pFmt`) lewat `SE.` — semua hanya diakses di dalam function body (runtime), aman dipindah ke file pre-app.js. **Tidak ikut dipindah** (pola sama B12-B16, rencana masuk bagian charts/section E nanti): `svgROC`, `svgROCCompare` (rendering SVG) dan `toggleROCCompare`, `runROC` (UI wiring, depends `aState`/`addOutput`) — tetap di `app.js`. `index.html` diupdate: `stats-roc.js` (baru) dimuat setelah `stats-imputation.js`, sebelum `app.js`. |
| 2026-09-15 | B18 | `js/stats-engine/stats-survival.js` (baru) | Dipindah sbg fungsi global: `computeKaplanMeier` (Greenwood SE, 95% CI, median survival, Log-Rank Mantel-Haenszel multi-grup) dan `computeCoxRegression` (Newton-Raphson partial likelihood, HR + 95% CI, Harrell's C, LR test). Dependency: `isMiss` (global by-name) dan `SE.*` (`isV`, `mean`, `std`, `matInv`, `normInv`, `normCDF`, `f4`, `pFmt`, `chi2CDF`) lewat `SE.` — semua hanya diakses di dalam function body (runtime), aman dipindah. **Temuan penting — TIDAK ikut dipindah**: blok `if(!SE.chi2CDF){...}` beserta helper privat `lnGammaSimple` yang dipakainya. Sama persis dengan temuan B14 (`SE.fInv`/`fCritApprox`/`chiCritApprox`) — top-level write ke `SE` yang butuh `SE` sudah terbentuk (baru ada setelah app.js mulai jalan), jadi kalau dipindah ke file pre-app.js akan `ReferenceError: SE is not defined`. Keduanya dibiarkan tetap di app.js, posisi sama persis (`chi2CDF` ternyata **tidak pernah ada** di `return {...}` object SE utama — cuma di-polyfill lewat blok ini, beda dari `fCDF`/`chiCDF` yang sudah ada dari awal). **Temuan lain**: `svgConvergence` (baris di antara Cox regression dan polyfill chi2CDF) ternyata bukan bagian Survival Analysis — isinya me-render `pooled[i].convergence` yaitu struktur data dari `computeMICE` (B16, Multiple Imputation), sepertinya cuma nempel lokasinya di app.js karena urutan penulisan kode lama, bukan salah taruh oleh sesi split ini. Tidak dipindahkan (tetap SVG, tetap di app.js), cuma dicatat lokasinya sedikit membingungkan untuk sesi berikutnya. **Tidak ikut dipindah** (pola sama B12-B17): `svgKaplanMeier`, `svgForestPlot` (rendering SVG — nama beda dari `svgMetaForestPlot` milik B12, tidak ada konflik) dan `toggleSurvCov`, `runSurvival`, `runCoxRegression` (UI wiring) — tetap di `app.js`. `index.html` diupdate: `stats-survival.js` (baru) dimuat setelah `stats-roc.js`, sebelum `app.js`. |
| 2026-09-15 | B19 | `js/stats-engine/stats-mediation-sem.js` (ditambah) | Dipindah sbg fungsi global, pola sama B1-B18: `computeSEM` (measurement model lewat `SE.cfa` per konstruk, structural path OLS terstandardisasi + indirect effect, fit indices CFI/TLI/RMSEA(+CI)/SRMR/chi-square & label overall fit) dan `generateLavaanSyntax` (generator syntax R lavaan: measurement `=~` + structural `~`). Ikut dipindah juga 3 helper **top-level** yang dipakai `computeSEM`: `logDet`, `traceRinvImpl`, `pChiSquare` — dicek dengan grep, ketiganya **hanya** dipanggil dari dalam `computeSEM` (masing-masing cuma 1 titik deklarasi di app.js, tidak ada duplikat global lain), jadi aman ikut pindah. **Catatan `pChiSquare`**: nama ini sama dengan helper lokal di dalam `computeMetaAnalysis` (B12, `stats-metaanalysis.js`), tapi yang di B12 adalah closure lokal di dalam fungsinya sendiri — bukan global — jadi **tidak ada tabrakan scope**, beda kasus dengan `chi2CDF` di B9 yang perlu di-rename. Tidak ada identifier yang di-rename di B19, murni potong-tempel. Dependency (`data` global, `SE.cfa`, `SE.f4`, `normCDF` dari `stats-distributions.js`) semua diakses di dalam body fungsi (runtime), aman di file pre-`app.js` — pola sama B13/B15. Helper `mean`, `std`, `corr` di dalam `computeSEM` tetap closure lokal (tidak dibuat global, menghindari tabrakan dengan `SE.mean`/`SE.std`). **Tidak ikut dipindah** (pola sama B12–B18): `svgSEMDiagram` (rendering SVG path diagram → rencana `js/charts/sem-mediation-diagram.js`, bagian E7) dan semua UI wiring (`semAddLatent`, `semRemoveLatent`, `semRenameLatent`, `semToggleIndicator`, `semAddPath`, `semRemovePath`, `runSEM`) — tetap di `app.js`. Tidak ada perubahan `index.html` (append ke file yang sudah dimuat sebelum `app.js` sejak B13). |
| 2026-09-15 | B20 | `js/stats-engine/stats-bayesian.js` (baru) | Dipindah: `SE.bayesTTest` (Bayesian Independent T-Test, Cauchy prior pada effect size, Rouder et al. 2009), `SE.bayesPearson` (Bayesian Correlation, JZS prior, Ly et al. 2016 approximation), `SE.bayesPosteriorNormal` (Bayesian Posterior, Normal-Inverse-Gamma conjugate). **Beda pola dari B1-B19**: seluruh blok ini adalah 1 IIFE top-level yang langsung menulis `SE.bayesTTest = function(){...}` dkk **saat file di-parse** (bukan cuma fungsi global yang membaca `SE.*` di dalam body saat dipanggil user) — persis kasus yang sama dengan polyfill `SE.fInv`/`SE.chi2CDF` di temuan B14/B18, yang butuh `SE` sudah terbentuk lebih dulu. Karena itu file **tidak** dimuat sebelum `app.js` seperti file stats-engine lain, melainkan **setelah** `app.js` (pola sama `js/ui-misc/badges.js` di A7). Dicek dengan grep: semua 3 titik pemanggilan `SE.bayesTTest`/`SE.bayesPearson`/`SE.bayesPosteriorNormal` di app.js (preview UI & `runBayes*`) ada di dalam function body (runtime, dipicu user), bukan top-level, jadi aman file-nya dimuat setelah app.js. Helper privat closure lokal di dalam IIFE (`_lnG`, `_req`, dst — mirror internal SE) tetap ikut pindah bersama IIFE-nya, tidak diubah. **Tidak ikut dipindah** (pola sama B12-B19): `svgBayesPosterior` (rendering SVG prior-vs-posterior → rencana bagian charts/section E nanti) dan UI wiring `runBayesTTest`/`runBayesCorr`/`runBayesPosterior` (nama pasti dicek ulang saat bagian I/UI-misc dikerjakan) — tetap di `app.js`. `index.html` diupdate: `stats-bayesian.js` ditambahkan SETELAH tag `<script src="app.js">`, SEBELUM `js/ui-misc/badges.js`. |
| 2026-09-15 | B21 | `js/stats-engine/stats-discriminant-cluster.js` (baru) | Dipindah sbg fungsi global: `computeLDA` (Linear Discriminant Analysis — canonical discriminant functions via eigen-decomposition, standardized coefficients, structure matrix, Wilks' Lambda + p-value, klasifikasi nearest centroid + confusion table, discriminant scores per kasus). Dependency: `SE.chi2CDF` diakses lewat `SE.` di dalam function body (runtime), aman dipindah ke file pre-`app.js`, pola sama B13/B15/B19/B21 (bukan pola B20 yang menulis top-level ke `SE`). **Temuan (belum diperbaiki, cuma dicatat)**: baris `wilksP=pFmt(1-SE.chi2CDF?SE.chi2CDF(chiSq,dfW_chi):NaN)` kemungkinan bug operator-precedence — `1-SE.chi2CDF` (function dikurangi angka) selalu `NaN`, jadi kondisi ternary selalu falsy dan `wilksP` kemungkinan **selalu** `pFmt(NaN)='—'`, tidak pernah menghitung p-value Wilks' Lambda yang sebenarnya. Sama kasusnya dengan temuan `matMul` (B1) & `saveSession` (H1/H2) — dibiarkan apa adanya sampai ada konfirmasi user, tidak diubah saat potong-tempel. **Tidak ikut dipindah** (pola sama B12-B19): `svgDiscriminantPlot` (rendering SVG scatter 2 discriminant function pertama → rencana `js/charts/`, belum ada nomor row di tabel E) dan `runDiscriminant` (UI wiring, depends `aState`/`addOutput`/`tryStats`/`showToast`) — tetap di `app.js`. `index.html` diupdate: `stats-discriminant-cluster.js` (baru) dimuat setelah `stats-survival.js`, sebelum `app.js`. File ini rencananya juga jadi tujuan B22 (Cluster Analysis) sesuai peta Bagian 2 — belum dikerjakan, baru B21 yang masuk. |
| 2026-09-15 | B22 | `js/stats-engine/stats-discriminant-cluster.js` (ditambah) | Dipindah sbg fungsi global, pola sama B1-B21: `computeKMeans` (Lloyd's algorithm dengan multiple random init, WSS/BSS, silhouette, ANOVA per variabel, data elbow chart) dan `computeHierarchical` (Agglomerative Hierarchical Clustering — single/complete/average/ward linkage, dendrogram merge history, cut di k cluster, silhouette, ANOVA). Ditambahkan (append) ke `stats-discriminant-cluster.js` yang sudah ada dari B21 (`computeLDA`), sesuai rencana peta Bagian 2 (file target sama). **Kedua fungsi murni self-contained** — dicek dengan grep, tidak ada dependency ke `SE.*`/`data`/`vars`/`aState`/DOM sama sekali (semua helper `f4`/`isV` closure lokal), jadi dipindah apa adanya tanpa perlu cek urutan muat sama sekali. **Tidak ikut dipindah** (pola sama B12-B21): `svgClusterPlot`, `svgElbow`, `svgDendrogram` (rendering SVG → rencana `js/charts/`, belum ada nomor row di tabel E) dan `runCluster` (UI wiring, depends `aState`/`data`/`vars`/`addOutput`) — tetap di `app.js`. Tidak ada perubahan `index.html` (append ke file yang sudah dimuat sebelum `app.js` sejak B21). |
| 2026-09-15 | B23, C3 | `js/data/weight-cases.js` (baru) | **Ternyata B23 dan C3 adalah baris duplikat yang menunjuk ke kode yang SAMA PERSIS** — dicek di app.js hanya ada 1 pasang fungsi `getNEff()`/`getWeightedRows()` (bukan 2 pasang terpisah di 2 lokasi baseline berbeda seperti tersirat di tabel), jadi dipisah 1x saja dan kedua row ditandai selesai. Dipindah sbg fungsi global: `getNEff` (hitung N efektif ΣW dari variabel bobot aktif tanpa mengubah data fisik) dan `getWeightedRows` (hasilkan array virtual berbobot untuk perhitungan statistik). Dependency `aState.wcActive`/`aState.wcVar`/`data` semua dibaca di dalam function body (runtime), aman dipindah ke file pre-`app.js`, pola sama B13/B15/B19/B21. **Temuan penting (belum diperbaiki, cuma dicatat)**: `getWeightedRows()` dicek dengan grep di SELURUH app.js — ternyata **tidak dipanggil di mana pun** kecuali disebut di komentar dokumentasi. Fitur Weight Cases yang aktif sekarang cuma memakai `getNEff()` untuk badge "N efektif"; tidak ada satupun fungsi analisis statistik (t-test, ANOVA, regresi, dll) yang benar-benar memanggil `getWeightedRows()` untuk menerapkan weighting ke perhitungannya. Kemungkinan fitur "Weight Cases" baru menghitung N efektif secara kosmetik, belum benar-benar mempengaruhi hasil analisis manapun — sepertinya belum selesai diwire ke stats engine. Mirip kasus `holmBonferroni` dead code di B7, dibiarkan apa adanya sampai ada konfirmasi user. **Tidak ikut dipindah** (UI wiring, depends `document.getElementById`/`updateBadges`/`showToast`/`renderASub`): `runWeightCases`, `clearWeightCases` — tetap di `app.js`. `index.html` diupdate: `weight-cases.js` (baru, kategori "3. Data layer") dimuat setelah `stats-discriminant-cluster.js`, sebelum `app.js`. |
| 2026-09-15 | B24 (sebagian) | `js/stats-engine/_B24_append_to_stats-core-advanced.js` (fragmen, untuk digabung ke `stats-core-advanced.js` yang tidak ikut diupload sesi ini) | Dipindah sbg fungsi global, pola sama B1-B23: `logisticReg` (IRLS binary + multinomial logistic regression, koefisien standar & odds ratio, Cox & Snell / Nagelkerke R², LR chi-square test, classification accuracy). **Hanya bagian computation** dari row B24 di tabel — bagian "Hierarchical Regression toggle helper" (`toggleHrBlock`) SENGAJA TIDAK ikut dipindah, lihat catatan ⚠️ di atas tabel B untuk alasan lengkap (konsisten dengan keputusan B19 soal UI-state helper). Dependency `f4`/`f1`/`pFmt` dibaca lewat scope-fallback ke versi global (bukan `SE.` eksplisit) di dalam function body, aman dipindah ke file pre-`app.js`. **Temuan**: `function f1` lokal yang sebelumnya nempel di scope yang sama dengan `logisticReg` (duplikat isi sama dari temuan B1) sekarang jadi benar-benar dead code karena satu-satunya pemakainya sudah pindah — dibiarkan apa adanya, tunggu konfirmasi user. Return list `SE.logisticReg` di `app.js` (baris `return{...logisticReg, poissonReg, negbinReg...}`) TIDAK diubah — tetap jalan lewat JS scope-fallback ke fungsi global baru, pola sama semua fungsi B1-B23 lain di return list yang sama. `index.html` TIDAK diubah — menunggu file dasar `stats-core-advanced.js` diupload user untuk digabung (sama seperti kasus B19). |
| 2026-09-18 | C1 | `js/data/dataset-manager.js` (baru) | Dipindah sbg var/fungsi global, pola sama B13/B15/B19/B21/B23: `var datasets`/`activeDatasetId` (state array dataset), `var data`/`vars`/`outputs` (working globals yang selalu nunjuk ke dataset aktif — dipindah apa adanya, TIDAK di-refactor jadi getter/setter), `getActiveDs`, `_dsSyncSave`, `_dsSyncLoad`, `switchDataset`, `addDataset`, `deleteDataset`, `renameDataset`, `showAddDatasetModal`, `renderDsSidebar`. Dicek grep di seluruh `app.js`: tidak ada duplikat deklarasi (`var datasets`/`var data`/`var vars`/`var outputs` masing-masing cuma 1 titik), dan tidak ada pemanggilan top-level (parse-time) terhadap fungsi manapun di blok ini — semua pemanggilan (`renderDsSidebar()`, `switchDataset(...)`, dst) ada di dalam function body lain di `app.js`, dipicu interaksi user, jadi aman lewat scope-fallback ke global baru tanpa ubah call-site. Dependency keluar (`ossDialog`, `showToast`, `switchTab`, `updateBadges`, `escDlg`, `escHtml`, `escHtmlAttr`) semua diakses di dalam function body (runtime), bukan ditulis top-level ke objek lain — aman dipindah ke file pre-`app.js`, bukan pola B20 (yang butuh dimuat setelah `app.js`). **Diverifikasi via Node `vm` module** (di luar browser, dengan stub `document.getElementById`/`ossDialog`/`showToast`/`switchTab`/`updateBadges`): `addDataset` menambah dataset baru & mengosongkan `data`/`vars`/`outputs` global sambil menyimpan state dataset lama dengan benar; `switchDataset` mengembalikan isi dataset yang benar; `deleteDataset` menolak menghapus dataset terakhir (guard `datasets.length<=1` jalan, `showToast` error terpanggil) dan berhasil menghapus dataset non-aktif; `renameDataset` mengubah `ds.name`; `renderDsSidebar()` jalan tanpa exception. Semua skenario lulus tanpa error. `index.html` diupdate: `dataset-manager.js` (baru, kategori "3. Data layer") dimuat sebelum `weight-cases.js`, sebelum `app.js` — karena `weight-cases.js` (`getNEff`/`getWeightedRows`) membaca `data` global di dalam function body (runtime, bukan top-level), urutan relatif terhadap `dataset-manager.js` sebenarnya tidak kritikal, tapi ditaruh lebih dulu supaya sesuai urutan logis (deklarasi state dataset sebelum konsumennya). `app.js` lolos `node --check` sebelum & sesudah pemotongan (12.603 → 12.479 baris). |

---

## 7. RINGKASAN PROGRESS

**Total item di roadmap: 60+ bagian (A1–I6) + B27 (temuan baru)**
**Sudah dipisah: 36 (A1–A7, B1–B23, B25, B26, B24-sebagian, C3, B27, C1)**
**Progress: ~58%**

**Section A (Core) SELESAI 100%.** Section B (Statistics Engine) jalan terus — B1-B23, B25, B26, B27 selesai; B24 SEBAGIAN (cuma `logisticReg`, `toggleHrBlock` sengaja ditinggal, lihat catatan). Section C (Data Management) sudah mulai — C3 selesai (digabung dengan B23). Duplikat `matMul` aktif di `stats-core-advanced.js` (2 versi, versi EFA/CFA/MANOVA menang, sesuai rencana). Rendering SVG (Forest/Funnel Plot meta-analysis, Mediation Path Diagram, Power/Sensitivity Curve, Moderation/Simple-Slopes/Johnson-Neyman Plot, ROC/ROC Compare, Kaplan-Meier/Forest Plot Cox, Convergence Plot MI, SEM Path Diagram, Time Series Plot/Correlogram/Decomposition Chart) masih di `app.js`, belum ikut dipisah, ditunggu sampai bagian charts dikerjakan. 4 blok polyfill top-level `SE.fInv`/`SE.fCritApprox`/`SE.chiCritApprox`/`SE.chi2CDF` sengaja dibiarkan di `app.js` (lihat catatan B14 & B18 — tidak bisa dipindah ke file pre-app.js karena top-level write ke `SE`); `lnGammaSimple` (dependency `SE.chi2CDF`) ikut tetap di app.js. `stats-mediation-sem.js` sekarang lengkap sesuai rencana peta Bagian 2: `computeMediation` (B13) + `computeModeration` (B15) + `computeSEM`/`generateLavaanSyntax` (B19) — digabung jadi 1 file utuh oleh user di sesi ini (sebelumnya sempat berupa 2 file terpisah karena `stats-mediation-sem.js` hasil B13/B15 tidak ikut diupload saat B19). `stats-bayesian.js` (B20) adalah file stats-engine PERTAMA yang dimuat SETELAH `app.js` bukan sebelum — lihat catatan B20 kalau ada file `stats-*` lain nanti yang ternyata juga menulis langsung ke `SE` di top-level (bukan cuma di dalam function). `stats-discriminant-cluster.js` sekarang lengkap sesuai rencana peta Bagian 2: `computeLDA` (B21) + `computeKMeans`/`computeHierarchical` (B22). `stats-glm-hlm.js` (B25) sekarang juga lengkap sesuai rencana peta Bagian 2, ditambah `poissonReg`/`negbinReg`/`solveLinear`/`invertMatrix`/`computeHLMBasics`. `stats-timeseries.js` (B26, baru) berisi `tsACF`/`tsPACF`/`tsDiff`/`tsARIMA`/`tsDecomp` — bug `SE.vari` yang bikin mode Decomposition-nya gagal diam-diam sudah **diperbaiki** (lihat Bagian 8). **Section B tersisa (belum dikerjakan penuh): B24 sisa `toggleHrBlock` (sengaja tidak dipindah, tetap di app.js — lihat catatan).** File dasar `js/stats-engine/stats-core-advanced.js` BELUM ikut diupload user di sesi manapun sejauh ini — potongan B24 (`logisticReg`) masih berupa fragmen terpisah `_B24_append_to_stats-core-advanced.js` yang perlu digabung manual oleh user (sama kasusnya dengan B19 dulu sebelum digabung). Section B (Statistics Engine) praktis SELESAI kecuali B24 `toggleHrBlock` yang sengaja ditinggal. **Section C (Data Management) — C1 (Multi-Dataset System) SELESAI (2026-09-18)**, dipindah ke `js/data/dataset-manager.js` bersama C3 (Weight helpers, sudah selesai sejak B23). Sisa Section C yang belum dikerjakan: C2 (Analyze sub-tab state helper), C4 (HTML Helpers umum), C5 (Custom Select), C6 (Data View), C7 (Spreadsheet Mode), C8 (Variable View), C9 (Sliding pill indicator), C10 (Transform/Compute/Recode/Filter), C11 (Missing Data Analysis) — lanjut ke salah satu bagian ini kalau user mau lanjut.

*(Update angka ini setiap kali ada perubahan status di Bagian 3.)*

---

## 8. TEMUAN — STATUS PERBAIKAN (2026-09-15, sesi lanjutan)

User minta semua temuan yang tercatat di dokumen ini diperbaiki. Repo asli
(`bayuharlanpriangga/OSS` di GitHub) di-clone langsung untuk verifikasi —
setiap klaim di bawah dicek ulang terhadap kode aktual sebelum diperbaiki
(beberapa klaim lama ternyata sudah tidak akurat, lihat catatan).

| Temuan | Status | Keterangan |
|---|---|---|
| **B1** — `matMul`/`matT`/`matDet`/`matInv` tabrakan nama (flat vs 2D-array) | ✅ **DIPERBAIKI** | Versi flat-array (dipakai `multipleReg`) di-rename jadi `matMulFlat`/`matTFlat`/`matDetFlat`/`matInvFlat` di `stats-core-advanced.js`. Versi 2D-array (EFA/CFA/MANOVA/canonicalCorr) tetap `matMul`/`matT`/`matDet`/`matInv`. Diverifikasi dengan test: `multipleReg` sekarang balik koefisien yang benar (sebelumnya rusak karena signature tertimpa); EFA tetap jalan normal (tidak ada regresi). |
| **(baru, ditemukan saat perbaiki B1)** — `SE.matInv`/`SE.matMul` selalu `undefined` di luar `stats-core-advanced.js` | ✅ **DIPERBAIKI** | `matMul`/`matT`/`matDet`/`matInv`/`matMulFlat`/`matTFlat`/`matDetFlat`/`matInvFlat` tidak pernah dimasukkan ke `return {...}` objek `SE` di `app.js` — jadi `SE.matInv(...)` di 3 file lain selalu gagal diam-diam. **Dampak nyata**: MICE imputation (`stats-imputation.js`) selalu fallback ke mean sederhana (bukan regresi), dan Cox regression (`stats-survival.js`) SE koefisiennya di-hardcode 0.1 (Newton-Raphson tidak pernah update). Mediation/Moderation (`stats-mediation-sem.js`) TIDAK terdampak — sudah ada fallback lokal `matInvLocal` yang benar. Sudah ditambahkan ke `return {...}` di `app.js`, dan 3 file pemanggil sudah diarahkan ke nama yang benar (`matInv` untuk 2D, `matInvFlat` untuk flat). |
| **B21** — `wilksP` operator-precedence bug di `stats-discriminant-cluster.js` | ✅ **DIPERBAIKI** | `pFmt(1-SE.chi2CDF?SE.chi2CDF(...):NaN)` → `pFmt(SE.chi2CDF?1-SE.chi2CDF(...):NaN)`. Dampak sebenarnya kecil (cuma nilai fallback awal, ada perhitungan ulang di try/catch di bawahnya yang sudah benar). |
| **H1/H2** — `saveSession`/`loadSession`/`exportDataCSV`/`generateAPAReport` duplikat | ✅ **DIPERBAIKI** | Blok pertama (versi lama single-dataset) dikonfirmasi 100% dead code (ketimpa deklarasi kedua) dan dihapus. Tidak ada perubahan perilaku — versi aktif (multi-dataset-aware) persis sama seperti sebelumnya. |
| **B7** — `holmBonferroni` dead code, tidak ada di UI post-hoc ANOVA | ✅ **DIPERBAIKI** | Ditambah wrapper `holmBonferroniPosthoc(groups)` di `stats-core-basic.js`, opsi "Holm-Bonferroni" ditambahkan ke dropdown post-hoc ANOVA di `app.js` (`_cR['av-ph']`), wiring `runANOVA()`, dan label render tabel hasil. Diverifikasi: hasil Holm step-down lebih powerful dari Bonferroni flat pada kasus p-value borderline, sesuai teori. |
| **B23/C3** — `getWeightedRows()` (Weight Cases) tidak pernah dipanggil fungsi statistik manapun | ⚠️ **BELUM DIPERBAIKI — butuh keputusan produk, bukan sekadar bug fix** | Ini bukan bug satu-baris: mewiring bobot secara benar ke SEMUA fungsi analisis (t-test, ANOVA, regresi, chi-square, dll — puluhan fungsi lintas banyak file) adalah pekerjaan fitur besar, bukan patch kecil, dan berisiko tinggi kalau ditebak sembarangan (bisa bikin hasil analisis lain jadi salah kalau logic weighting keliru). **Belum disentuh** — disarankan didiskusikan dulu: fungsi statistik mana saja yang perlu mendukung Weight Cases, dan behavior yang diharapkan untuk N/df/SE saat weighted. |
| **"f1 duplikat" (disebut di catatan B24)** | ✅ **DIVERIFIKASI BUKAN BUG** | Klaim lama "f1 lokal di app.js jadi dead code" TERNYATA SALAH — dicek ulang, `SE.f1` (versi lokal, return '—' untuk non-finite) masih aktif dipakai di rendering confusion matrix logistic regression (`app.js`). Berbeda dari `f1` global (`stats-core-basic.js`, dipakai internal perhitungan seperti `pairedTTest`/`logisticReg`). Dua-duanya legitimate, diakses lewat path berbeda (`SE.f1` vs `f1` langsung), tidak pernah tabrakan. Tidak ada perubahan. |
| **pFmt duplikat (2 lokasi)** | ✅ **DIVERIFIKASI BUKAN BUG** | `stats-core-basic.js` (global) dan `stats-metaanalysis.js` (lokal, closure-scoped) — tidak pernah tabrakan karena scope beda. Tidak ada perubahan. |
| **B14/B18 polyfill top-level** (`SE.fInv`/`SE.chi2CDF` dkk di app.js) | ➖ **BUKAN BUG, TIDAK DISENTUH** | Ini keputusan arsitektur yang sudah benar (top-level write ke `SE` tidak bisa dipindah ke file pre-app.js) — bukan temuan yang perlu "diperbaiki". |
| **B26** — `SE.vari` tidak pernah masuk `return {...}` objek `SE`, Time Series Decomposition selalu gagal diam-diam | ✅ **DIPERBAIKI (2026-09-16)** | `vari` ditambahkan ke `return {...}` di `app.js` (baris `validNums, isV, mean, std, vari, quantile, ...`), pola sama persis dengan fix `fCDF`/`chiCDF` (B1) dan `matInv`/`matMul` (temuan sesi ini). Diverifikasi via Node `vm` module: `SE.vari(Y)` sekarang mengembalikan nilai identik dengan implementasi manual (bukan lagi `undefined`), dan `tsDecomp` (dipakai preview & tombol "Run" Time Series) sekarang jalan normal untuk mode additive maupun multiplicative tanpa perlu workaround apa pun. Mode ARIMA (tidak pernah pakai `SE.vari`) dicek tetap sama seperti sebelumnya, tidak ada regresi. |
| **B25 (temuan susulan)** — `negbinReg`: golden-section search θ tanpa batas atas + IRLS tanpa step-halving (akar masalah sesungguhnya, ditemukan pas verifikasi fix θ) | ✅ **DIPERBAIKI (2026-09-17)** | Detail lengkap di Bagian 10. Ringkas: θ di-clamp ke `[1e-3, 1e4]` (dulu tanpa batas atas → dobel terus jadi ~2⁵⁰), DAN loop IRLS ditambah step-halving supaya Newton step tidak overshoot jadi `NaN` sebelum pencarian θ sempat jalan (akar masalah sesungguhnya — batasi θ saja TIDAK cukup, dibuktikan lewat ~10 skenario test yang semuanya masih "N/A" tanpa fix IRLS ini). Diverifikasi konvergen & tidak `NaN` di data overdispersed maupun Poisson murni, diulang beberapa kali dengan data random berbeda. |

## 9. B25 — SPLIT SELESAI (2026-09-16)

`poissonReg`, `negbinReg`, helper `solveLinear`/`invertMatrix` (sebelumnya
di dalam IIFE `var SE=(()=>{...})()` di `app.js`), dan `computeHLMBasics`
(sebelumnya nested di dalam function render sub-tab HLM) sudah dipindah ke
`js/stats-engine/stats-glm-hlm.js`, mengikuti pola B1-B24 (dipindah keluar
apa adanya jadi fungsi global, dipanggil balik dari `app.js` tanpa ubah
call-site). Tidak ada tabrakan nama — `solveLinear`/`invertMatrix` beda
dari `matMulFlat`/`matInvFlat` (B1) dan dipakai khusus oleh 2 fungsi ini.

Diverifikasi via Node `vm` module (di luar browser, load urutan file
persis seperti `index.html`):
- `poissonReg` — koefisien pulih akurat pada data sintetis (`x`-coef 0.30
  vs true 0.30, intercept 0.51 vs true 0.50), `converged:true`. ✅
- `computeHLMBasics` — ICC & variance partitioning terhitung benar untuk
  10 grup × 15 observasi. ✅
- `negbinReg` — bug θ tanpa batas atas yang dicatat di sesi split ini
  **✅ SUDAH DIPERBAIKI (2026-09-17)**, lihat Bagian 8 baris terbaru dan
  detail lengkap di bawah (bukan cuma θ — ternyata ada 1 lapis bug lagi
  yang jadi akar masalah sesungguhnya, ditemukan pas verifikasi fix θ).

**File yang berubah**: `app.js`, `js/stats-engine/stats-core-advanced.js`,
`js/stats-engine/stats-core-basic.js`, `js/stats-engine/stats-discriminant-cluster.js`,
`js/stats-engine/stats-imputation.js`, `js/stats-engine/stats-survival.js`,
`js/stats-engine/stats-mediation-sem.js`. Semua perubahan lulus `node --check`
(syntax) dan diverifikasi lewat test langsung (Multiple Regression, EFA,
Holm-Bonferroni) di luar browser menggunakan Node `vm` module.

## 10. `negbinReg` — FIX SELESAI (2026-09-17)

Bug yang dicatat di Bagian 9 (θ tidak ada batas atas) **benar ada**, tapi
ternyata cuma **gejala**. Trace lebih dalam pakai debug log (Node `vm`,
di luar browser) ketemu akar masalah sesungguhnya: loop IRLS
(`for(var iter=0;iter<30;...)`, sebelum pencarian θ pun mulai) tidak
punya step-halving/damping. Dengan θ awal ditebak (1.0) dan beta awal 0,
weight NB2 (`mu/(1+mu/θ)`) sering jauh lebih kecil dari weight Poisson
biasa (`mu`) — bikin matriks informasi (`X'WX`) "kurang mengerem" Newton
step, beta lompat jauh (pernah sampai ribuan) dalam 2-3 iterasi lalu
meledak jadi `NaN`, **sebelum** pencarian θ sempat jalan. Begitu beta
`NaN`, log-likelihood `NaN` untuk semua kandidat θ → golden-section
search selalu ambil cabang yang sama → θ dobel terus tiap outer loop →
persis pola `2⁵⁰` yang sudah didiagnosis sebelumnya. Dibuktikan lewat
test: pasang batas atas θ saja (tanpa benahi IRLS) **tidak cukup** —
semua koefisien tetap tampil "N/A" di ~10 skenario data sintetis yang
dicoba (termasuk kasus paling "jinak": intercept-only, efek nyaris nol,
mu hampir konstan).

**2 perubahan di `negbinReg` (`js/stats-engine/stats-glm-hlm.js`)**:
1. **Batas θ**: `THETA_MAX=1e4`, `THETA_MIN=1e-3`. Golden-section search
   dan hasil akhir tiap outer loop di-clamp ke rentang ini. Kalau θ
   mentok di plafon (`thetaAtCap`), loop berhenti lebih awal (bukan
   lanjut 50x sia-sia) dan hasil dapat `warnings` baru: *"Dispersion
   parameter θ mencapai batas pencarian (10000)... pertimbangkan pakai
   Poisson saja"* — artinya data memang tidak overdispersed, NB2 dengan
   θ≥1e4 praktis identik dengan Poisson.
2. **Step-halving di IRLS** (akar masalah): tiap Newton step dicek dulu
   apakah benar menaikkan log-likelihood (`nbLogLik`); kalau tidak, step
   dikecilkan bertahap (dibagi 2, maks 15x) sebelum diterima. Ini yang
   sebenarnya menghentikan ledakan ke `NaN`.

**Verifikasi** (Node `vm`, load order persis `index.html`, di luar
browser — file baru `stats-glm-hlm.js` sampai `js/data/weight-cases.js`
lalu `app.js`):
- Data overdispersed sintetis (θ_true=1.5–3, campuran gamma-Poisson):
  konvergen ke θ≈1.7–3.2, koefisien dekat nilai sebenarnya
  (`converged:true`), diulang 5x dengan data random baru tiap kali —
  tidak pernah `NaN`. ✅
- Data Poisson murni (θ_true→∞, tidak overdispersed): benar-benar
  berhenti di plafon θ=10000 dengan `warnings` yang jelas, koefisien
  tetap masuk akal (bukan "N/A"). ✅
- Kasus ekstrem (mu hampir konstan, efek prediktor nyaris nol,
  intercept-only): tidak `NaN`, walau kadang koefisien prediktor jadi
  kurang presisi (CI lebar) — ini wajar untuk data hampir tak
  teridentifikasi, bukan bug. ✅
- Performa: n=2000, 3 prediktor, ~2–9 detik (bervariasi tergantung draw
  data) — sekali klik tombol, bukan lupa titik lain, dan yang penting
  sebelumnya fungsi ini **tidak pernah** selesai konvergen sama sekali.
- File lolos `node --check` (syntax), tidak ada tabrakan nama baru.

**File yang berubah (sesi ini)**: `js/stats-engine/stats-glm-hlm.js`
saja. `app.js`/`index.html`/`style.css` tidak disentuh — pemanggilan
`SE.negbinReg(...)` di `app.js` (baris preview & tombol Run GLM) tidak
perlu diubah, tetap jalan lewat scope-fallback ke fungsi global baru
sama seperti pola B1-B26.
