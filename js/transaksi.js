"use strict";

const TransaksiModule = (() => {
  let selectedId = null;

  function getFilters() {
    return {
      nama: (document.getElementById("filter-nama").value || "").trim().toLowerCase(),
      statusPesanan: document.getElementById("filter-status-pesanan").value,
      statusBayar: document.getElementById("filter-status-bayar").value,
    };
  }

  function resetFilters() {
    document.getElementById("filter-nama").value = "";
    document.getElementById("filter-status-pesanan").value = "";
    document.getElementById("filter-status-bayar").value = "";
    refresh();
  }

  function applyFilters(list) {
    const f = getFilters();
    let filtered = list;
    if (f.nama) {
      filtered = filtered.filter(t => t.nama.toLowerCase().includes(f.nama));
    }
    if (f.statusPesanan) {
      filtered = filtered.filter(t => t.statusPesanan === f.statusPesanan);
    }
    if (f.statusBayar) {
      filtered = filtered.filter(t => t.statusBayar === f.statusBayar);
    }
    return filtered;
  }

  function updateFilterCount(shown, total) {
    const el = document.getElementById("filter-count");
    if (!el) return;
    if (shown === total) {
      el.textContent = `${total} transaksi`;
    } else {
      el.textContent = `${shown} dari ${total} transaksi`;
    }
  }

  function getQtyFromForm() {
    const qty = {};
    CONFIG.VARIAN.forEach(v => {
      const el = document.getElementById(`qty-${v}`);
      qty[v] = parseInt(el.value) || 0;
    });
    return qty;
  }

  function updatePreview() {
    const qty = getQtyFromForm();
    const promo = document.getElementById("promo-select").value;
    const r = Calculations.hitungTotal(qty, promo);
    document.getElementById("preview-text").textContent =
      `Total: ${r.totalQty} pcs | Gratis: ${r.gratis} | Dibayar: ${r.dibayar} | Harga: ${Calculations.formatRupiah(r.totalHarga)}`;
  }

  function resetForm() {
    document.getElementById("input-nama").value = "";
    document.getElementById("promo-select").value = "Tanpa Promo";
    document.getElementById("input-keterangan").value = "";
    CONFIG.VARIAN.forEach(v => {
      const el = document.getElementById(`qty-${v}`);
      if (el) el.value = "0";
    });
    updatePreview();
  }

  function tambahTransaksi() {
    const tanggal = App.getDateKey();
    let nama;
    try {
      nama = Validators.validateNama(document.getElementById("input-nama").value);
    } catch (e) {
      Components.showAlert("Peringatan", e.message);
      return;
    }

    const qty = getQtyFromForm();
    try {
      Validators.validateQty(qty);
    } catch (e) {
      Components.showAlert("Peringatan", e.message);
      return;
    }

    const promo = document.getElementById("promo-select").value;
    try {
      Validators.validatePromo(promo);
    } catch (e) {
      Components.showAlert("Peringatan", e.message);
      return;
    }

    // Stock check
    const stokDict = DataStore.getStokHarian(tanggal);
    const transList = DataStore.getTransaksiList(tanggal);
    const terjual = Calculations.hitungTerjualPerVarian(transList);
    for (const v of CONFIG.VARIAN) {
      const sisa = (stokDict[v] || 0) - terjual[v];
      if (qty[v] > sisa) {
        Components.showAlert("Stok Tidak Cukup",
          `Stok ${v} tinggal ${sisa} pcs. Tidak bisa menambahkan ${qty[v]} pcs.`);
        return;
      }
    }

    const trans = {
      nama, qty, promo,
      statusPesanan: "Dipesan",
      statusBayar: "Belum Dibayar",
      bayarVia: "",
      keterangan: document.getElementById("input-keterangan").value.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      DataStore.addTransaksi(tanggal, trans);
    } catch (e) {
      Components.showAlert("Error", e.message);
      return;
    }

    const result = Calculations.hitungTotal(qty, promo);
    Components.showAlert("Berhasil",
      `Transaksi ditambahkan | Total: ${result.totalQty} pcs | Harga: ${Calculations.formatRupiah(result.totalHarga)}`);
    resetForm();
    refresh();
    StokModule.refresh();
  }

  function refresh() {
    const tanggal = App.getDateKey();
    const list = DataStore.getTransaksiList(tanggal);
    const filtered = applyFilters(list);
    const tbody = document.getElementById("transaksi-table-body");
    tbody.innerHTML = "";

    updateFilterCount(filtered.length, list.length);

    if (filtered.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 9;
      td.className = "text-center empty-hint";
      td.textContent = list.length === 0 ? "Belum ada transaksi" : "Tidak ada transaksi yang cocok dengan filter";
      tr.appendChild(td);
      tbody.appendChild(tr);
      resetEditFields();
      return;
    }

    filtered.forEach((t, i) => {
      const result = Calculations.hitungTotal(t.qty, t.promo);
      const summary = Calculations.varianSummary(t.qty);

      const tr = document.createElement("tr");
      tr.dataset.id = t.id;

      const cells = [
        { text: String(i + 1), cls: "text-center" },
        { text: t.nama },
        { text: summary },
        { text: String(result.totalQty), cls: "text-center" },
        { text: t.promo },
        { text: Calculations.formatRupiah(result.totalHarga), cls: "text-right" },
      ];

      cells.forEach(c => {
        const td = document.createElement("td");
        td.textContent = c.text;
        if (c.cls) td.className = c.cls;
        tr.appendChild(td);
      });

      // Status Pesanan badge cell
      const tdSP = document.createElement("td");
      tdSP.className = "text-center";
      tdSP.appendChild(Components.pesananBadge(t.statusPesanan));
      tr.appendChild(tdSP);

      // Status Bayar badge cell
      const tdSB = document.createElement("td");
      tdSB.className = "text-center";
      tdSB.appendChild(Components.bayarBadge(t.statusBayar));
      tr.appendChild(tdSB);

      // Action buttons cell
      const tdAct = document.createElement("td");
      tdAct.className = "text-center action-cell";

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn btn-sm btn-edit";
      btnEdit.textContent = "Edit";
      btnEdit.type = "button";
      btnEdit.setAttribute("aria-label", "Edit transaksi");
      btnEdit.addEventListener("click", (e) => { e.stopPropagation(); openEditModal(t.id); });

      const btnDel = document.createElement("button");
      btnDel.className = "btn btn-sm btn-danger-outline";
      btnDel.textContent = "Hapus";
      btnDel.type = "button";
      btnDel.setAttribute("aria-label", "Hapus transaksi");
      btnDel.addEventListener("click", (e) => { e.stopPropagation(); hapusTransaksi(t.id); });

      tdAct.append(btnEdit, btnDel);
      tr.appendChild(tdAct);

      tr.addEventListener("click", () => selectRow(t.id));
      tbody.appendChild(tr);
    });

    resetEditFields();
  }

  function selectRow(id) {
    const tanggal = App.getDateKey();
    const t = DataStore.getTransaksiById(tanggal, id);
    if (!t) return;
    selectedId = id;
    document.getElementById("edit-status-pesanan").value = t.statusPesanan;
    document.getElementById("edit-status-bayar").value = t.statusBayar;
    document.getElementById("edit-bayar-via").value = t.bayarVia;

    document.querySelectorAll("#transaksi-table-body tr").forEach(r => {
      r.classList.remove("row-selected");
    });
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) row.classList.add("row-selected");
  }

  function resetEditFields() {
    selectedId = null;
    document.getElementById("edit-status-pesanan").value = "";
    document.getElementById("edit-status-bayar").value = "";
    document.getElementById("edit-bayar-via").value = "";
    document.querySelectorAll("#transaksi-table-body tr").forEach(r => {
      r.classList.remove("row-selected");
    });
  }

  function updateSelectedStatus() {
    if (!selectedId) {
      Components.showAlert("Peringatan", "Pilih baris terlebih dahulu.");
      return;
    }

    const newStatus = document.getElementById("edit-status-pesanan").value;
    const newBayar = document.getElementById("edit-status-bayar").value;
    const newBayarVia = document.getElementById("edit-bayar-via").value.trim();

    if (!newStatus && !newBayar) {
      Components.showAlert("Peringatan", "Pilih status yang ingin diubah.");
      return;
    }
    if (newBayar === "Sudah Dibayar" && !newBayarVia) {
      Components.showAlert("Peringatan", "Field 'Bayar via' harus diisi saat mengubah status ke Sudah Dibayar.");
      return;
    }

    try {
      if (newStatus) Validators.validateStatusPesanan(newStatus);
      if (newBayar) Validators.validateStatusBayar(newBayar);
    } catch (e) {
      Components.showAlert("Peringatan", e.message);
      return;
    }

    const updates = {};
    if (newStatus) updates.statusPesanan = newStatus;
    if (newBayar) updates.statusBayar = newBayar;
    if (newBayarVia) updates.bayarVia = newBayarVia;

    DataStore.updateTransaksiById(App.getDateKey(), selectedId, updates);
    refresh();
    StokModule.refresh();
    KukusanModule.refresh();
  }

  function hapusTransaksi(id) {
    const tanggal = App.getDateKey();
    const t = DataStore.getTransaksiById(tanggal, id);
    if (!t) return;
    const summary = Calculations.varianSummary(t.qty);
    Components.showConfirm("Hapus Transaksi",
      `Hapus transaksi "${t.nama}" (${summary})?\nTindakan ini tidak bisa dibatalkan.`,
      () => {
        DataStore.deleteTransaksi(tanggal, id);
        if (selectedId === id) resetEditFields();
        refresh();
        StokModule.refresh();
        KukusanModule.refresh();
      });
  }

  function openEditModal(id) {
    const tanggal = App.getDateKey();
    const t = DataStore.getTransaksiById(tanggal, id);
    if (!t) return;

    Components.dismissAllAlerts();
    const overlay = document.createElement("div");
    overlay.className = "custom-alert-overlay edit-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Edit Transaksi");

    const box = document.createElement("div");
    box.className = "custom-alert edit-modal-box";

    const h = document.createElement("h3");
    h.textContent = `Edit Transaksi — ${t.nama}`;

    const form = document.createElement("div");
    form.className = "edit-modal-form";

    // Promo select
    const promoRow = document.createElement("div");
    promoRow.className = "form-row";
    const promoLabel = document.createElement("label");
    promoLabel.className = "form-label";
    promoLabel.textContent = "Promo:";
    promoLabel.setAttribute("for", "edit-modal-promo");
    const promoSelect = document.createElement("select");
    promoSelect.className = "form-select";
    promoSelect.id = "edit-modal-promo";
    CONFIG.PROMO_OPTIONS.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      if (opt === t.promo) o.selected = true;
      promoSelect.appendChild(o);
    });
    promoRow.append(promoLabel, promoSelect);
    form.appendChild(promoRow);

    // Qty grid
    const qtyLabel = document.createElement("div");
    qtyLabel.className = "qty-section-label";
    qtyLabel.textContent = "Jumlah per Varian:";
    form.appendChild(qtyLabel);

    const qtyGrid = document.createElement("div");
    qtyGrid.className = "qty-grid edit-qty-grid";
    qtyGrid.id = "edit-modal-qty-grid";

    const previewEl = document.createElement("div");
    previewEl.className = "preview-box";
    previewEl.id = "edit-modal-preview";

    function updateEditPreview() {
      const qty = {};
      CONFIG.VARIAN.forEach(v => {
        const inp = document.getElementById(`edit-qty-${v}`);
        qty[v] = parseInt(inp.value) || 0;
      });
      const r = Calculations.hitungTotal(qty, promoSelect.value);
      previewEl.textContent =
        `Total: ${r.totalQty} pcs | Gratis: ${r.gratis} | Dibayar: ${r.dibayar} | Harga: ${Calculations.formatRupiah(r.totalHarga)}`;
    }

    CONFIG.VARIAN.forEach(v => {
      const item = document.createElement("div");
      item.className = "qty-item";

      const lbl = document.createElement("label");
      lbl.textContent = `${v}:`;
      lbl.setAttribute("for", `edit-qty-${v}`);

      const stepper = document.createElement("div");
      stepper.className = "stepper";

      const btnMin = document.createElement("button");
      btnMin.className = "stepper-btn";
      btnMin.textContent = "−";
      btnMin.type = "button";

      const input = document.createElement("input");
      input.type = "number";
      input.className = "stepper-input";
      input.id = `edit-qty-${v}`;
      input.value = String(t.qty[v] || 0);
      input.min = "0";
      input.max = String(CONFIG.MAX_QTY_PER_VARIAN);

      const btnPlus = document.createElement("button");
      btnPlus.className = "stepper-btn";
      btnPlus.textContent = "+";
      btnPlus.type = "button";

      const doStep = (delta) => {
        const cur = parseInt(input.value) || 0;
        input.value = String(Utils.clampValue(cur + delta, 0, CONFIG.MAX_QTY_PER_VARIAN));
        updateEditPreview();
      };

      btnMin.addEventListener("click", () => doStep(-1));
      btnPlus.addEventListener("click", () => doStep(1));
      input.addEventListener("change", () => {
        input.value = String(Utils.clampValue(parseInt(input.value) || 0, 0, CONFIG.MAX_QTY_PER_VARIAN));
        updateEditPreview();
      });
      input.addEventListener("input", updateEditPreview);
      promoSelect.addEventListener("change", updateEditPreview);

      stepper.append(btnMin, input, btnPlus);
      item.append(lbl, stepper);
      qtyGrid.appendChild(item);
    });

    form.appendChild(qtyGrid);
    form.appendChild(previewEl);

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "alert-actions";

    const btnCancel = document.createElement("button");
    btnCancel.className = "btn";
    btnCancel.textContent = "Batal";
    btnCancel.onclick = () => overlay.remove();

    const btnSave = document.createElement("button");
    btnSave.className = "btn btn-primary";
    btnSave.textContent = "Simpan";
    btnSave.onclick = () => {
      const newQty = {};
      CONFIG.VARIAN.forEach(v => {
        const inp = document.getElementById(`edit-qty-${v}`);
        newQty[v] = parseInt(inp.value) || 0;
      });

      try {
        Validators.validateQty(newQty);
      } catch (e) {
        Components.showAlert("Peringatan", e.message);
        return;
      }

      const newPromo = promoSelect.value;
      try {
        Validators.validatePromo(newPromo);
      } catch (e) {
        Components.showAlert("Peringatan", e.message);
        return;
      }

      // Stock check: only validate the difference
      const stokDict = DataStore.getStokHarian(tanggal);
      const transList = DataStore.getTransaksiList(tanggal);
      const terjual = Calculations.hitungTerjualPerVarian(transList);
      for (const v of CONFIG.VARIAN) {
        const diff = newQty[v] - (t.qty[v] || 0);
        if (diff > 0) {
          const sisa = (stokDict[v] || 0) - terjual[v];
          if (diff > sisa) {
            Components.showAlert("Stok Tidak Cukup",
              `Stok ${v} tinggal ${sisa} pcs. Tidak bisa menambahkan ${diff} pcs lagi.`);
            return;
          }
        }
      }

      DataStore.updateTransaksiById(tanggal, id, { qty: newQty, promo: newPromo });
      overlay.remove();
      refresh();
      StokModule.refresh();
      KukusanModule.refresh();
      Components.showAlert("Berhasil", "Transaksi berhasil diperbarui.");
    };

    actions.append(btnCancel, btnSave);
    box.append(h, form, actions);
    overlay.appendChild(box);
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    updateEditPreview();
    promoSelect.focus();
  }

  return Object.freeze({
    refresh, tambahTransaksi, updatePreview,
    resetForm, resetEditFields, updateSelectedStatus, resetFilters,
    openEditModal, hapusTransaksi,
  });
})();
