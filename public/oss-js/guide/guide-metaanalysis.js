// GUIDE — Meta-Analysis
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  metaanalysis: {
    title: 'Meta-Analysis',
    subtitle: 'Sintesis ukuran efek lintas studi (Fixed / DerSimonian-Laird), I², Forest & Funnel Plot',
    summary: 'Menggabungkan ukuran efek (r, d, log OR) beserta standard error dari beberapa studi independen menjadi satu estimasi gabungan (Pooled Effect), lengkap dengan uji heterogenitas dan bias publikasi.',
    when: [
      'Tinjauan sistematis kuantitatif di mana setiap baris dataset merepresentasikan satu studi primer (memuat Effect Size dan SE atau N).'
    ],
    assumptions: [
      'Setiap baris studi harus independen dan menggunakan metrik ukuran efek yang seragam.'
    ],
    metrics: [
      { k: 'Fixed vs Random (DL)', v: 'Gunakan Random-Effects (DerSimonian-Laird) jika studi heterogen atau berasal dari populasi beragam.' },
      { k: 'I² Heterogeneity', v: '25% rendah, 50% sedang, 75% tinggi; menandakan proporsi variabilitas nyata antar studi.' },
      { k: 'Cochran\'s Q', v: 'p < 0.05 menandakan heterogenitas signifikan antar studi.' },
      { k: 'Egger\'s Test', v: 'p < 0.05 atau Funnel Plot asimetris mengindikasikan potensi bias publikasi.' }
    ],
    interpretation: 'Laporkan Pooled Effect & 95% CI, Q, I², Forest Plot untuk rincian tiap studi, serta Egger\'s Test dari Funnel Plot.'
  }
});
