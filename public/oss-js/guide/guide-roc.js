// GUIDE — ROC Curve & DeLong Comparison
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  roc: {
    title: 'ROC Curve & Diagnostic Accuracy',
    subtitle: 'AUC-ROC, Sensitivitas, Spesifisitas, & Youden\'s J Optimal Cutoff',
    summary: 'Mengevaluasi kemampuan diskriminasi suatu skor prediktor numerik dalam membedakan dua status biner (positif vs negatif) di seluruh rentang ambang batas.',
    when: [
      'Menilai performa alat skrining, biomarker, atau skor prediksi terhadap status biner aktual.'
    ],
    assumptions: [
      'Variabel status aktual memiliki tepat 2 kelas (0/1 atau Negatif/Positif) dan skor uji kontinu/ordinal.'
    ],
    metrics: [
      { k: 'AUC (Area Under Curve)', v: '0.90–1.00 sangat baik; 0.80–0.89 baik; 0.70–0.79 cukup; 0.50 setara tebak acak.' },
      { k: 'Youden\'s J (max Se+Sp−1)', v: 'Menentukan nilai ambang (cut-off) paling seimbang antara Sensitivitas dan Spesifisitas.' },
      { k: 'DeLong 95% CI', v: 'Bila batas bawah CI > 0.50, performa diskriminasi lebih baik dari kebetulan.' }
    ],
    interpretation: 'Pilih cut-off sesuai konteks klinis/riset: prioritaskan Sensitivitas untuk skrining awal atau Spesifisitas untuk konfirmasi.'
  },
  roc_compare: {
    title: 'Compare Two ROC Curves (DeLong Test)',
    subtitle: 'Uji signifikansi selisih AUC antara dua prediktor pada subjek sama',
    summary: 'Membandingkan akurasi diskriminasi dua skor tes atau dua model berbeda terhadap satu outcome biner yang sama dengan memperhitungkan korelasi antar skor.',
    when: [
      'Membuktikan apakah prediktor A secara statistik lebih unggul dibandingkan prediktor B pada sampel berpasangan.'
    ],
    assumptions: [
      'Kedua prediktor diukur pada himpunan kasus yang sama dengan satu variabel outcome biner.'
    ],
    metrics: [
      { k: 'ΔAUC = AUC₁ − AUC₂', v: 'Selisih luas area di bawah dua kurva ROC.' },
      { k: 'DeLong z & p-value', v: 'p < 0.05 menunjukkan salah satu tes memiliki daya diskriminasi yang nyata lebih unggul.' }
    ],
    interpretation: 'Perhatikan ΔAUC beserta p-value DeLong untuk menyimpulkan apakah penambahan atau penggantian skor uji memberi peningkatan bermakna.'
  }
});
