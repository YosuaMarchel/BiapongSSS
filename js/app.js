"use strict";

const App = (() => {
  let currentDateKey = Utils.todayKey();
  let dayCheckTimer = null;

  function getDateKey() { return currentDateKey; }

  function resetHariIni() {
    const tanggal = currentDateKey;
    const transaksiList = DataStore.getTransaksiList(tanggal);

    if (transaksiList.length === 0) {
      Components.showAlert("Info", "Tidak ada data transaksi hari ini untuk direset.");
      return;
    }

    Components.showConfirm("Reset Hari Ini",
      `Semua data hari ini akan dihapus:\n• ${transaksiList.length} transaksi\n• Stok awal\n• Semua timer aktif\n\nPastikan sudah export ke Excel jika perlu menyimpan data. Lanjutkan?`,
      () => {
        DataStore.clearDayData(tanggal);
        StokModule.refresh();
        TransaksiModule.refresh();
        KukusanModule.refresh();
        Components.showAlert("Berhasil", "Semua data hari ini sudah direset.");
      });
  }

  function toggleMenu() {
    const menu = document.getElementById("slide-menu");
    const overlay = document.getElementById("slide-menu-overlay");
    const btn = document.getElementById("btn-menu-toggle");
    const isOpen = menu.classList.contains("open");
    if (isOpen) {
      menu.classList.remove("open");
      overlay.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    } else {
      menu.classList.add("open");
      overlay.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    }
  }

  function closeMenu() {
    document.getElementById("slide-menu").classList.remove("open");
    document.getElementById("slide-menu-overlay").classList.remove("open");
    document.getElementById("btn-menu-toggle").setAttribute("aria-expanded", "false");
  }

  function init() {
    document.getElementById("header-date").textContent = Utils.formatTanggal(new Date());
    document.getElementById("timer-duration").value = DataStore.getDefaultTimerDuration();

    Components.buildQtyGrid("qty-grid-transaksi", "qty", CONFIG.MAX_QTY_PER_VARIAN, TransaksiModule.updatePreview);
    Components.buildQtyGrid("stok-edit-grid", "stok-input", CONFIG.MAX_STOK_VALUE);

    StokModule.refresh();
    TransaksiModule.refresh();
    KukusanModule.refresh();

    dayCheckTimer = setInterval(() => {
      const newKey = Utils.todayKey();
      if (newKey !== currentDateKey) {
        Components.showConfirm("Tanggal Berganti",
          "Tanggal sudah berganti. Buat data baru untuk hari ini?",
          () => {
            currentDateKey = newKey;
            document.getElementById("header-date").textContent = Utils.formatTanggal(new Date());
            StokModule.refresh();
            TransaksiModule.refresh();
            KukusanModule.refresh();
          });
      }
    }, CONFIG.DAY_CHECK_INTERVAL_MS);

    // Wire button events
    document.getElementById("btn-simpan-stok").addEventListener("click", StokModule.simpanStok);
    document.getElementById("btn-refresh-stok").addEventListener("click", StokModule.refresh);
    document.getElementById("btn-tambah-transaksi").addEventListener("click", TransaksiModule.tambahTransaksi);
    document.getElementById("btn-reset-form").addEventListener("click", TransaksiModule.resetForm);
    document.getElementById("btn-update-status").addEventListener("click", TransaksiModule.updateSelectedStatus);
    document.getElementById("btn-refresh-transaksi").addEventListener("click", TransaksiModule.refresh);

    // Filter events
    document.getElementById("btn-reset-filter").addEventListener("click", TransaksiModule.resetFilters);
    document.getElementById("filter-nama").addEventListener("input", TransaksiModule.refresh);
    document.getElementById("filter-status-pesanan").addEventListener("change", TransaksiModule.refresh);
    document.getElementById("filter-status-bayar").addEventListener("change", TransaksiModule.refresh);
    document.getElementById("btn-save-duration").addEventListener("click", KukusanModule.saveDefaultDuration);
    document.getElementById("btn-refresh-kukusan").addEventListener("click", KukusanModule.refresh);
    document.getElementById("btn-export-excel").addEventListener("click", () => { closeMenu(); Exporter.exportToExcel(currentDateKey); });
    document.getElementById("btn-import-excel").addEventListener("click", () => { closeMenu(); Importer.triggerImport(); });
    document.getElementById("btn-reset-hari").addEventListener("click", () => { closeMenu(); resetHariIni(); });
    document.getElementById("btn-menu-toggle").addEventListener("click", toggleMenu);
    document.getElementById("btn-menu-close").addEventListener("click", closeMenu);
    document.getElementById("slide-menu-overlay").addEventListener("click", closeMenu);

    // Tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => Components.switchTab(btn.dataset.tab));
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  return Object.freeze({ getDateKey, init, toggleMenu, closeMenu });
})();
