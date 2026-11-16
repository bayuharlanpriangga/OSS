// GUIDE — Data Preparation (Transform, Recode, Filter, Weight Cases)
var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};
Object.assign(OSS_ANALYZE_GUIDES, {
  transform: {
    title: 'Transform & Compute Variable',
    subtitle: 'Standardisasi, transformasi matematika, & pembuatan variabel ekspresi baru',
    summary: 'Membuat variabel baru dari transformasi distribusi variabel yang ada (Z-score, Log, Sqrt, Min-Max, Rank) maupun ekspresi aritmatika multi-kolom (mis. skor komposit).',
    when: [
      'Menormalkan variabel yang miring (Log/Sqrt), menyamakan skala (Z-score), atau menghitung skor total/rata-rata kuesioner.'
    ],
    formula: 'Contoh Ekspresi:  (x1 + x2 + x3) / 3   |   log(pendapatan)   |   abs(a - b)',
    assumptions: [
      'Transformasi Log memerlukan nilai > 0 (gunakan Log+1 untuk nol) dan Sqrt memerlukan nilai ≥ 0.',
      'Nama variabel baru tidak boleh menduplikasi nama variabel yang sudah ada.'
    ],
    metrics: [
      { k: 'Z-Score', v: 'Mean = 0, SD = 1; standar sebelum klastering atau moderasi.' },
      { k: 'Log / Log10 / Sqrt', v: 'Mengurangi kemiringan kanan (positive skewness).' },
      { k: 'Compute Expr', v: 'Mendukung +, −, *, /, (), abs(), sqrt(), log(), exp(), round().' }
    ],
    interpretation: 'Periksa Preview sebelum menyimpan untuk memastikan nilai hasil masuk akal dan jumlah NaN tidak melonjak.'
  },
  recode: {
    title: 'Recode Variable',
    subtitle: 'Mengubah kategori nilai lama atau mengonversi numerik menjadi kelas interval',
    summary: 'Membuat variabel baru dengan memetakan nilai kategorikal tertentu (atau membalik skor negatif kuesioner) maupun mengelompokkan rentang angka menjadi label kelas.',
    when: [
      'Reverse-scoring item kuesioner (1→5, 2→4, 4→2, 5→1) atau mengategorikan skor kontinu (Rendah/Sedang/Tinggi).'
    ],
    assumptions: [
      'Pastikan aturan rentang atau nilai lama tidak saling tumpang tindih secara keliru.'
    ],
    metrics: [
      { k: 'Exact / Map', v: 'Cocokkan nilai spesifik lalu ganti dengan nilai baru (mis. reverse coding).' },
      { k: 'Range Bucketing', v: 'Memetakan interval [min..max] ke kategori baru (mis. Usia → Kelompok Umur).' }
    ],
    interpretation: 'Gunakan tab Preview untuk memverifikasi sampel hasil recode sebelum menekan tombol terapkan.'
  },
  filter: {
    title: 'Filter & Subset Cases',
    subtitle: 'Menyaring kasus aktif tanpa menghapus data mentah permanen',
    summary: 'Mengaktifkan kondisi filter logis sehingga seluruh analisis statistik sementara hanya berjalan pada himpunan baris yang memenuhi syarat.',
    when: [
      'Menganalisis sub-populasi tertentu (mis. usia >= 18 && kelompok === "Perlakuan") atau mengeksklusi outlier.'
    ],
    formula: 'Contoh Kondisi:  umur >= 18 && gender === "P"   |   skor > 50 || status === 1',
    assumptions: [
      'Operator yang didukung: ==, ===, !=, !==, >, >=, <, <=, &&, || (nilai teks diapit tanda kutip).'
    ],
    metrics: [
      { k: 'Active Cases', v: 'Jumlah baris yang lolos kondisi dan ikut dihitung di seluruh modul Analyze.' },
      { k: 'Excluded Cases', v: 'Tetap tersimpan aman di dataset dan dapat dikembalikan kapan saja dengan Reset Filter.' }
    ],
    interpretation: 'Selalu cek jumlah kasus aktif di Preview agar tidak secara tidak sengaja menyisakan N = 0.'
  },
  weightcases: {
    title: 'Weight Cases (Pembobotan Kasus)',
    subtitle: 'Memberikan bobot frekuensi atau sampling weight per observasi',
    summary: 'Mengaktifkan variabel pembobot numerik positif sehingga tiap baris merepresentasikan sejumlah observasi atau bobot survei dalam perhitungan statistik.',
    when: [
      'Data berbentuk tabel frekuensi teragregasi atau survei kompleks dengan sampling weights.'
    ],
    assumptions: [
      'Variabel bobot harus bertipe numerik; baris dengan bobot ≤ 0 atau kosong akan diabaikan saat bobot aktif.'
    ],
    metrics: [
      { k: 'Effective Weighted N', v: 'Total jumlah bobot Σw_i yang aktif digunakan oleh prosedur kompatibel.' }
    ],
    interpretation: 'Nonaktifkan pembobotan (Reset) setelah selesai bila Anda kembali bekerja dengan observasi individu biasa.'
  }
});
