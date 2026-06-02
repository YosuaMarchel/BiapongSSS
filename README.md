# 🥟 Biapong SSS — Sistem Penjualan Biapong Cross-Platform

Aplikasi web untuk mengelola penjualan **Biapong (Bakpiong/Pao)** — makanan berupa roti kukus isi — yang dirancang untuk membantu operasional harian sebuah usaha kecil. Dibangun dengan HTML, CSS, dan JavaScript murni tanpa framework, sehingga ringan dan bisa dijalankan langsung di browser mana saja.

---

## ✨ Fitur Utama

### 📦 Manajemen Stok
- Pelacakan stok harian untuk **8 varian produk**: Babi, Ayam, Coklat, Keju, Tousa, Kacang Hijau, Kacang Merah, dan Kacang Tanah
- Indikator level stok real-time (tersedia, hampir habis, habis)
- Setup stok awal dan pengeditan kapasitas
- Perhitungan pendapatan otomatis per varian

### 🧾 Manajemen Transaksi
- Buat pesanan baru dengan nama pelanggan, pilihan promo, dan jumlah per varian
- **Promo yang didukung:**
  - Harga normal (Rp 15.000/pcs)
  - Beli 2 harga 25rb
  - Beli 2 Gratis 1
  - Follow sosial media (Rp 10.000 untuk pcs pertama)
- Tracking status pesanan: Dipesan → Dalam Kukusan → Siap Diambil → Sudah Diambil / Dibatalkan
- Tracking status pembayaran: Lunas/Belum dibayar dengan metode (Cash/QRIS/Transfer)
- Filter lanjutan berdasarkan nama pelanggan, status pesanan, dan status pembayaran
- Edit/hapus transaksi (dinonaktifkan untuk pesanan yang sudah selesai)

### ⏱️ Timer Kukusan
- Timer countdown yang dapat dikonfigurasi (default 10 menit)
- Tampilan visual dengan warna berdasarkan status
- **Notifikasi browser** dan **alert audio** saat kukusan selesai
- Judul tab browser menampilkan sisa waktu kukusan aktif

### 📊 Ekspor & Impor Data
- Ekspor laporan harian ke **Excel** dengan format yang rapi
- Impor data dari file Excel
- Reset data harian
- Deteksi dan penanganan otomatis perpindahan tanggal

---

## 🛠️ Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Penyimpanan | Browser LocalStorage |
| Excel | [ExcelJS 4.4.0](https://github.com/exceljs/exceljs) (via CDN) |
| Font | Google Fonts — [Nunito](https://fonts.google.com/specimen/Nunito) |
| Notifikasi | Browser Notification API & Web Audio API |

> Tidak memerlukan backend, database server, atau proses build. Cukup buka di browser.

---

## 📂 Struktur Proyek

```
biapong_sss_cross_platform/
├── index.html              # Halaman utama
├── css/
│   └── style.css           # Seluruh styling (tema warm & cozy)
├── js/
│   ├── config.js           # Konstanta & konfigurasi
│   ├── utils.js            # Fungsi utilitas umum
│   ├── calculations.js     # Logika bisnis & perhitungan
│   ├── validators.js       # Validasi input
│   ├── storage.js          # Wrapper LocalStorage
│   ├── components.js       # Komponen UI & interaksi
│   ├── stok.js             # Modul manajemen stok
│   ├── transaksi.js        # Modul manajemen transaksi
│   ├── kukusan.js          # Modul timer kukusan
│   ├── exporter.js         # Fungsi ekspor ke Excel
│   ├── importer.js         # Fungsi impor dari Excel
│   └── app.js              # Orkestrasi utama aplikasi
└── .claude/                # Konfigurasi Claude Code
```

---

## 🚀 Cara Menjalankan

### Opsi 1: Buka Langsung di Browser
Cukup klik dua kali file `index.html` — aplikasi akan langsung berjalan.

### Opsi 2: Local Web Server (Direkomendasikan)
```bash
# Menggunakan Python
python -m http.server 8000

# Menggunakan Node.js
npx http-server

# Lalu buka di browser: http://localhost:8000
```

### Persyaratan
- Browser modern (Chrome, Firefox, Safari, Edge)
- Koneksi internet (untuk memuat ExcelJS CDN dan Google Fonts)
- JavaScript diaktifkan
- Browser mendukung LocalStorage

---

## ⚙️ Konfigurasi

Semua konfigurasi tersentralisasi di [js/config.js](js/config.js). Beberapa parameter penting:

| Konstanta | Default | Keterangan |
|---|---|---|
| `HARGA_NORMAL` | `15000` | Harga per pcs |
| `VARIAN` | 8 varian | Daftar varian produk |
| `DEFAULT_TIMER_MINUTES` | `10` | Durasi kukusan default (menit) |
| `MAX_TRANSACTION_QTY` | — | Batas maksimal kuantitas per transaksi |

---

## 🎨 Desain UI

- Tema **warm & cozy** dengan palet warna oranye/cokelat
- Desain responsif untuk desktop dan mobile
- Modal dialog kustom (tanpa `alert()` bawaan browser)
- Navigasi berbasis tab
- Slide-out menu untuk aksi tambahan
- Aksesibilitas dengan ARIA labels dan semantic HTML

---

## 📄 Lisensi

Proyek ini bersifat pribadi untuk penggunaan internal usaha Biapong SSS.
