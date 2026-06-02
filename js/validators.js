"use strict";

const Validators = (() => {
  function validateNama(raw) {
    const cleaned = (raw || "").trim();
    if (!cleaned) throw new Error("Nama pemesan harus diisi.");
    if (cleaned.length > CONFIG.MAX_NAMA_LENGTH)
      throw new Error(`Nama terlalu panjang (maks ${CONFIG.MAX_NAMA_LENGTH} karakter).`);
    for (const ch of cleaned) {
      if (ch.charCodeAt(0) < 32 && ch !== "\t" && ch !== "\n")
        throw new Error("Nama mengandung karakter tidak valid.");
    }
    return cleaned;
  }

  function validateQty(qtyDict) {
    let total = 0;
    for (const v of CONFIG.VARIAN) {
      const val = qtyDict[v] || 0;
      if (val < 0) throw new Error(`Jumlah ${v} tidak boleh negatif.`);
      if (val > CONFIG.MAX_QTY_PER_VARIAN)
        throw new Error(`Jumlah ${v} terlalu banyak (maks ${CONFIG.MAX_QTY_PER_VARIAN}).`);
      total += val;
    }
    if (total === 0) throw new Error("Minimal 1 varian harus diisi.");
    return qtyDict;
  }

  function validateStokValue(val) {
    if (val < 0) throw new Error("Stok tidak boleh negatif.");
    if (val > CONFIG.MAX_STOK_VALUE)
      throw new Error(`Stok terlalu besar (maks ${CONFIG.MAX_STOK_VALUE}).`);
    return val;
  }

  function validatePromo(promo) {
    if (!CONFIG.PROMO_OPTIONS.includes(promo))
      throw new Error("Promo tidak valid.");
    return promo;
  }

  function validateStatusPesanan(status) {
    if (!CONFIG.STATUS_PESANAN.includes(status))
      throw new Error("Status pesanan tidak valid.");
    return status;
  }

  function validateStatusBayar(status) {
    if (!CONFIG.STATUS_BAYAR.includes(status))
      throw new Error("Status bayar tidak valid.");
    return status;
  }

  return Object.freeze({
    validateNama, validateQty, validateStokValue,
    validatePromo, validateStatusPesanan, validateStatusBayar,
  });
})();
