// GUIDE — Missing Value Analysis & Little's MCAR
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  missinganalysis: {
    title: 'Missing Value Analysis & Little\'s MCAR',
    subtitle: 'Audit pola data hilang, uji mekanisme MCAR, & ko-okurensi',
    summary: 'Mendiagnosis persentase nilai hilang per variabel, mengidentifikasi pola missing antar variabel, serta menjalankan Little\'s MCAR Test untuk menguji apakah data hilang terjadi sepenuhnya acak.',
    when: [
      'Selalu jalankan sebelum melakukan listwise deletion atau Multiple Imputation apabila dataset memiliki sel kosong.'
    ],
    assumptions: [
      'Little\'s MCAR memerlukan minimal 2 variabel numerik dengan kombinasi pola missing yang bervariasi.'
    ],
    metrics: [
      { k: 'Little\'s MCAR p > 0.05', v: 'Konsisten dengan Missing Completely At Random (MCAR) — aman dianalisis/imputasi standar.' },
      { k: 'Little\'s MCAR p ≤ 0.05', v: 'Data bukan MCAR (kemungkinan MAR/MNAR) — hindari listwise deletion; gunakan Multiple Imputation.' },
      { k: '% Missing > 5% / > 20%', v: 'Ambang kewaspadaan: > 5% perlu MI; > 20–30% pertimbangkan kehati-hatian ekstra atau penghapusan variabel.' }
    ],
    interpretation: 'Jika pola hilang tidak acak (p ≤ 0.05), gunakan Multiple Imputation (MICE) agar estimasi parameter tidak bias.'
  }
});
