// GUIDE — Regression (Simple, Multiple, Hierarchical, Logistic, Poisson, NegBin)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  regression: {
    title: 'Simple Linear Regression',
    subtitle: 'Pemodelan garis linier Y = b₀ + b₁X & diagnostik residu',
    summary: 'Memodelkan pengaruh satu prediktor numerik (X) terhadap satu variabel dependen numerik (Y) serta mengevaluasi proporsi varians yang dijelaskan.',
    when: [
      'Memprediksi Y dari satu X dan mengestimasi perubahan rata-rata Y per 1 unit kenaikan X.'
    ],
    assumptions: [
      'Linearitas, independensi residu (Durbin-Watson ≈ 2), homoskedastisitas, dan normalitas residu.'
    ],
    metrics: [
      { k: 'b₁ (Slope) & β', v: 'Perubahan Y per unit X; β adalah koefisien terstandardisasi.' },
      { k: 'R²', v: 'Proporsi varians Y yang dijelaskan oleh X.' },
      { k: 'Residual SE', v: 'Rata-rata kesalahan prediksi dalam satuan Y.' }
    ],
    interpretation: 'Periksa F-test model, signifikansi slope t(b₁), serta plot residual vs fitted untuk memastikan pola tidak melengkung atau menyebar (heteroskedastik).'
  },
  multipleReg: {
    title: 'Multiple Linear Regression',
    subtitle: 'Regresi berganda dengan VIF, Cook\'s D, & beta terstandardisasi',
    summary: 'Mengestimasi pengaruh independen beberapa prediktor (X₁, X₂, ..., Xₖ) secara bersamaan terhadap Y dengan mengontrol prediktor lainnya.',
    when: [
      'Lebih dari 1 prediktor numerik/dummy memprediksi satu outcome kontinu.'
    ],
    assumptions: [
      'Tidak ada multikolinearitas serius (VIF < 5, aman < 10; Tolerance > 0.2).',
      'Linearitas, homoskedastisitas, normalitas residu, dan tidak ada titik berpengaruh ekstrem (Cook\'s D < 1).'
    ],
    metrics: [
      { k: 'Adjusted R²', v: 'Lebih akurat daripada R² karena menyesuaikan jumlah prediktor k.' },
      { k: 'β (Std Beta)', v: 'Membandingkan kekuatan relatif antar prediktor beda skala.' },
      { k: 'VIF & Tolerance', v: 'Diagnostik kolinearitas antar prediktor.' }
    ],
    interpretation: 'Koefisien B menunjukkan efek parsial ketika prediktor lain konstan; gunakan Adjusted R² untuk membandingkan model bersarang.'
  },
  hierarchicalReg: {
    title: 'Hierarchical Regression',
    subtitle: 'Evaluasi bertahap per Block prediktor (ΔR² & F-change)',
    summary: 'Memasukkan prediktor dalam urutan blok yang ditentukan teori untuk menguji apakah blok baru memberi tambahan daya jelas (ΔR²) secara signifikan di atas blok sebelumnya.',
    when: [
      'Mengontrol kovariat demografis pada Block 1 sebelum menguji variabel penelitian utama pada Block 2/3.'
    ],
    assumptions: [
      'Semua asumsi regresi linier berganda terpenuhi pada model akhir.',
      'Urutan blok ditentukan berdasarkan landasan teoretis, bukan eksplorasi acak.'
    ],
    metrics: [
      { k: 'ΔR² (R² Change)', v: 'Tambahan varians Y yang dijelaskan khusus oleh blok terbaru.' },
      { k: 'F-change & p', v: 'Menguji apakah kenaikan R² antar blok bermakna secara statistik.' },
      { k: 'Model Fit per Block', v: 'Pantau perubahan AIC, Adjusted R², dan β tiap tahap.' }
    ],
    interpretation: 'Jika F-change pada Block 2 signifikan (p < 0.05), prediktor pada Block 2 menyumbang prediksi unik melampaui variabel kontrol di Block 1.'
  },
  logistic: {
    title: 'Binary Logistic Regression',
    subtitle: 'Pemodelan outcome biner (0/1) dengan Odds Ratio & klasifikasi',
    summary: 'Memprediksi probabilitas kejadian biner (Ya/Tidak, Berhasil/Gagal) menggunakan fungsi link logit log(p / (1−p)) = Xβ.',
    when: [
      'Variabel dependen bersifat dikotomus (tepat 2 kategori unik).'
    ],
    assumptions: [
      'Linearitas antara prediktor kontinu dan log-odds (logit).',
      'Independensi observasi dan tidak ada pemisahan sempurna (quasi/complete separation).'
    ],
    metrics: [
      { k: 'OR = exp(B)', v: 'Odds Ratio: > 1 meningkatkan peluang kejadian; < 1 menurunkan peluang.' },
      { k: 'Wald z / χ²', v: 'Signifikansi kontribusi masing-masing prediktor.' },
      { k: 'Nagelkerke / McFadden R²', v: 'Pseudo-R² sebagai ukuran kecocokan model.' },
      { k: 'Accuracy & Confusion Matrix', v: 'Ketepatan klasifikasi pada ambang cut-off 0.5.' }
    ],
    interpretation: 'Laporkan B, SE, Odds Ratio (Exp(B)) beserta 95% CI, Likelihood Ratio χ², dan persentase klasifikasi benar.'
  },
  'glm-poisson': {
    title: 'Poisson Regression',
    subtitle: 'GLM data hitungan / frekuensi non-negatif (link log)',
    summary: 'Memodelkan variabel dependen berupa cacahan/frekuensi kejadian bulat non-negatif (0, 1, 2, ...) dengan fungsi link logaritma natural log(μ) = Xβ.',
    when: [
      'Outcome berupa jumlah kejadian (jumlah kunjungan, cacat produk, insiden) dengan mean dan varians sebanding.'
    ],
    formula: 'log(μ) = β₀ + β₁X₁ + ... + βₖXₖ   |   IRR = exp(β)',
    assumptions: [
      'Variabel dependen berupa integer ≥ 0.',
      'Equidispersion: varians ≈ rata-rata (Pearson Dispersion χ²/df mendekati 1.0).'
    ],
    metrics: [
      { k: 'IRR (exp(β))', v: 'Incidence Rate Ratio — perubahan multiplikatif pada laju kejadian per 1 unit prediktor.' },
      { k: 'Dispersion (χ²/df)', v: 'Jika >> 1.5 menandakan overdispersion — pertimbangkan Negative Binomial.' },
      { k: 'Deviance & McFadden R²', v: 'Kesesuaian model (Deviance lebih kecil lebih baik).' },
      { k: 'LR χ²', v: 'Uji Likelihood Ratio membandingkan model penuh vs model null.' }
    ],
    interpretation: 'IRR = 1.25 berarti setiap kenaikan 1 unit X menaikkan laju kejadian sebesar 25%. Jika dispersion > 1.5, periksa hasil dengan Negative Binomial.'
  },
  'glm-negbin': {
    title: 'Negative Binomial Regression',
    subtitle: 'Regresi data hitungan dengan overdispersion (NB2)',
    summary: 'Perluasan regresi Poisson yang menyertakan parameter dispersi θ untuk memodelkan varians berlebih (Var(Y) = μ + μ²/θ > μ) pada data cacahan.',
    when: [
      'Data hitungan menunjukkan overdispersion (varians jauh melebihi rata-rata atau dispersion Poisson >> 1.5).'
    ],
    formula: 'log(μ) = Xβ   |   Var(Y) = μ + αμ² (α = 1/θ)',
    assumptions: [
      'Outcome berupa bilangan cacah non-negatif (0, 1, 2, ...).',
      'Kejadian dapat dimodelkan dengan heterogenitas laju antar individu (distribusi Gamma-Poisson).'
    ],
    metrics: [
      { k: 'θ (Theta) & α', v: 'Parameter dispersi; makin kecil θ berarti heterogenitas/overdispersion makin tinggi.' },
      { k: 'IRR (exp(β))', v: 'Rasio laju kejadian dengan standard error yang telah dikoreksi untuk overdispersion.' },
      { k: 'Pearson Dispersion', v: 'Setelah koreksi NB2, nilai seharusnya mendekati ~1.0.' }
    ],
    interpretation: 'Negative Binomial mencegah standard error terlalu sempit (positif palsu) yang sering terjadi jika tetap memaksakan Poisson pada data overdispersed.'
  }
});
