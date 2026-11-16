// GUIDE — ANOVA (One-Way, Two-Way, Three-Way, Repeated Measures)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  anova: {
    title: 'One-Way ANOVA',
    subtitle: 'Perbandingan rata-rata 3 kelompok atau lebih',
    summary: 'Menguji apakah terdapat perbedaan rata-rata di antara tiga atau lebih kelompok independen dengan membandingkan varians antar-kelompok terhadap varians dalam-kelompok.',
    when: [
      '1 faktor kategorikal (≥ 3 level) dan 1 variabel dependen numerik.'
    ],
    assumptions: [
      'Normalitas residu dan independensi antar observasi.',
      'Homogenitas varians (Levene Test); jika dilanggar gunakan Welch F atau Kruskal-Wallis.'
    ],
    metrics: [
      { k: 'F(df₁, df₂)', v: 'Rasio MS Between / MS Within.' },
      { k: 'η² & ω²', v: 'Proporsi varians dependen yang dijelaskan oleh faktor (0.01 kecil, 0.06 sedang, 0.14 besar).' },
      { k: 'Post-Hoc (Tukey/Bonferroni)', v: 'Menentukan pasangan kelompok mana yang berbeda jika F signifikan.' }
    ],
    interpretation: 'Uji F yang signifikan hanya menyatakan setidaknya ada satu pasangan mean yang berbeda — lanjutkan membaca tabel post-hoc untuk pasangan spesifik.'
  },
  anova2: {
    title: 'Two-Way ANOVA (Factorial)',
    subtitle: 'Main effect dua faktor serta efek interaksi A × B',
    summary: 'Menganalisis pengaruh simultan dua faktor independen dan apakah efek satu faktor bergantung pada level faktor lainnya (interaksi).',
    when: [
      'Desain eksperimental atau faktorial 2 × 2 atau lebih besar dengan 1 variabel dependen numerik.'
    ],
    assumptions: [
      'Normalitas residu pada tiap sel desain.',
      'Homogenitas varians antar sel (Levene Test).'
    ],
    metrics: [
      { k: 'Main Effect A & B', v: 'Pengaruh rata-rata masing-masing faktor secara terpisah.' },
      { k: 'Interaction A × B', v: 'Jika p < 0.05, pola garis di Interaction Plot tidak sejajar — tafsirkan interaksi terlebih dahulu.' },
      { k: 'Partial η²', v: 'Ukuran efek tiap suku dalam model faktorial.' }
    ],
    interpretation: 'Selalu periksa signifikansi interaksi A × B terlebih dahulu sebelum menafsirkan main effect secara terpisah.'
  },
  anova3: {
    title: 'Three-Way ANOVA',
    subtitle: 'Desain faktorial 3 faktor (A, B, C & interaksi hingga A×B×C)',
    summary: 'Mengevaluasi 3 main effect, 3 interaksi dua-arah (A×B, A×C, B×C), dan 1 interaksi tiga-arah (A×B×C) sekaligus dalam satu model.',
    when: [
      'Eksperimen multi-faktor dengan tiga variabel kategorikal independen.'
    ],
    assumptions: [
      'Ukuran sel memadai (usahakan minimal n ≥ 5 per kombinasi sel).',
      'Normalitas residu dan kesamaan varians antar sel.'
    ],
    metrics: [
      { k: 'Three-Way A×B×C', v: 'Menguji apakah interaksi A×B berubah pada berbagai level C.' },
      { k: 'Two-Way Interactions', v: 'Ditafsirkan bila interaksi 3-arah tidak signifikan.' },
      { k: 'Partial η²', v: 'Kontribusi unik setiap efek terhadap varians residu.' }
    ],
    interpretation: 'Mulai evaluasi dari tingkat tertinggi (A×B×C), turun ke interaksi 2-arah, lalu main effect.'
  },
  rmanova: {
    title: 'Repeated Measures ANOVA',
    subtitle: 'Pengukuran berulang pada subjek yang sama (≥ 3 titik waktu)',
    summary: 'Menguji perubahan rata-rata di seluruh beberapa titik waktu atau kondisi berulang pada partisipan yang sama dengan memisahkan variabilitas antar-subjek.',
    when: [
      'Desain longitudinal atau within-subjects dengan 3 atau lebih pengukuran berpasangan (mis. Pre, Mid, Post).'
    ],
    assumptions: [
      'Sphericity: varians selisih antar semua pasangan kondisi sama (Mauchly\'s Test).',
      'Jika Mauchly p < 0.05, terapkan koreksi derajat bebas Greenhouse-Geisser (ε) atau Huynh-Feldt.'
    ],
    metrics: [
      { k: 'Mauchly W & ε', v: 'Menilai pelanggaran asumsi sphericity.' },
      { k: 'F (GG-corrected)', v: 'Nilai p terkoreksi lebih konservatif saat sphericity dilanggar.' },
      { k: 'Partial η²', v: 'Proporsi varians perubahan waktu dalam subjek.' }
    ],
    interpretation: 'Jika F signifikan, periksa perbandingan berpasangan antar titik waktu untuk mengetahui kapan perubahan paling bermakna terjadi.'
  }
});
