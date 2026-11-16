// GUIDE — Correlation (Bivariate, Partial, Canonical, Matrix)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  correlation: {
    title: 'Bivariate Correlation',
    subtitle: 'Pearson r, Spearman ρ, & Kendall τ beserta CI dan Scatterplot',
    summary: 'Mengukur kekuatan dan arah hubungan linier (Pearson) atau monoton (Spearman / Kendall) antara dua variabel numerik.',
    when: [
      'Menilai asosiasi dua variabel sebelum pemodelan regresi atau sebagai laporan korelasional.'
    ],
    assumptions: [
      'Pearson: hubungan linier, tanpa pencilan ekstrem, distribusi mendekati normal.',
      'Spearman / Kendall: cocok untuk data ordinal, miring, atau memiliki outlier.'
    ],
    metrics: [
      { k: 'r / ρ / τ', v: 'Rentang -1 (negatif sempurna) hingga +1 (positif sempurna).' },
      { k: 'r² (R²)', v: 'Proporsi varians bersama kedua variabel.' },
      { k: '95% CI (Fisher z)', v: 'Rentang estimasi korelasi di populasi.' }
    ],
    interpretation: 'Patokan Cohen: |r| ≈ 0.10 lemah, 0.30 sedang, 0.50 kuat. Korelasi tidak membuktikan hubungan sebab-akibat.'
  },
  partialcorr: {
    title: 'Partial Correlation',
    subtitle: 'Korelasi murni X ↔ Y setelah mengontrol variabel Z',
    summary: 'Menghitung kekuatan hubungan linier antara dua variabel (X dan Y) setelah pengaruh satu atau lebih variabel pengganggu (Z) dikeluarkan secara statistik.',
    when: [
      'Memastikan hubungan X dan Y bukan sekadar hubungan semu (spurious) akibat variabel ketiga Z.'
    ],
    assumptions: [
      'Hubungan linier antar semua pasangan variabel X, Y, dan Z.',
      'Tidak ada multikolinearitas sempurna antar variabel kontrol.'
    ],
    metrics: [
      { k: 'r(XY·Z)', v: 'Korelasi parsial orde-k setelah mengontrol Z.' },
      { k: 'Zero-order r(XY)', v: 'Bandingkan dengan r(XY·Z) untuk melihat seberapa besar korelasi berubah.' },
      { k: 'df = N − 2 − k', v: 'Derajat bebas berkurang sesuai jumlah variabel kontrol k.' }
    ],
    interpretation: 'Jika r(XY) signifikan tetapi r(XY·Z) turun mendekati nol dan tidak signifikan, hubungan awal kemungkinan besar dimediasi atau dirancukan oleh Z.'
  },
  canonicalcorr: {
    title: 'Canonical Correlation Analysis (CCA)',
    subtitle: 'Korelasi multivariat antara gugus variabel X dan gugus variabel Y',
    summary: 'Mencari kombinasi linier terbobot dari himpunan variabel X (variabel kanonik U) dan himpunan Y (variabel kanonik V) yang memaksimalkan korelasi antar kedua himpunan secara simultan.',
    when: [
      'Terdapat ≥ 2 variabel independen (gugus X) dan ≥ 2 variabel dependen (gugus Y) yang dianalisis serentak.'
    ],
    assumptions: [
      'Hubungan linier dalam dan antar kedua gugus variabel.',
      'Jumlah sampel disarankan minimal 10× jumlah total variabel.'
    ],
    metrics: [
      { k: 'Rc (Canonical r)', v: 'Korelasi antar variat kanonik untuk tiap dimensi/akar.' },
      { k: 'Rc²', v: 'Proporsi varians bersama pada dimensi kanonik tersebut.' },
      { k: 'Wilks\' Λ & Bartlett χ²', v: 'Menguji dimensi kanonik mana yang signifikan secara berurutan.' },
      { k: 'Canonical Loadings', v: 'Korelasi tiap variabel asli dengan variat kanoniknya (|loading| ≥ 0.30).' }
    ],
    interpretation: 'Tafsirkan hanya akar kanonik dengan Wilks\' Λ signifikan (p < 0.05) menggunakan struktur loading untuk memberi makna pada kombinasi X dan Y.'
  },
  corrmatrix: {
    title: 'Correlation Matrix',
    subtitle: 'Matriks interkorelasi multivariat & Heatmap interaktif',
    summary: 'Menghitung matriks korelasi berpasangan untuk seluruh variabel numerik terpilih sekaligus, lengkap dengan visualisasi heatmap dan nilai p.',
    when: [
      'Skrining awal multikolinearitas antar prediktor atau memetakan pola hubungan di kuesioner multi-skala.'
    ],
    assumptions: [
      'Semua variabel terpilih berskala numerik atau ordinal (jika memakai Spearman).'
    ],
    metrics: [
      { k: 'Matriks r / ρ', v: 'Korelasi tiap pasangan variabel; |r| > 0.80 mengindikasikan multikolinearitas tinggi.' },
      { k: 'Heatmap warna', v: 'Intensitas warna mencerminkan arah dan kekuatan asosiasi.' }
    ],
    interpretation: 'Gunakan untuk mendeteksi klaster variabel yang berelasi erat serta potensi redundansi antar prediktor sebelum regresi.'
  }
});
