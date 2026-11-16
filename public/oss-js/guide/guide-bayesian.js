// GUIDE — Bayesian Analysis (Bayes Factor T-Test, Correlation/Regression, Posterior & ROPE)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  bayesian: {
    title: 'Bayesian Hypothesis Testing (Bayes Factor)',
    subtitle: 'Evaluasi kekuatan bukti H₁ vs H₀ menggunakan BF₁₀ (JZS Prior)',
    summary: 'Berbeda dari p-value frequentist yang hanya menolak atau gagal menolak H₀, Bayes Factor (BF₁₀) langsung membandingkan seberapa kali lebih mungkin data terjadi di bawah hipotesis alternatif H₁ dibanding H₀.',
    when: [
      'Ingin mengkuantifikasi bukti mendukung H₀ (bukti ketidakadaan efek) maupun H₁ secara simetris.'
    ],
    formula: 'BF₁₀ = P(Data | H₁) / P(Data | H₀)   |   BF₀₁ = 1 / BF₁₀',
    assumptions: [
      'Prior scale Cauchy r memengaruhi sensitivitas efek sedang/kecil (default JASP/OSS r = 0.707).'
    ],
    metrics: [
      { k: 'BF₁₀ > 100', v: 'Extreme evidence mendukung H₁ (Jeffreys / Lee & Wagenmakers)' },
      { k: '10 < BF₁₀ ≤ 30', v: 'Strong evidence mendukung H₁' },
      { k: '3 < BF₁₀ ≤ 10', v: 'Moderate evidence mendukung H₁' },
      { k: '0.33 ≤ BF₁₀ ≤ 3', v: 'Anecdotal / Inconclusive — data belum cukup kuat memihak H₀ atau H₁' },
      { k: 'BF₁₀ < 0.33 (BF₀₁ > 3)', v: 'Moderate hingga strong evidence mendukung H₀ (tidak ada perbedaan)' }
    ],
    interpretation: 'Misalnya BF₁₀ = 15.0 berarti data 15 kali lebih mendukung hipotesis adanya efek dibanding hipotesis nol.'
  },
  bayesian_corr: {
    title: 'Bayesian Correlation & Linear Regression',
    subtitle: 'Bayes Factor korelasi (r) & perbandingan model R² berbasis JZS Prior',
    summary: 'Menghitung BF₁₀ untuk korelasi bivariat maupun kekuatan bukti keseluruhan model regresi linier terhadap model tanpa prediktor.',
    when: [
      'Mengukur seberapa kuat bukti mendukung hubungan korelatif atau model regresi dibanding model null.'
    ],
    assumptions: [
      'Hubungan linier dan distribusi residu mendekati normal.'
    ],
    metrics: [
      { k: 'BF₁₀ & BF₀₁', v: 'Menilai dukungan terhadap korelasi/regresi versus korelasi nol.' },
      { k: '95% Credible Interval', v: 'Rentang di mana parameter populasi berada dengan probabilitas 95% berdasarkan posterior.' }
    ],
    interpretation: 'Credible Interval berbeda dari Confidence Interval: Anda dapat langsung menyatakan ada 95% peluang parameter sejati berada di dalam rentang ini.'
  },
  bayesian_posterior: {
    title: 'Posterior Distribution & ROPE',
    subtitle: 'Kurva distribusi posterior, 95% HDI, & Region of Practical Equivalence',
    summary: 'Memvisualisasikan distribusi keyakinan akhir (posterior) mengenai besaran efek beserta Highest Density Interval (95% HDI) dan persentase massa posterior dalam zona ekuivalensi praktis (ROPE).',
    when: [
      'Menilai apakah suatu efek tidak hanya berbeda dari nol, tetapi juga bermakna secara praktis di luar batas toleransi ROPE.'
    ],
    assumptions: [
      'Tentukan batas bawah & atas ROPE (mis. Cohen\'s d ∈ [−0.10, +0.10] dianggap ekuivalen nol).'
    ],
    metrics: [
      { k: '95% HDI', v: 'Wilayah 95% nilai parameter yang paling kredibel secara posterior.' },
      { k: '% in ROPE', v: 'Jika hampir seluruh HDI berada di luar ROPE (< 2.5%), efek dianggap bermakna praktis; jika sepenuhnya di dalam (> 95%), terima null praktis.' }
    ],
    interpretation: 'ROPE memungkinkan keputusan praktis menerima hipotesis null secara sah apabila seluruh 95% HDI jatuh di dalam zona ekuivalensi.'
  }
});
