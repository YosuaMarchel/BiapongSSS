"use strict";

const CONFIG = Object.freeze({
  HARGA_NORMAL: 15000,
  VARIAN: Object.freeze([
    "Babi", "Ayam", "Coklat", "Keju", "Tousa",
    "Kacang Hijau", "Kacang Merah", "Kacang Tanah",
  ]),
  PROMO_OPTIONS: Object.freeze([
    "Tanpa Promo", "Beli 2 harga 25rb", "Beli 2 Gratis 1", "Follow Sosmed",
  ]),
  STATUS_PESANAN: Object.freeze([
    "Dipesan", "Ada di Kukusan", "Siap Diambil", "Sudah Diambil", "Batal",
  ]),
  STATUS_BAYAR: Object.freeze(["Sudah Dibayar", "Belum Dibayar"]),
  BAYAR_VIA_OPTIONS: Object.freeze(["Tunai", "QRIS", "Transfer"]),

  STOK_HABIS_THRESHOLD: 0,
  STOK_MENIPIS_THRESHOLD: 5,
  MAX_QTY_PER_VARIAN: 99,
  MAX_STOK_VALUE: 999,
  MAX_NAMA_LENGTH: 100,
  MAX_TRANSAKSI_PER_DAY: 100,
  DEFAULT_TIMER_MINUTES: 10,
  DAY_CHECK_INTERVAL_MS: 60000,
  TIMER_BEEP_FREQ_1: 880,
  TIMER_BEEP_FREQ_2: 1100,
  TIMER_BEEP_DURATION_MS: 500,
  TIMER_BEEP_DELAY_MS: 600,

  PESANAN_BADGE_MAP: Object.freeze({
    "Dipesan": "badge-dipesan",
    "Ada di Kukusan": "badge-kukusan",
    "Siap Diambil": "badge-siap",
    "Sudah Diambil": "badge-diambil",
    "Batal": "badge-batal",
  }),
  BAYAR_BADGE_MAP: Object.freeze({
    "Belum Dibayar": "badge-belum-bayar",
    "Sudah Dibayar": "badge-sudah-bayar",
  }),
  STOK_STATUS_MAP: Object.freeze({
    "HABIS": "status-stok-habis",
    "Menipis": "status-stok-menipis",
    "Tersedia": "status-stok-tersedia",
  }),

  EXCEL_VARIAN_COLUMNS: Object.freeze({
    "Babi": "D", "Ayam": "E", "Coklat": "F", "Keju": "G",
    "Tousa": "H", "Kacang Hijau": "I", "Kacang Merah": "J", "Kacang Tanah": "K",
  }),
});
