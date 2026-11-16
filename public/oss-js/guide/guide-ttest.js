// GUIDE — T-Test (Independent, One-Sample, Paired)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  ttest: {
    title: 'Independent Samples T-Test',
    subtitle: 'Bandingkan rata-rata dua kelompok bebas',
    summary: 'Menguji apakah terdapat perbedaan rata-rata yang signifikan secara statistik antara dua kelompok independen pada satu variabel dependen numerik.',
    when: [
      'Variabel dependen numerik kontinyu dan variabel pengelompokan kategorikal tepat 2 kategori.',
      'Observasi antar kelompok saling bebas (subjek berbeda).'
    ],
    assumptions: [
      'Normalitas distribusi residu di masing-masing kelompok (uji Shapiro-Wilk / Q-Q).',
      'Homogenitas varians (Levene Test p > 0.05); bila dilanggar gunakan Welch\'s t-test.'
    ],
    metrics: [
      { k: 'Student t / Welch t', v: 'Statistik uji perbedaan mean relatif terhadap standard error.' },
      { k: 'Levene Test', v: 'p < 0.05 menandakan varians tidak homogen — pakai baris Welch.' },
      { k: 'Cohen\'s d', v: 'Ukuran efek: 0.2 kecil, 0.5 sedang, 0.8 besar.' },
      { k: '95% CI', v: 'Selang kepercayaan selisih rata-rata; tidak memuat 0 berarti signifikan.' }
    ],
    interpretation: 'Laporkan t(df), p-value, 95% CI selisih mean, dan Cohen\'s d. Gunakan Mann-Whitney U jika normalitas sangat dilanggar pada sampel kecil.'
  },
  onesamp: {
    title: 'One-Sample T-Test',
    subtitle: 'Bandingkan rata-rata sampel terhadap nilai acuan μ₀',
    summary: 'Menguji apakah rata-rata suatu sampel berbeda secara bermakna dari nilai populasi atau target teoretis (μ₀) yang diketahui.',
    when: [
      'Membandingkan skor rata-rata sampel terhadap standar baku, KKM, atau nilai benchmark (μ₀).'
    ],
    assumptions: [
      'Variabel berskala numerik dan observasi independen.',
      'Data berdistribusi normal (atau N ≥ 30 berdasarkan Teorema Limit Pusat).'
    ],
    metrics: [
      { k: 't = (M − μ₀)/SE', v: 'Rasio selisih rata-rata sampel terhadap nilai uji μ₀.' },
      { k: 'Mean Difference', v: 'Selisih langsung M − μ₀ dalam satuan asli.' },
      { k: 'Cohen\'s d', v: '(M − μ₀) / SD; efek standar terhadap target.' }
    ],
    interpretation: 'Jika p < 0.05, rata-rata sampel berbeda signifikan dari nilai acuan μ₀. Bila distribusi miring pada sampel kecil, gunakan One-Sample Wilcoxon.'
  },
  paired: {
    title: 'Paired Samples T-Test',
    subtitle: 'Perbandingan dua pengukuran berpasangan (Pre vs Post)',
    summary: 'Menguji perbedaan rata-rata dari dua pengukuran pada subjek yang sama atau pasangan yang cocok (misalnya Pre-test dan Post-test, atau kondisi A vs B).',
    when: [
      'Desain within-subjects dengan 2 titik waktu atau 2 kondisi berpasangan.'
    ],
    assumptions: [
      'Selisih skor (D = Post − Pre) berdistribusi mendekati normal.',
      'Skala variabel dependen adalah interval atau rasio.'
    ],
    metrics: [
      { k: 'Mean Diff (D̄)', v: 'Rata-rata perubahan antar dua pengukuran.' },
      { k: 't(df) & p-value', v: 'Signifikansi perubahan dalam-subjek.' },
      { k: 'Cohen\'s dz', v: 'D̄ / SD(D); ukuran efek desain berpasangan.' }
    ],
    interpretation: 'Nilai p < 0.05 menunjukkan perubahan yang konsisten antar pengukuran berpasangan. Periksa tanda Mean Diff untuk melihat arah peningkatan atau penurunan.'
  }
});
