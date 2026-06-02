"use strict";

const StokModule = (() => {
  function refresh() {
    const tanggal = App.getDateKey();
    const stokDict = DataStore.getStokHarian(tanggal);
    const transList = DataStore.getTransaksiList(tanggal);
    const terjual = Calculations.hitungTerjualPerVarian(transList);

    let totalAwal = 0, totalTerjual = 0, totalSisa = 0, totalPendapatan = 0;
    const tbody = document.getElementById("stok-table-body");
    tbody.innerHTML = "";

    CONFIG.VARIAN.forEach((v, i) => {
      const awal = stokDict[v] || 0;
      const sold = terjual[v];
      const sisa = awal - sold;
      const status = Calculations.hitungStokStatus(sisa);
      const pendapatan = sold * CONFIG.HARGA_NORMAL;

      totalAwal += awal;
      totalTerjual += sold;
      totalSisa += sisa;
      totalPendapatan += pendapatan;

      const tr = document.createElement("tr");
      const statusCls = Components.stokStatusClass(status);

      const cells = [
        { text: String(i + 1), cls: "text-center" },
        { text: v },
        { text: String(awal), cls: "text-center" },
        { text: String(sold), cls: "text-center" },
        { text: String(sisa), cls: `text-center ${statusCls}` },
        { text: status, cls: `text-center ${statusCls}` },
        { text: Calculations.formatRupiah(pendapatan), cls: "text-right" },
      ];
      cells.forEach(c => {
        const td = document.createElement("td");
        td.textContent = c.text;
        if (c.cls) td.className = c.cls;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // Total row
    const trTotal = document.createElement("tr");
    trTotal.className = "row-total";
    [
      "", "TOTAL",
      String(totalAwal), String(totalTerjual), String(totalSisa), "",
      Calculations.formatRupiah(totalPendapatan),
    ].forEach((text, i) => {
      const td = document.createElement("td");
      td.textContent = text;
      if (i === 2 || i === 3 || i === 4) td.className = "text-center";
      if (i === 6) td.className = "text-right";
      trTotal.appendChild(td);
    });
    tbody.appendChild(trTotal);

    document.getElementById("stok-tanggal").textContent = "Tanggal: " + Utils.formatTanggal(new Date());

    CONFIG.VARIAN.forEach(v => {
      const el = document.getElementById(`stok-input-${v}`);
      if (el) el.value = stokDict[v] || 0;
    });

    document.getElementById("stok-summary").textContent =
      `Total Stok Awal: ${totalAwal} | Total Terjual: ${totalTerjual} | Total Sisa: ${totalSisa} | Total Pendapatan: ${Calculations.formatRupiah(totalPendapatan)}`;
  }

  function simpanStok() {
    const tanggal = App.getDateKey();
    const stokDict = {};
    for (const v of CONFIG.VARIAN) {
      const el = document.getElementById(`stok-input-${v}`);
      const val = parseInt(el.value) || 0;
      try {
        stokDict[v] = Validators.validateStokValue(val);
      } catch (e) {
        Components.showAlert("Peringatan", `Stok ${v}: ${e.message}`);
        return;
      }
    }
    DataStore.setStokHarian(tanggal, stokDict);
    Components.showAlert("Berhasil", "Stok awal berhasil disimpan.");
    refresh();
  }

  return Object.freeze({ refresh, simpanStok });
})();
