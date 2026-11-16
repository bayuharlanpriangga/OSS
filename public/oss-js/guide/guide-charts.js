// GUIDE — Statistical Charts
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  charts: {
    title: 'Statistical Charts',
    subtitle: 'Eksplorasi visual: Histogram, Boxplot, Scatterplot, Bar, Q-Q Plot',
    summary: 'Membuat visualisasi distribusi univariat, perbandingan kelompok, serta pola hubungan bivariat dan kecocokan kuantil normal secara interaktif.',
    when: [
      'Inspeksi visual pola sebaran, pencilan, linearitas, dan perbedaan antar kategori.'
    ],
    assumptions: [
      'Pilih variabel bertipe numerik untuk Histogram/Boxplot/Q-Q, dan pasangan variabel untuk Scatterplot.'
    ],
    metrics: [
      { k: 'Histogram & Q-Q', v: 'Memeriksa kemiringan dan kesesuaian terhadap kurva normal.' },
      { k: 'Boxplot', v: 'Menampilkan kuartil (Q1, Median, Q3), whisker, dan titik outlier.' },
      { k: 'Scatterplot', v: 'Memperlihatkan arah, bentuk (linier/kurvilinear), dan tren korelasi.' }
    ],
    interpretation: 'Gunakan grafik sebelum uji statistik untuk memastikan tidak ada anomali data atau kesalahan input.'
  }
});
