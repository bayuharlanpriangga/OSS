// GUIDE — Moderation Analysis (Interaction, Simple Slopes, Johnson-Neyman)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  moderation: {
    title: 'Moderation Analysis (X × W → Y)',
    subtitle: 'Uji interaksi antara prediktor X dan moderator W',
    summary: 'Menguji apakah kekuatan atau arah pengaruh X terhadap Y berubah bergantung pada nilai variabel moderator W.',
    when: [
      'Menjawab pertanyaan "kapan" atau "untuk siapa" hubungan X → Y berlaku lebih kuat atau melemah.'
    ],
    formula: 'Y = b₀ + b₁X_c + b₂W_c + b₃(X_c × W_c) + ε',
    assumptions: [
      'Mean-centering pada X dan W disarankan untuk menekan kolinearitas suku interaksi serta memudahkan interpretasi b₁ dan b₂.'
    ],
    metrics: [
      { k: 'Interaction b₃ (X×W)', v: 'Jika p < 0.05, moderasi terbukti secara statistik.' },
      { k: 'ΔR² Interaction', v: 'Tambahan varians Y yang dijelaskan khusus oleh interaksi X × W.' }
    ],
    interpretation: 'Apabila interaksi b₃ signifikan, lanjutkan ke tab Simple Slopes dan Johnson-Neyman untuk mengurai pola efek kondisional.'
  },
  simpleslopes: {
    title: 'Simple Slopes Analysis (Pick-a-Point)',
    subtitle: 'Efek kondisional X → Y pada level W Rendah (−1 SD), Rata-rata, & Tinggi (+1 SD)',
    summary: 'Menguji dan memvisualisasikan kemiringan regresi X terhadap Y pada tiga titik perwakilan moderator W guna menerjemahkan suku interaksi.',
    when: [
      'Setelah uji Moderasi mendeteksi interaksi X × W signifikan (atau mendekati signifikan).'
    ],
    assumptions: [
      'Model interaksi linier dengan kovarians parameter yang valid.'
    ],
    metrics: [
      { k: 'Slope @ −1 SD / Mean / +1 SD', v: 'Menunjukkan besar & signifikansi efek X pada kondisi W rendah, sedang, dan tinggi.' },
      { k: 'Interaction Lines Plot', v: 'Kemiringan garis yang berbeda atau bersilangan memperlihatkan arah moderasi.' }
    ],
    interpretation: 'Amati pada level W manakah slope X menjadi signifikan (p < 0.05) dan bagaimana kemiringannya berubah.'
  },
  jn: {
    title: 'Johnson-Neyman Floodlight Analysis',
    subtitle: 'Menemukan batas presisi nilai W tempat efek X → Y menjadi signifikan',
    summary: 'Berbeda dengan metode ±1 SD yang memilih 3 titik sembarang, Johnson-Neyman menelusuri seluruh rentang W secara kontinyu untuk menentukan Region of Significance.',
    when: [
      'Moderator W berskala numerik kontinyu dan Anda ingin mengetahui titik potong persis W di mana efek X aktif.'
    ],
    assumptions: [
      'Moderator W berupa variabel numerik dengan sebaran memadai.'
    ],
    metrics: [
      { k: 'Threshold W*', v: 'Titik nilai W tempat 95% pita kepercayaan slope menyentuh garis 0.' },
      { k: 'Region of Significance', v: 'Rentang nilai W (dan % sampel) di mana pengaruh X terhadap Y signifikan.' }
    ],
    interpretation: 'Laporkan nilai ambang W* serta persentase observasi yang berada di dalam wilayah signifikansi.'
  }
});
