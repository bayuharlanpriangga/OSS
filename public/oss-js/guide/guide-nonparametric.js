// GUIDE — Nonparametric Tests
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  nonparam: {
    title: 'Nonparametric Tests',
    subtitle: 'Uji bebas-distribusi untuk data ordinal, skewed, atau sampel kecil',
    summary: 'Menyediakan alternatif berbasis peringkat (rank) bagi t-test dan ANOVA tanpa memerlukan asumsi normalitas distribusi.',
    when: [
      'Data berskala ordinal, memiliki outlier berat, miring tajam, atau ukuran sampel sangat kecil.'
    ],
    assumptions: [
      'Independensi antar observasi (kecuali Wilcoxon / Friedman yang berpasangan).'
    ],
    metrics: [
      { k: 'Mann-Whitney U', v: 'Padanan nonparametrik Independent T-Test (2 kelompok bebas); efek r = |z|/√N.' },
      { k: 'Kruskal-Wallis H', v: 'Padanan One-Way ANOVA (≥ 3 kelompok bebas); efek η²_H.' },
      { k: 'Wilcoxon Signed-Rank', v: 'Padanan Paired T-Test (Pre vs Post) atau uji median vs target μ₀.' },
      { k: 'Friedman χ²', v: 'Padanan Repeated Measures ANOVA untuk ≥ 3 pengukuran berpasangan.' }
    ],
    interpretation: 'Laporkan Median dan IQR setiap kelompok bersama statistik uji (U, H, W, atau χ²), p-value, dan ukuran efek r atau η².'
  }
});
