"use strict";

const Exporter = (() => {
  // ── Shared Styles ─────────────────────────────────
  const FONT = "Segoe UI";
  const CLR_PRIMARY = "2563EB";
  const CLR_PRIMARY_BG = "DBEAFE";
  const CLR_HEADER_BG = "1E3A5F";
  const CLR_TOTAL_BG = "E8F0FE";
  const CLR_SECTION_BG = "F1F5F9";
  const CLR_ALT_ROW = "F8FAFC";
  const CLR_BORDER = "B0BEC5";
  const CLR_WHITE = "FFFFFF";

  const thinBorder = {
    top: { style: "thin", color: { argb: CLR_BORDER } },
    left: { style: "thin", color: { argb: CLR_BORDER } },
    bottom: { style: "thin", color: { argb: CLR_BORDER } },
    right: { style: "thin", color: { argb: CLR_BORDER } },
  };

  function applyBorder(cell) {
    cell.border = thinBorder;
  }

  function applyHeaderStyle(cell) {
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: CLR_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR_HEADER_BG } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thinBorder;
  }

  function applyTotalStyle(cell) {
    cell.font = { name: FONT, size: 10, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR_TOTAL_BG } };
    cell.alignment = { vertical: "middle" };
    cell.border = thinBorder;
  }

  function applyDataStyle(cell, isAlt, align) {
    cell.font = { name: FONT, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isAlt ? CLR_ALT_ROW : CLR_WHITE } };
    cell.alignment = { vertical: "middle", horizontal: align || "left" };
    cell.border = thinBorder;
  }

  function applyTitleStyle(cell) {
    cell.font = { name: FONT, size: 14, bold: true, color: { argb: CLR_PRIMARY } };
    cell.alignment = { vertical: "middle" };
  }

  function applySectionTitleStyle(cell) {
    cell.font = { name: FONT, size: 11, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR_SECTION_BG } };
    cell.alignment = { vertical: "middle" };
  }

  function styleCurrencyCell(cell, isAlt) {
    applyDataStyle(cell, isAlt, "right");
    cell.numFmt = '#,##0';
  }

  // ── Export ────────────────────────────────────────
  async function exportToExcel(tanggal) {
    if (typeof ExcelJS === "undefined") {
      Components.showAlert("Error", "Library ExcelJS belum dimuat. Pastikan ada koneksi internet.");
      return;
    }

    const stokDict = DataStore.getStokHarian(tanggal);
    const transaksiList = DataStore.getTransaksiList(tanggal);
    const terjualPerVarian = Calculations.hitungTerjualPerVarian(transaksiList);
    const wb = new ExcelJS.Workbook();
    wb.creator = "Biapong SSS";
    wb.created = new Date();

    const dateObj = new Date(tanggal + "T00:00:00");
    const tanggalStr = Utils.formatTanggal(dateObj);

    // ══════════════════════════════════════════════════
    //  SHEET 1: RINGKASAN
    // ══════════════════════════════════════════════════
    const ws1 = wb.addWorksheet("Ringkasan", {
      properties: { tabColor: { argb: CLR_PRIMARY } },
    });

    // Column widths
    ws1.columns = [
      { width: 20 }, { width: 16 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 18 },
    ];

    // Row 1: Title
    const titleRow = ws1.addRow(["LAPORAN PENJUALAN BIAPONG SSS"]);
    ws1.mergeCells("A1:F1");
    applyTitleStyle(titleRow.getCell(1));
    titleRow.height = 30;

    // Row 2: empty
    ws1.addRow([]);

    // Row 3: Tanggal
    const dateRow = ws1.addRow(["Tanggal", tanggalStr]);
    dateRow.getCell(1).font = { name: FONT, size: 10, bold: true };
    dateRow.getCell(2).font = { name: FONT, size: 10 };
    ws1.mergeCells("B3:F3");

    // Row 4: empty
    ws1.addRow([]);

    // Row 5: Section header - STOK
    const stokSectionRow = ws1.addRow(["STOK & PENDAPATAN PER VARIAN"]);
    ws1.mergeCells("A5:F5");
    applySectionTitleStyle(stokSectionRow.getCell(1));
    for (let c = 2; c <= 6; c++) applySectionTitleStyle(stokSectionRow.getCell(c));

    // Row 6: Table header
    const stokHeaderRow = ws1.addRow(["No", "Varian", "Stok Awal", "Terjual", "Sisa", "Pendapatan"]);
    stokHeaderRow.height = 22;
    for (let c = 1; c <= 6; c++) applyHeaderStyle(stokHeaderRow.getCell(c));

    // Rows 7+: Stok data
    let totalStokAwal = 0, totalTerjual = 0, totalSisa = 0, totalPendapatan = 0;
    CONFIG.VARIAN.forEach((v, i) => {
      const awal = stokDict[v] || 0;
      const terjual = terjualPerVarian[v];
      const sisa = awal - terjual;
      const pendapatan = terjual * CONFIG.HARGA_NORMAL;
      totalStokAwal += awal;
      totalTerjual += terjual;
      totalSisa += sisa;
      totalPendapatan += pendapatan;

      const row = ws1.addRow([i + 1, v, awal, terjual, sisa, pendapatan]);
      const isAlt = i % 2 === 1;
      applyDataStyle(row.getCell(1), isAlt, "center");
      applyDataStyle(row.getCell(2), isAlt);
      applyDataStyle(row.getCell(3), isAlt, "center");
      applyDataStyle(row.getCell(4), isAlt, "center");
      applyDataStyle(row.getCell(5), isAlt, "center");
      styleCurrencyCell(row.getCell(6), isAlt);
    });

    // Total row
    const stokTotalRow = ws1.addRow(["", "TOTAL", totalStokAwal, totalTerjual, totalSisa, totalPendapatan]);
    for (let c = 1; c <= 6; c++) applyTotalStyle(stokTotalRow.getCell(c));
    stokTotalRow.getCell(6).numFmt = '#,##0';

    // Empty row
    ws1.addRow([]);

    // RINGKASAN section
    const ringkasanSectionRow = ws1.addRow(["RINGKASAN"]);
    ws1.mergeCells(ringkasanSectionRow.getCell(1).address + ":" + ringkasanSectionRow.getCell(6).address);
    applySectionTitleStyle(ringkasanSectionRow.getCell(1));
    for (let c = 2; c <= 6; c++) applySectionTitleStyle(ringkasanSectionRow.getCell(c));

    const transSelesai = transaksiList.filter(t => t.statusPesanan === "Sudah Diambil").length;
    const transBatal = transaksiList.filter(t => t.statusPesanan === "Batal").length;
    const sudahBayar = transaksiList.filter(t => t.statusBayar === "Sudah Dibayar").length;
    const belumBayar = transaksiList.filter(t => t.statusBayar === "Belum Dibayar").length;

    const summaryData = [
      ["Total Transaksi", transaksiList.length],
      ["Transaksi Selesai", transSelesai],
      ["Transaksi Batal", transBatal],
      ["Total Pendapatan", totalPendapatan],
      ["Sudah Dibayar", sudahBayar + " transaksi"],
      ["Belum Dibayar", belumBayar + " transaksi"],
    ];
    summaryData.forEach((item, i) => {
      const row = ws1.addRow(item);
      ws1.mergeCells(row.getCell(2).address + ":" + row.getCell(6).address);
      row.getCell(1).font = { name: FONT, size: 10, bold: true };
      row.getCell(1).border = thinBorder;
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 1 ? CLR_ALT_ROW : CLR_WHITE } };
      row.getCell(2).font = { name: FONT, size: 10 };
      row.getCell(2).border = thinBorder;
      row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 1 ? CLR_ALT_ROW : CLR_WHITE } };
      if (item[0] === "Total Pendapatan") {
        row.getCell(2).numFmt = '#,##0';
      }
    });

    // ══════════════════════════════════════════════════
    //  SHEET 2: TRANSAKSI
    // ══════════════════════════════════════════════════
    const ws2 = wb.addWorksheet("Transaksi", {
      properties: { tabColor: { argb: "16A34A" } },
    });

    ws2.columns = [
      { width: 5 }, { width: 20 }, { width: 30 }, { width: 6 },
      { width: 18 }, { width: 16 }, { width: 16 }, { width: 16 },
      { width: 10 }, { width: 20 },
    ];

    // Row 1: Title
    const transTitleRow = ws2.addRow(["DAFTAR TRANSAKSI - " + tanggalStr]);
    ws2.mergeCells("A1:J1");
    applyTitleStyle(transTitleRow.getCell(1));
    transTitleRow.height = 30;

    // Row 2: empty
    ws2.addRow([]);

    // Row 3: Table header
    const transHeaderLabels = [
      "No", "Nama", "Pesanan", "Qty", "Promo", "Total Harga",
      "Status Pesanan", "Status Bayar", "Bayar Via", "Keterangan",
    ];
    const transHeaderRow = ws2.addRow(transHeaderLabels);
    transHeaderRow.height = 24;
    for (let c = 1; c <= 10; c++) applyHeaderStyle(transHeaderRow.getCell(c));

    // Rows 4+: Data
    const stokInfoForCheck = {};
    CONFIG.VARIAN.forEach(v => {
      stokInfoForCheck[v] = (stokDict[v] || 0) - terjualPerVarian[v];
    });

    let grandQty = 0, grandTotal = 0;
    transaksiList.forEach((t, i) => {
      const result = Calculations.hitungTotal(t.qty, t.promo);
      const summary = Calculations.varianSummary(t.qty);
      grandQty += result.totalQty;
      grandTotal += result.totalHarga;

      const row = ws2.addRow([
        i + 1, t.nama, summary, result.totalQty,
        t.promo === "Tanpa Promo" ? "-" : t.promo,
        result.totalHarga,
        t.statusPesanan, t.statusBayar, t.bayarVia || "-", t.keterangan || "-",
      ]);

      const isAlt = i % 2 === 1;
      applyDataStyle(row.getCell(1), isAlt, "center");
      applyDataStyle(row.getCell(2), isAlt);
      applyDataStyle(row.getCell(3), isAlt);
      applyDataStyle(row.getCell(4), isAlt, "center");
      applyDataStyle(row.getCell(5), isAlt, "center");
      styleCurrencyCell(row.getCell(6), isAlt);
      applyDataStyle(row.getCell(7), isAlt, "center");
      applyDataStyle(row.getCell(8), isAlt, "center");
      applyDataStyle(row.getCell(9), isAlt, "center");
      applyDataStyle(row.getCell(10), isAlt);
    });

    // Grand total row
    if (transaksiList.length > 0) {
      ws2.addRow([]);
      const totalRow = ws2.addRow(["", "", "TOTAL", grandQty, "", grandTotal]);
      for (let c = 1; c <= 10; c++) applyTotalStyle(totalRow.getCell(c));
      totalRow.getCell(6).numFmt = '#,##0';
    }

    // ══════════════════════════════════════════════════
    //  DOWNLOAD
    // ══════════════════════════════════════════════════
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Penjualan_Biapong_SSS_${tanggal}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Components.showAlert("Berhasil", `File "Penjualan_Biapong_SSS_${tanggal}.xlsx" berhasil diexport.`);
  }

  return Object.freeze({ exportToExcel });
})();
