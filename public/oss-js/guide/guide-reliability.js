// GUIDE — Reliability (Cronbach's Alpha & Cohen's Kappa)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  reliability: {
    title: 'Reliability Analysis',
    subtitle: 'Konsistensi internal skala (Cronbach\'s α, Split-Half, & Alpha if Deleted)',
    summary: 'Mengukur sejauh mana butir-butir pertanyaan dalam satu instrumen/konstruk mengukur dimensi laten yang sama secara konsisten.',
    when: [
      'Uji coba atau validasi reliabilitas kuesioner skala Likert atau tes multi-item (minimal 2 butir, ideal ≥ 3).'
    ],
    assumptions: [
      'Semua item telah diarahkan seragam (reverse-coded item negatif harus dibalik terlebih dahulu).',
      'Asumsi tau-equivalence (setiap item mengukur konstruk yang sama).'
    ],
    metrics: [
      { k: 'Cronbach\'s α', v: '≥ 0.90 sangat baik; 0.80–0.89 baik; 0.70–0.79 dapat diterima; < 0.60 rendah.' },
      { k: 'CITC (r_it)', v: 'Corrected Item-Total Correlation; butir baik umumnya r_it ≥ 0.30.' },
      { k: 'α if Deleted', v: 'Jika α naik signifikan setelah item dihapus, pertimbangkan merevisi/membuang item tersebut.' },
      { k: 'Guttman Split-Half', v: 'Reliabilitas belah-dua Spearman-Brown / Guttman.' }
    ],
    interpretation: 'Periksa item dengan flag r_it < 0.30 dan kolom "Alpha if Item Deleted" untuk memperbaiki kualitas instrumen.'
  },
  kappa: {
    title: 'Inter-Rater Reliability (Cohen\'s κ)',
    subtitle: 'Tingkat kesepakatan antar dua penilai (Unweighted & Weighted Kappa)',
    summary: 'Mengukur konsistensi penilaian atau klasifikasi kategorikal antara dua rater dengan mengoreksi kesepakatan yang terjadi sekadar kebetulan (chance agreement).',
    when: [
      'Dua penilai mengklasifikasikan objek/subjek yang sama ke dalam kategori nominal atau ordinal.'
    ],
    assumptions: [
      'Kedua rater menilai set kasus yang sama secara independen.',
      'Skala kategori identik pada kedua variabel rater.'
    ],
    metrics: [
      { k: 'κ < 0.20', v: 'Slight agreement (kesepakatan sangat lemah)' },
      { k: '0.21 – 0.40', v: 'Fair agreement (Landis & Koch, 1977)' },
      { k: '0.41 – 0.60', v: 'Moderate agreement' },
      { k: '0.61 – 0.80', v: 'Substantial agreement (memadai secara klinis/riset)' },
      { k: '0.81 – 1.00', v: 'Almost perfect agreement; gunakan Weighted κ untuk kategori berurutan (ordinal).' }
    ],
    interpretation: 'Laporkan nilai κ (atau Weighted κ untuk data ordinal), 95% CI, persentase kesepakatan mentah (Po), dan p-value.'
  }
});
