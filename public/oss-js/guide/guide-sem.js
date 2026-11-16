// GUIDE — Structural Equation Modeling (SEM)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  sem: {
    title: 'Structural Equation Modeling (SEM)',
    subtitle: 'Pemodelan simultan Measurement Model (CFA) & Structural Paths',
    summary: 'Menguji jaringan hubungan sebab-akibat antar konstruk laten beserta model pengukurannya secara simultan menggunakan estimator Maximum Likelihood.',
    when: [
      'Menguji model teoretis kompleks dengan beberapa variabel laten eksogen, mediator, dan endogen.'
    ],
    assumptions: [
      'Normalitas multivariat dan ukuran sampel memadai (umumnya N ≥ 150–200 atau ≥ 5–10 per parameter).',
      'Setiap konstruk laten diukur oleh indikator reflektif yang jelas.'
    ],
    metrics: [
      { k: 'χ²/df ≤ 3.0', v: 'Rasio chi-square terhadap derajat bebas (sensitif terhadap N besar).' },
      { k: 'CFI ≥ 0.95 (≥ 0.90)', v: 'Comparative Fit Index (Hu & Bentler, 1999).' },
      { k: 'TLI ≥ 0.90', v: 'Tucker-Lewis Index.' },
      { k: 'RMSEA ≤ 0.06 (≤ 0.08)', v: 'Root Mean Square Error of Approximation.' },
      { k: 'SRMR ≤ 0.08', v: 'Standardized Root Mean Square Residual.' }
    ],
    formula: 'Sintaks Jalur:  Y ~ X1 + X2   |   Faktor Laten:  L1 =~ x1 + x2 + x3',
    interpretation: 'Pastikan terlebih dahulu Measurement Model memenuhi validitas (λ ≥ 0.50, AVE ≥ 0.50, CR ≥ 0.70) sebelum menafsirkan koefisien jalur struktural (β, z, p, R²).'
  }
});
