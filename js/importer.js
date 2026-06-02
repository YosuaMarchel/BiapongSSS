"use strict";

const Importer = (() => {
  function cellStr(cell) {
    const v = cell.value;
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (v.richText) return v.richText.map(r => r.text).join("");
    if (v.result !== undefined) return String(v.result);
    return String(v);
  }

  function parsePesanan(text) {
    const qty = {};
    CONFIG.VARIAN.forEach(v => { qty[v] = 0; });
    if (!text || text === "-") return qty;

    const parts = String(text).split(", ");
    for (const part of parts) {
      const match = part.trim().match(/^(\d+)\s+(.+)$/);
      if (match) {
        const varian = match[2].trim();
        if (CONFIG.VARIAN.includes(varian)) {
          qty[varian] = parseInt(match[1]);
        }
      }
    }
    return qty;
  }

  function extractDateFromFilename(name) {
    const match = name.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsArrayBuffer(file);
    });
  }

  async function doImport(file, tanggal) {
    try {
      const buffer = await readFile(file);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const targetTanggal = tanggal || App.getDateKey();

      let stokCount = 0;
      let transCount = 0;

      // Parse Ringkasan sheet for stok
      const wsRingkasan = wb.getWorksheet("Ringkasan");
      if (wsRingkasan) {
        const stokDict = {};
        for (let r = 1; r <= wsRingkasan.rowCount; r++) {
          const row = wsRingkasan.getRow(r);
          const varianName = cellStr(row.getCell(2)).trim();
          if (CONFIG.VARIAN.includes(varianName)) {
            const stokAwal = parseInt(row.getCell(3).value) || 0;
            stokDict[varianName] = stokAwal;
          }
        }
        if (Object.keys(stokDict).length > 0) {
          DataStore.setStokHarian(targetTanggal, stokDict);
          stokCount = Object.keys(stokDict).length;
        }
      }

      // Parse Transaksi sheet
      const wsTransaksi = wb.getWorksheet("Transaksi");
      if (wsTransaksi) {
        const transactions = [];
        for (let r = 4; r <= wsTransaksi.rowCount; r++) {
          const row = wsTransaksi.getRow(r);
          const nama = cellStr(row.getCell(2)).trim();
          if (!nama) break;

          const pesanan = cellStr(row.getCell(3));
          const promo = cellStr(row.getCell(5));
          const statusPesanan = cellStr(row.getCell(7));
          const statusBayar = cellStr(row.getCell(8));
          const bayarVia = cellStr(row.getCell(9));
          const keterangan = cellStr(row.getCell(10));

          transactions.push({
            id: Utils.generateId(),
            nama,
            qty: parsePesanan(pesanan),
            promo: promo === "-" || !promo ? "Tanpa Promo" : promo,
            statusPesanan: statusPesanan || "Dipesan",
            statusBayar: statusBayar || "Belum Dibayar",
            bayarVia: bayarVia && bayarVia !== "-" ? bayarVia : "",
            keterangan: keterangan && keterangan !== "-" ? keterangan : "",
          });
        }
        if (transactions.length > 0) {
          DataStore.setTransaksiList(targetTanggal, transactions);
          transCount = transactions.length;
        }
      }

      StokModule.refresh();
      TransaksiModule.refresh();
      KukusanModule.refresh();

      Components.showAlert("Import Berhasil",
        `${transCount} transaksi dan ${stokCount} data stok berhasil diimport.\nTanggal: ${targetTanggal}`);

    } catch (e) {
      console.error("Import failed:", e);
      Components.showAlert("Error", `Gagal membaca file Excel:\n${e.message}`);
    }
  }

  function triggerImport() {
    if (typeof ExcelJS === "undefined") {
      Components.showAlert("Error", "Library ExcelJS belum dimuat. Pastikan ada koneksi internet.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx";
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;

      const tanggal = extractDateFromFilename(file.name);
      Components.showConfirm("Import Data",
        `File: ${file.name}${tanggal ? `\nTanggal: ${tanggal}` : `\nData akan diimport untuk hari ini (${App.getDateKey()})`}\n\nData stok dan transaksi untuk tanggal tersebut akan ditimpa. Lanjutkan?`,
        () => doImport(file, tanggal));
    };
    input.click();
  }

  return Object.freeze({ triggerImport });
})();
