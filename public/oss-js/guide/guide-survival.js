// GUIDE — Survival Analysis (Overview, Kaplan-Meier, Log-Rank, Cox PH)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  survival: {
    title: 'Survival Analysis Overview',
    subtitle: 'Analisis time-to-event dengan dukungan data tersensor (censored)',
    summary: 'Menganalisis lama waktu hingga terjadinya suatu peristiwa (event = 1) dengan tetap memanfaatkan informasi subjek yang belum mengalami peristiwa hingga akhir observasi (censored = 0).',
    when: [
      'Outcome berupa durasi waktu menuju kejadian (dropout, kambuh, kegagalan mesin, konversi).'
    ],
    assumptions: [
      'Non-informative censoring: alasan penyensoran tidak berkorelasi dengan risiko kejadian.'
    ],
    metrics: [
      { k: 'Kaplan-Meier', v: 'Kurva probabilitas bertahan S(t) nonparametrik dan Median Survival Time.' },
      { k: 'Log-Rank Test', v: 'Membandingkan kurva survival antar ≥ 2 kelompok.' },
      { k: 'Cox PH Regression', v: 'Menghitung Hazard Ratio (HR) untuk satu atau beberapa kovariat.' }
    ],
    interpretation: 'Jangan menghapus data tersensor karena memicu bias — gunakan Kaplan-Meier atau Cox Regression.'
  },
  km: {
    title: 'Kaplan-Meier Survival Curve',
    subtitle: 'Estimasi kurva S(t), Median Survival, & Greenwood 95% CI',
    summary: 'Mengestimasi probabilitas bertahan hidup kumulatif S(t) pada setiap titik waktu kejadian beserta rentang kepercayaan Greenwood.',
    when: [
      'Menggambarkan profil bertahan atau waktu-ke-kejadian secara deskriptif, baik tunggal maupun per kelompok.'
    ],
    assumptions: [
      'Waktu ≥ 0 dan variabel status terkode biner (1 = event terjadi, 0 = tersensor).'
    ],
    metrics: [
      { k: 'S(t)', v: 'Peluang bertahan melampaui waktu t.' },
      { k: 'Median Survival', v: 'Titik waktu pertama di mana S(t) turun mencapai 0.50 (50%).' },
      { k: '95% CI (Greenwood)', v: 'Pita ketidakpastian estimasi kurva survival.' }
    ],
    interpretation: 'Kurva yang berada lebih tinggi menunjukkan probabilitas bertahan lebih lama.'
  },
  logrank: {
    title: 'Log-Rank & Breslow Test',
    subtitle: 'Perbandingan kurva survival antar kelompok',
    summary: 'Menguji apakah dua atau lebih kelompok memiliki kurva survival yang identik sepanjang seluruh periode pengamatan.',
    when: [
      'Membandingkan waktu-ke-kejadian antar kelompok perlakuan, dosis, atau demografi.'
    ],
    assumptions: [
      'Memerlukan variabel Grouping dengan minimal 2 kategori unik.'
    ],
    metrics: [
      { k: 'Log-Rank χ²', v: 'Memberi bobot merata di seluruh garis waktu (optimal bila hazard proporsional).' },
      { k: 'Breslow (Wilcoxon) χ²', v: 'Memberi bobot lebih besar pada waktu awal ketika jumlah berisiko masih tinggi.' }
    ],
    interpretation: 'Jika p < 0.05, distribusi survival berbeda signifikan di antara kelompok yang dibandingkan.'
  },
  cox: {
    title: 'Cox Proportional Hazards Regression',
    subtitle: 'Estimasi Hazard Ratio (HR) multivariat untuk time-to-event',
    summary: 'Memodelkan laju kejadian sesaat (hazard rate) h(t|X) = h₀(t)·exp(Xβ) untuk mengukur efek multivariat kovariat terhadap kecepatan terjadinya peristiwa.',
    when: [
      'Mengukur efek banyak kovariat kontinu/kategorikal secara simultan pada data survival tersensor.'
    ],
    formula: 'h(t|X) = h₀(t) · exp(β₁X₁ + ... + βₖXₖ)   |   HR = exp(β)',
    assumptions: [
      'Proportional Hazards (PH): rasio hazard antar level prediktor konstan sepanjang waktu.'
    ],
    metrics: [
      { k: 'HR = exp(β)', v: 'HR > 1 menaikkan laju kejadian (mempercepat risiko); HR < 1 bersifat protektif.' },
      { k: 'Concordance (C-index)', v: 'Kemampuan model mengurutkan waktu kejadian (> 0.70 baik).' },
      { k: 'Likelihood Ratio χ²', v: 'Signifikansi model keseluruhan dibanding model kosong.' }
    ],
    interpretation: 'HR = 1.60 (95% CI [1.15, 2.22]) berarti setiap 1 unit kenaikan prediktor meningkatkan laju risiko kejadian sebesar 60%.'
  }
});
