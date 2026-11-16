// GUIDE — ROC Curve & DeLong Comparison
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  roc: {
    title: 'ROC Curve & Compare ROC (DeLong Test)',
    subtitle: 'AUC-ROC, Sensitivitas, Spesifisitas, Youden\'s J & Uji Perbandingan DeLong',
    summary: 'Mengevaluasi kemampuan diskriminasi skor prediktor numerik terhadap status biner (positif vs negatif) di seluruh rentang ambang batas, serta membandingkan AUC antar prediktor secara langsung menggunakan uji DeLong.',
    when: [
      'Menilai performa alat skrining, biomarker, atau skor prediksi terhadap status biner aktual.',
      'Aktifkan opsi Compare Curves (DeLong Test) untuk menguji apakah prediktor utama lebih unggul secara statistik daripada skor pembanding pada sampel yang sama.'
    ],
    assumptions: [
      'Variabel status aktual memiliki tepat 2 kelas (0/1 atau Negatif/Positif) dan skor uji kontinu/ordinal.',
      'Pada perbandingan kurva, semua skor prediktor diukur pada himpunan kasus yang sama.'
    ],
    metrics: [
      { k: 'AUC (Area Under Curve)', v: '0.90–1.00 sangat baik; 0.80–0.89 baik; 0.70–0.79 cukup; 0.50 setara tebak acak.' },
      { k: 'Youden\'s J (max Se+Sp−1)', v: 'Menentukan nilai ambang (cut-off) paling seimbang antara Sensitivitas dan Spesifisitas.' },
      { k: 'DeLong 95% CI & ΔAUC', v: 'Bila batas bawah CI > 0.50, diskriminasi lebih baik dari kebetulan; p DeLong < 0.05 menandakan perbedaan AUC yang signifikan.' }
    ],
    interpretation: 'Pilih cut-off sesuai konteks klinis/riset, dan gunakan uji DeLong untuk menilai apakah perbedaan AUC antar model bermakna secara statistik.'
  }
});
