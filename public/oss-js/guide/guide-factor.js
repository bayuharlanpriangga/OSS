// GUIDE — Factor Analysis (EFA & CFA)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  efa: {
    title: 'Exploratory Factor Analysis (EFA)',
    subtitle: 'Ekstraksi struktur faktor laten (PCA / PAF, Varimax / Promax)',
    summary: 'Mengidentifikasi dimensi laten yang mendasari sekumpulan item atau indikator tanpa menetapkan struktur faktor terlebih dahulu.',
    when: [
      'Tahap eksplorasi penyusunan instrumen baru atau reduksi dimensi banyak indikator.'
    ],
    assumptions: [
      'KMO ≥ 0.60 (ideal ≥ 0.80) dan Bartlett\'s Test of Sphericity signifikan (p < 0.05).',
      'Ukuran sampel memadai (rasio minimal 5–10 responden per item).'
    ],
    metrics: [
      { k: 'Eigenvalue > 1', v: 'Kriteria Kaiser dan titik siku Scree Plot untuk jumlah faktor.' },
      { k: 'Factor Loading', v: 'Indikator umumnya dipertahankan jika loading utama ≥ 0.40 atau 0.50 tanpa cross-loading tinggi.' },
      { k: 'Communality (h²)', v: 'Proporsi varians item yang dijelaskan oleh faktor yang diekstrak.' }
    ],
    interpretation: 'Gunakan rotasi orthogonal (Varimax) jika faktor dianggap tidak berkorelasi, atau oblique (Promax) bila antar faktor saling berhubungan.'
  },
  cfa: {
    title: 'Confirmatory Factor Analysis (CFA)',
    subtitle: 'Uji validitas konstruk: Factor Loadings, AVE, CR, & Goodness of Fit',
    summary: 'Menguji apakah struktur faktor yang dispesifikasikan sebelumnya sesuai dengan pola kovarians data empiris.',
    when: [
      'Memvalidasi instrumen baku atau tahap Measurement Model sebelum analisis jalur/SEM.'
    ],
    assumptions: [
      'Setiap faktor laten sebaiknya memiliki minimal 3 indikator.',
      'Kovarians data lengkap atau ditangani terlebih dahulu.'
    ],
    metrics: [
      { k: 'Loading (λ) ≥ 0.50', v: 'Validitas konvergen indikator (ideal ≥ 0.70).' },
      { k: 'AVE ≥ 0.50', v: 'Average Variance Extracted; rata-rata varians indikator yang ditangkap konstruk.' },
      { k: 'CR ≥ 0.70', v: 'Composite Reliability konstruk.' },
      { k: 'Fit: CFI/TLI ≥ 0.90', v: 'RMSEA ≤ 0.08 dan SRMR ≤ 0.08 menunjukkan kecocokan model yang baik.' }
    ],
    interpretation: 'Evaluasi validitas konvergen (λ, AVE), reliabilitas konstruk (CR), dan kesesuaian keseluruhan (CFI, TLI, RMSEA, SRMR).'
  }
});
