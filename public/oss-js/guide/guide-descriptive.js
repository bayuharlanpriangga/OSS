// GUIDE — Descriptive Statistics
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  descriptive: {
    title: 'Descriptive Statistics',
    subtitle: 'Ringkasan kecenderungan pusat, sebaran, & normalitas distribusi',
    summary: 'Menghitung ukuran pemusatan (Mean, Median), penyebaran (SD, Variance, IQR, Range, CV), bentuk distribusi (Skewness, Kurtosis), serta uji normalitas Shapiro-Wilk dan Q-Q Plot.',
    when: [
      'Langkah awal eksplorasi setiap variabel numerik sebelum analisis inferensial.',
      'Menentukan apakah distribusi mendekati normal (parametrik) atau miring (nonparametrik).'
    ],
    assumptions: [
      'Variabel berskala numerik (interval atau rasio).',
      'Periksa pencilan (outlier) melalui Q-Q Plot dan nilai Skewness/Kurtosis.'
    ],
    metrics: [
      { k: 'Mean ± SD', v: 'Laporkan untuk data simetris / normal.' },
      { k: 'Median & IQR', v: 'Lebih robust untuk data skewed atau berpencilan.' },
      { k: 'Skewness / Kurtosis', v: 'Mendekati 0 menandakan distribusi simetris; |z| > 1.96 menunjukkan deviasi.' },
      { k: 'Shapiro-Wilk p', v: 'p > 0.05 mendukung asumsi normalitas distribusi.' }
    ],
    interpretation: 'Jika Shapiro-Wilk signifikan (p < 0.05) dan Q-Q Plot menyimpang di ekor, pertimbangkan transformasi data atau gunakan Median/IQR serta uji nonparametrik.'
  }
});
