// GUIDE — Power Analysis (A Priori, Post-Hoc, Power Curves, Sensitivity)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  poweranalysis: {
    title: 'A Priori Sample Size & Post-Hoc Power',
    subtitle: 'Kalkulator ukuran sampel N dan Statistical Power (1 − β)',
    summary: 'Menentukan jumlah sampel minimal (N) sebelum riset dimulai (A Priori) atau menghitung kekuatan statistik yang tercapai dari sampel yang ada (Post-Hoc).',
    when: [
      'Perencanaan proposal riset agar tidak kekurangan sampel (underpowered) atau verifikasi kecukupan sampel pasca-analisis.'
    ],
    assumptions: [
      'Ukuran efek perkiraan (Cohen\'s d, f, r, f², atau w) sebaiknya bersumber dari literatur atau studi pendahuluan.'
    ],
    metrics: [
      { k: 'Target Power ≥ 0.80', v: 'Standar minimum peluang mendeteksi efek nyata jika benar-benar ada (β = 0.20).' },
      { k: 'α = 0.05', v: 'Ambang kesalahan Tipe I (false positive).' },
      { k: 'Effect Size', v: 'Semakin kecil efek yang ingin dideteksi, semakin besar N yang diperlukan secara kuadratik.' }
    ],
    interpretation: 'Laporkan jenis uji, asumsi ekor (two/one-tailed), α, target power, ukuran efek yang diasumsikan, dan total N yang dibutuhkan.'
  },
  powerplot: {
    title: 'Power Curve',
    subtitle: 'Visualisasi hubungan Ukuran Sampel (N) terhadap Power (1 − β)',
    summary: 'Menampilkan kurva peningkatan kekuatan statistik seiring bertambahnya ukuran sampel N pada satu atau beberapa skenario ukuran efek.',
    when: [
      'Melihat sensitivitas kebutuhan N terhadap perubahan target power (mis. 0.80 vs 0.90).'
    ],
    assumptions: [
      'Parameter uji, α, dan rentang N telah dipilih sesuai desain riset.'
    ],
    metrics: [
      { k: 'Garis acuan 0.80', v: 'Perpotongan kurva dengan garis 0.80 menandai kebutuhan N minimal.' }
    ],
    interpretation: 'Jika kurva mendatar jauh di bawah 0.80 pada N tersedia, riset berisiko tinggi menghasilkan false negative.'
  },
  sensitivity: {
    title: 'Sensitivity Analysis (Minimum Detectable Effect)',
    subtitle: 'Efek terkecil yang mampu dideteksi pada N dan Power tetap',
    summary: 'Menghitung Minimum Detectable Effect Size (MDE) yang masih dapat dideteksi secara reliabel oleh ukuran sampel N yang sudah tersedia.',
    when: [
      'Ketika ukuran sampel N dibatasi anggaran/populasi dan Anda ingin tahu apakah riset cukup peka terhadap efek realistis.'
    ],
    assumptions: [
      'N, α, dan target power ditetapkan sebagai parameter input.'
    ],
    metrics: [
      { k: 'MDE (d, r, f, f²)', v: 'Jika MDE jauh lebih besar daripada efek yang wajar di literatur, sampel tergolong kurang memadai.' }
    ],
    interpretation: 'Cocokkan nilai MDE terhadap standar efek di bidang Anda untuk menilai kelayakan desain.'
  }
});
