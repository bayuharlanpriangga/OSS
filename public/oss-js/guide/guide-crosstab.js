// GUIDE — Crosstabulation & Chi-Square
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  crosstab: {
    title: 'Crosstabulation & Chi-Square',
    subtitle: 'Tabel kontingensi dua variabel kategorikal, χ², & Cramér\'s V',
    summary: 'Memeriksa tabel silang frekuensi serta menguji independensi hubungan antara dua variabel kategorikal.',
    when: [
      'Menganalisis asosiasi dua variabel nominal/ordinal (mis. Jenis Kelamin × Preferensi).'
    ],
    assumptions: [
      'Observasi independen (setiap subjek hanya berada di 1 sel).',
      'Frekuensi harapan (expected count) ≥ 5 pada minimal 80% sel; untuk tabel 2×2 kecil periksa Fisher\'s Exact Test.'
    ],
    metrics: [
      { k: 'Pearson χ²', v: 'p < 0.05 menolak hipotesis nol independensi.' },
      { k: 'Cramér\'s V / Phi', v: 'Kekuatan asosiasi bebas ukuran sampel (0.10 kecil, 0.30 sedang, 0.50 besar untuk df=1).' },
      { k: 'Fisher\'s Exact', v: 'Otomatis akurat untuk tabel 2×2 dengan sel ekspektasi < 5.' }
    ],
    interpretation: 'Jika χ² signifikan, tinjau perbedaan proporsi antar baris/kolom untuk memahami arah asosiasi.'
  }
});
