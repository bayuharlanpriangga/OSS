// GUIDE — Linear Discriminant Analysis (LDA)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  discriminant: {
    title: 'Linear Discriminant Analysis (LDA)',
    subtitle: 'Fungsi diskriminan & prediksi keanggotaan kelompok dari prediktor numerik',
    summary: 'Menemukan kombinasi linier prediktor yang paling tajam memisahkan dua atau lebih kelompok kategorikal sekaligus mengevaluasi akurasi klasifikasinya.',
    when: [
      'Variabel target kategorikal (≥ 2 grup) dan prediktor berskala numerik (kebalikan MANOVA).'
    ],
    assumptions: [
      'Normalitas multivariat prediktor dalam tiap kelompok.',
      'Kesamaan matriks kovarians antar kelompok (asumsi linearitas batas keputusan).'
    ],
    metrics: [
      { k: 'Wilks\' Λ & p', v: 'Menguji apakah fungsi diskriminan mampu membedakan kelompok secara bermakna.' },
      { k: 'Eigenvalue & % Var', v: 'Daya pisah relatif tiap fungsi diskriminan (jumlah maks = min(G−1, p)).' },
      { k: 'Hit Ratio (Accuracy)', v: 'Persentase kasus yang terklasifikasi benar pada Confusion Matrix.' }
    ],
    interpretation: 'Baca Structure Matrix untuk melihat prediktor mana yang berkorelasi paling kuat dengan fungsi diskriminan utama.'
  }
});
