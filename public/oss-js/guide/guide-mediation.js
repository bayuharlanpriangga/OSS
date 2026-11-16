// GUIDE — Mediation Analysis
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  mediation: {
    title: 'Mediation Analysis (Bootstrap)',
    subtitle: 'Dekomposisi efek langsung, tidak langsung (a×b), & uji Sobel/Bootstrap',
    summary: 'Menguji mekanisme bagaimana variabel X memengaruhi Y melalui variabel perantara M dengan membagi efek total (c) menjadi efek langsung (c\') dan efek tidak langsung (a × b).',
    when: [
      'Menjawab pertanyaan "mengapa" atau "melalui proses apa" X berdampak pada Y.'
    ],
    formula: 'Total (c) = Direct (c\') + Indirect (a × b)',
    assumptions: [
      'Urutan kausal X → M → Y masuk akal secara teori dan waktu.',
      'Tidak ada confounder tak terukur yang mengacaukan M → Y.'
    ],
    metrics: [
      { k: 'Indirect (a × b)', v: 'Signifikan bila Bootstrap 95% CI tidak melewati angka 0.' },
      { k: 'Full vs Partial', v: 'Full mediation: a×b signifikan dan c\' tidak signifikan; Partial: keduanya signifikan.' },
      { k: 'Inconsistent Mediation', v: 'Jika arah a×b dan c\' berlawanan tanda (suppression effect).' }
    ],
    interpretation: 'Di literatur modern (Hayes), efek tidak langsung (a×b) bermakna bila 95% Bootstrap CI seluruhnya di atas atau di bawah 0, bahkan tanpa mensyaratkan efek total c signifikan.'
  }
});
