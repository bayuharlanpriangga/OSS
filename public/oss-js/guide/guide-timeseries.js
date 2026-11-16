// GUIDE — Time Series Analysis
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  timeseries: {
    title: 'Time Series Analysis',
    subtitle: 'Tren, Dekomposisi Musiman, ACF/PACF, Uji Stasioneritas, & Peramalan',
    summary: 'Menganalisis deret waktu berurutan untuk mengekstrak tren jangka panjang, pola musiman (seasonal), autokorelasi lag (ACF/PACF), serta menghasilkan peramalan dengan batas kepercayaan.',
    when: [
      'Data diobservasi berurutan sepanjang waktu (harian, bulanan, kuartalan, tahunan).'
    ],
    assumptions: [
      'Baris dataset sudah terurut kronologis dari waktu paling awal hingga terbaru.'
    ],
    metrics: [
      { k: 'SMA / Exponential / Holt', v: 'Metode peramalan mulai dari deret datar hingga deret bertren & musiman.' },
      { k: 'ACF & PACF', v: 'Menunjukkan ketergantungan antar lag waktu untuk identifikasi orde AR/MA.' },
      { k: 'MAPE / RMSE', v: 'Akurasi peramalan in-sample; semakin kecil semakin tepat.' }
    ],
    interpretation: 'Periksa plot dekomposisi terlebih dahulu untuk memastikan ada atau tidaknya komponen tren dan siklus musiman.'
  }
});
