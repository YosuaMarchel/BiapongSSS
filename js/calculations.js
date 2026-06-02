"use strict";

const Calculations = (() => {
  function hitungTotal(qtyPerVarian, promo) {
    const totalQty = Object.values(qtyPerVarian).reduce((s, v) => s + v, 0);
    if (totalQty === 0) return { totalQty: 0, gratis: 0, dibayar: 0, totalHarga: 0 };

    let gratis = 0;
    let totalHarga = 0;

    switch (promo) {
      case "Beli 2 harga 25rb":
        totalHarga = totalQty >= 2
          ? 25000 + Math.max(0, totalQty - 2) * CONFIG.HARGA_NORMAL
          : totalQty * CONFIG.HARGA_NORMAL;
        break;
      case "Beli 2 Gratis 1":
        gratis = totalQty >= 3 ? 1 : 0;
        const dibayarB2G1 = totalQty - gratis;
        totalHarga = dibayarB2G1 * CONFIG.HARGA_NORMAL;
        return { totalQty, gratis, dibayar: dibayarB2G1, totalHarga };
      case "Follow Sosmed":
        totalHarga = totalQty >= 1
          ? 10000 + Math.max(0, totalQty - 1) * CONFIG.HARGA_NORMAL
          : 0;
        break;
      default:
        totalHarga = totalQty * CONFIG.HARGA_NORMAL;
    }

    return { totalQty, gratis, dibayar: totalQty - gratis, totalHarga };
  }

  function hitungStokStatus(sisa) {
    if (sisa <= CONFIG.STOK_HABIS_THRESHOLD) return "HABIS";
    if (sisa <= CONFIG.STOK_MENIPIS_THRESHOLD) return "Menipis";
    return "Tersedia";
  }

  function formatRupiah(nilai) {
    const formatted = nilai.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `Rp ${formatted}`;
  }

  function varianSummary(qtyPerVarian) {
    const parts = [];
    for (const v of CONFIG.VARIAN) {
      const qty = qtyPerVarian[v] || 0;
      if (qty > 0) parts.push(`${qty} ${v}`);
    }
    return parts.length > 0 ? parts.join(", ") : "-";
  }

  function hitungTerjualPerVarian(transaksiList) {
    const terjual = {};
    CONFIG.VARIAN.forEach(v => { terjual[v] = 0; });
    transaksiList.forEach(t => {
      if (t.statusPesanan !== "Batal") {
        CONFIG.VARIAN.forEach(v => { terjual[v] += (t.qty[v] || 0); });
      }
    });
    return terjual;
  }

  return Object.freeze({
    hitungTotal, hitungStokStatus, formatRupiah,
    varianSummary, hitungTerjualPerVarian,
  });
})();
