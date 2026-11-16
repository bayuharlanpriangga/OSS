// GUIDE — Imputation (Single Imputation & Multiple Imputation MICE)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  impute: {
    title: 'Single Imputation',
    subtitle: 'Pengisian cepat nilai kosong dengan Mean, Median, Modus, atau Regresi',
    summary: 'Mengisi sel kosong pada satu variabel menggunakan metode deterministik tunggal untuk menyiapkan kelengkapan tabel.',
    when: [
      'Persentase missing sangat kecil (< 3–5%) dan dibutuhkan dataset tunggal yang lengkap secara cepat.'
    ],
    assumptions: [
      'Mean/Median imputation sedikit mengecilkan varians alami variabel; untuk > 5% missing lebih baik gunakan Multiple Imputation.'
    ],
    metrics: [
      { k: 'Mean / Median', v: 'Cepat untuk numerik; Median lebih aman terhadap nilai ekstrem.' },
      { k: 'Regression Impute', v: 'Memprediksi sel kosong menggunakan hubungan linier dengan prediktor lain.' }
    ],
    interpretation: 'Selalu periksa perubahan distribusi variabel di Preview sebelum menerapkan imputasi secara permanen.'
  },
  mi: {
    title: 'Multiple Imputation (MICE & Rubin\'s Rules)',
    subtitle: 'Imputasi berantai multivariat (m dataset) & pooling estimasi parameter',
    summary: 'Menghasilkan m set data lengkap menggunakan Predictive Mean Matching / Regresi berantai (MICE) yang mempertahankan ketidakpastian variasi antar-imputasi, lalu menggabungkan hasilnya memakai Rubin\'s Rules.',
    when: [
      'Data hilang > 5% atau mekanisme Missing At Random (MAR) agar estimasi koefisien dan standard error tidak bias.'
    ],
    formula: 'Rubin\'s Total Var:  T = Ū + (1 + 1/m) B   |   FMI = Varians akibat missing',
    assumptions: [
      'Masukkan semua variabel analisis (termasuk outcome dan prediktor penting) agar model imputasi mempertahankan struktur korelasi.'
    ],
    metrics: [
      { k: 'm (Imputations)', v: 'Umumnya m = 5 sudah cukup sebagai awal, m = 10–20 direkomendasikan bila missing tinggi.' },
      { k: 'Pooled Mean & SE', v: 'Gabungan across-imputation dengan standard error yang adil.' },
      { k: 'FMI (Fraction Missing Info)', v: 'Proporsi informasi yang hilang akibat missingness yang terserap oleh variasi antar m.' }
    ],
    interpretation: 'Multiple Imputation adalah standar emas penanganan missing data MAR dibanding pengisian nilai rata-rata tunggal.'
  }
});
