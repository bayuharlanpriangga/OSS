// GUIDE — General Linear Model (Univariate / MANOVA / Repeated Measures)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  glm: {
    title: 'GLM Univariate (ANCOVA / Factorial)',
    subtitle: 'Model Linier Umum dengan Fixed Factors dan Kovariat kontinu',
    summary: 'Menguji efek utama dan interaksi faktor kategorikal pada satu variabel dependen sambil mengendalikan pengaruh kovariat numerik secara linier (ANCOVA).',
    when: [
      'Desain eksperimen atau observasional yang menggabungkan faktor kategori serta variabel kontrol kontinu.'
    ],
    formula: 'Y = μ + α_i + β_j + (αβ)_ij + γX_cov + ε   (Type III SS)',
    assumptions: [
      'Normalitas residu dan homogenitas varians antar sel.',
      'Homogenitas regression slopes: hubungan kovariat ↔ Y sejajar di semua kelompok faktor.'
    ],
    metrics: [
      { k: 'Type III SS & F', v: 'Menguji kontribusi unik setiap suku ketika seluruh suku lain sudah masuk model.' },
      { k: 'Partial η²', v: 'SS_effect / (SS_effect + SS_error); standar pelaporan ANOVA/ANCOVA.' },
      { k: 'Estimated Marginal Means', v: 'Rata-rata kelompok setelah disesuaikan dengan rata-rata kovariat.' }
    ],
    interpretation: 'Periksa signifikansi kovariat dan faktor setelah penyesuaian Type III SS.'
  },
  'glm-multi': {
    title: 'GLM Multivariate (MANOVA)',
    subtitle: 'Pengujian serentak beberapa variabel dependen berkorelasi',
    summary: 'Menganalisis pengaruh faktor kategorikal terhadap kombinasi linier dari 2 atau lebih variabel dependen numerik sekaligus sambil menjaga laju error Tipe I keluarga.',
    when: [
      'Penelitian memiliki beberapa indikator hasil (Y₁, Y₂, ...) yang saling terkait dan diukur bersamaan.'
    ],
    assumptions: [
      'Normalitas multivariat dan hubungan linier antar variabel dependen.',
      'Homogenitas matriks kovarians antar kelompok (Box\'s M Test p > 0.001).'
    ],
    metrics: [
      { k: 'Pillai\'s Trace (V)', v: 'Paling tangguh terhadap pelanggaran asumsi dan ukuran sel tak seimbang (disarankan).' },
      { k: 'Wilks\' Lambda (Λ)', v: 'Proporsi varians multivariat yang TIDAK dijelaskan faktor (semakin kecil makin signifikan).' },
      { k: 'Hotelling & Roy', v: 'Statistik akar karakteristik alternatif.' }
    ],
    interpretation: 'Jika uji multivariat signifikan, lanjutkan memeriksa efek univariat pada tiap variabel Y secara terpisah.'
  },
  'glm-rep': {
    title: 'GLM Repeated Measures',
    subtitle: 'Pengukuran berulang within-subject & desain campuran (mixed)',
    summary: 'Memodelkan efek waktu/kondisi dalam-subjek (within-subjects) dengan opsi menambahkan faktor antar-subjek (between-subjects) untuk mengevaluasi interaksi Waktu × Kelompok.',
    when: [
      'Desain eksperimen Pre–Mid–Post antar kelompok kontrol vs perlakuan (Mixed Design).'
    ],
    assumptions: [
      'Sphericity untuk faktor within-subjects (gunakan koreksi Greenhouse-Geisser bila dilanggar).',
      'Homogenitas varians antar kelompok pada tiap titik waktu.'
    ],
    metrics: [
      { k: 'Time Effect', v: 'Apakah skor berubah signifikan sepanjang pengukuran berulang.' },
      { k: 'Time × Group', v: 'Menguji apakah lintasan perubahan berbeda antara kelompok.' },
      { k: 'GG / HF ε', v: 'Faktor koreksi derajat bebas bila varians selisih antar waktu tidak seragam.' }
    ],
    interpretation: 'Dalam desain campuran, fokus utama biasanya terletak pada interaksi Time × Between-Factor.'
  }
});
