// GUIDE — Hierarchical Linear Model (ICC, 2-Level, 3-Level)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  'hlm-icc': {
    title: 'HLM Null Model & ICC',
    subtitle: 'Dekomposisi varians antara vs dalam kelompok (Intraclass Correlation)',
    summary: 'Mengestimasi seberapa besar porsi varians variabel dependen yang disebabkan oleh perbedaan antar klaster/kelompok dibandingkan variasi antar individu di dalam klaster.',
    when: [
      'Langkah pertama sebelum membangun model multilevel penuh untuk membenarkan perlunya HLM.'
    ],
    formula: 'ICC = τ₀₀ / (τ₀₀ + σ²)   |   DEFF = 1 + (m̄ − 1)·ICC',
    assumptions: [
      'Struktur data tersarang (nested), misalnya siswa di dalam sekolah atau karyawan di dalam tim.'
    ],
    metrics: [
      { k: 'ICC (ρ)', v: 'Proporsi varians Level-2; ICC > 0.05–0.10 menandakan pengelompokan substantif.' },
      { k: 'Design Effect (DEFF)', v: 'DEFF > 2 menunjukkan regresi OLS biasa akan bias pada standard error.' },
      { k: 'τ₀₀ vs σ²', v: 'Varians intercept antar klaster (between) vs varians residu individu (within).' }
    ],
    interpretation: 'Jika ICC > 0.05 atau Design Effect > 2, pemodelan multilevel (HLM) sangat dianjurkan daripada regresi OLS tunggal.'
  },
  'hlm-2level': {
    title: 'HLM 2-Level (Random Intercept & Slope)',
    subtitle: 'Pemodelan hierarkis Level-1 individu dalam Level-2 klaster',
    summary: 'Mengakomodasi variasi baseline antar klaster (Random Intercept) maupun perbedaan kemiringan efek prediktor antar klaster (Random Slope), serta memisahkan efek within vs contextual.',
    when: [
      'Individu (Level-1) bersarang dalam unit kelompok (Level-2) dengan potensi ketergantungan intra-klaster.'
    ],
    formula: 'L1: Y_ij = β₀j + β₁j X_ij + r_ij   |   L2: β₀j = γ₀₀ + γ₀₁ W_j + u₀j',
    assumptions: [
      'Normalitas residu di Level-1 (r_ij) dan efek acak di Level-2 (u₀j, u₁j).',
      'Disarankan jumlah klaster Level-2 ≥ 20–30 agar estimasi varians stabil.'
    ],
    metrics: [
      { k: 'Fixed Effects (γ)', v: 'Efek rata-rata keseluruhan (Grand Intercept, efek Level-1, dan Level-2).' },
      { k: 'Random Effects (τ₀₀, τ₁₁)', v: 'Varians intercept dan slope antar klaster.' },
      { k: 'AIC / BIC / −2LL', v: 'Membandingkan kecocokan model Random Intercept vs Random Slope.' }
    ],
    interpretation: 'Perhatikan apakah prediktor Level-2 atau interaksi lintas level (cross-level) menjelaskan varians τ antar kelompok.'
  },
  'hlm-3level': {
    title: 'HLM 3-Level (Nested Hierarchy)',
    subtitle: 'Dekomposisi varians Level-1 dalam Level-2 dalam Level-3',
    summary: 'Memperluas hierarki menjadi 3 tingkatan (misalnya Siswa di dalam Kelas di dalam Sekolah) untuk memisahkan kontribusi varians tiap tingkatan.',
    when: [
      'Terdapat dua tingkat pengelompokan berjenjang di atas unit individu.'
    ],
    formula: 'Var(Y) = σ²(L1) + τ_π(L2) + τ_β(L3)',
    assumptions: [
      'Identifikasi klaster Level-2 dan Level-3 harus jelas dan konsisten tersarang.'
    ],
    metrics: [
      { k: 'ICC Level-2 & Level-3', v: 'Proporsi varians masing-masing pada tingkat klaster menengah dan puncak.' },
      { k: 'Variance Partition (VPC)', v: 'Persentase sumbangan tiap level terhadap total variabilitas Y.' }
    ],
    interpretation: 'Gunakan VPC untuk mengidentifikasi di level manakah (individu, kelas, atau organisasi) variasi terbesar berasal.'
  },
  hlm: {
    title: 'Hierarchical Linear Model (HLM)',
    subtitle: 'Pemodelan data bertingkat / tersarang (Multilevel Modeling)',
    summary: 'Menganalisis data hierarkis yang memiliki klaster sehingga standard error tetap akurat dan variasi antar-klaster terukur eksplisit.',
    when: ['Observasi tidak saling bebas karena dikelompokkan dalam sekolah, klinik, wilayah, atau pengukuran berulang.'],
    assumptions: ['Struktur hierarki terdefinisi jelas dan residu di tiap level mendekati normal.'],
    metrics: [
      { k: 'ICC', v: 'Proporsi varians antar kelompok.' },
      { k: 'Fixed & Random Effects', v: 'Parameter rata-rata populasi dan variasi antar klaster.' }
    ],
    interpretation: 'Mulai dengan Null Model (ICC) sebelum menambahkan prediktor Level-1 dan Level-2.'
  }
});
