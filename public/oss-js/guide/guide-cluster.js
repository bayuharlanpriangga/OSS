// GUIDE — Cluster Analysis
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  cluster: {
    title: 'Cluster Analysis (K-Means & Hierarchical)',
    subtitle: 'Segmentasi objek ke dalam klaster homogen tanpa label awal',
    summary: 'Mengelompokkan observasi yang mirip ke dalam k segmen menggunakan K-Means (berbasis centroid) atau Hierarchical Agglomerative (Ward, Complete, Average, Single linkage).',
    when: [
      'Menemukan tipologi, profil responden, atau segmentasi alami dalam dataset tanpa variabel target.'
    ],
    assumptions: [
      'Variabel klaster berskala numerik; gunakan standardisasi Z-score jika satuan antar variabel berbeda jauh.'
    ],
    metrics: [
      { k: 'Silhouette Score', v: 'Rentang −1 hingga +1; nilai lebih tinggi (> 0.50 baik, > 0.25 cukup) menandakan pemisahan klaster jelas.' },
      { k: 'Elbow (WCSS)', v: 'Titik siku penurunan Within-Cluster Sum of Squares membantu memilih jumlah k optimal.' },
      { k: 'Cluster Centroids', v: 'Profil rata-rata tiap klaster untuk memberi label bermakna pada segmen.' }
    ],
    interpretation: 'Uji beberapa nilai k dan pilih yang memberi Silhouette Score tertinggi serta profil klaster paling mudah diinterpretasikan.'
  }
});
