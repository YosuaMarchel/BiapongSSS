"use strict";

const KukusanModule = (() => {
  let activeTimers = {};
  let ticker = null;

  function refresh() {
    const tanggal = App.getDateKey();
    const list = DataStore.getTransaksiList(tanggal);
    const timerStore = DataStore.getTimerStore();
    const durationEl = document.getElementById("timer-duration");
    const duration = (parseInt(durationEl.value) || CONFIG.DEFAULT_TIMER_MINUTES) * 60;

    const container = document.getElementById("timer-cards");
    container.innerHTML = "";
    activeTimers = {};
    stopTicker();

    let hasCards = false;
    const expiredOnes = [];

    list.forEach((t) => {
      if (t.statusPesanan !== "Dipesan" && t.statusPesanan !== "Ada di Kukusan") return;
      hasCards = true;

      const saved = timerStore.timers[t.id];
      const varianText = Calculations.varianSummary(t.qty);
      let status = "waiting";
      let remaining = duration;
      let startTime = null;
      let dur = duration;

      if (saved) {
        status = saved.status;
        startTime = saved.startTime ? new Date(saved.startTime) : null;
        dur = saved.durationSeconds || duration;
        if (status === "steaming" && startTime) {
          const elapsed = (Date.now() - startTime.getTime()) / 1000;
          remaining = Math.max(0, Math.floor(dur - elapsed));
          if (remaining <= 0) {
            status = "done";
            DataStore.saveTimer(t.id, { ...saved, status: "done" });
          }
        }
        if (status === "done") remaining = 0;
      }

      activeTimers[t.id] = {
        id: t.id, nama: t.nama, varianText,
        status, remaining, startTime, durationSeconds: dur,
      };

      if (status === "done" && saved && saved.status === "steaming") {
        expiredOnes.push(t.nama);
      }

      container.appendChild(buildCard(t.id, t.nama, varianText, status, remaining, dur));
    });

    if (!hasCards) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Tidak ada pesanan aktif.";
      container.appendChild(empty);
    }

    // Alert for timers that expired while app was closed
    if (expiredOnes.length > 0) {
      Components.playBeep();
      const names = expiredOnes.join(", ");
      Components.sendNotification("Kukusan Selesai!", `Timer berikut sudah selesai: ${names}. Segera keluarkan dari kukusan!`);
      Components.showAlert("Kukusan Selesai!",
        `Timer berikut sudah selesai saat aplikasi ditutup:\n${names}\n\nSegera keluarkan dari kukusan!`);
    }

    const hasSteaming = Object.values(activeTimers).some(t => t.status === "steaming");
    if (hasSteaming) startTicker();
    updateTitle();
  }

  function buildCard(id, nama, varianText, status, remaining, duration) {
    const card = document.createElement("div");
    card.className = "timer-card";
    card.id = `card-${id}`;

    const idx = DataStore.getTransaksiList(App.getDateKey()).findIndex(t => t.id === id);

    const header = document.createElement("div");
    header.className = "timer-header";

    const orderNo = document.createElement("span");
    orderNo.className = "order-no";
    orderNo.textContent = `#${idx + 1}`;

    const namaSpan = document.createElement("span");
    namaSpan.className = "nama";
    namaSpan.textContent = nama;

    const varianSpan = document.createElement("span");
    varianSpan.className = "varian";
    varianSpan.textContent = `(${varianText})`;

    const statusLabel = document.createElement("span");
    statusLabel.className = "status-label";
    statusLabel.id = `status-${id}`;

    const timerDisplay = document.createElement("div");
    timerDisplay.className = "timer-display";
    timerDisplay.id = `display-${id}`;

    const actions = document.createElement("div");
    actions.className = "timer-actions";
    actions.id = `actions-${id}`;

    function updateDisplay() {
      let statusText = "", statusColor = "";
      if (status === "waiting") { statusText = "Dipesan"; statusColor = "timer-blue"; }
      else if (status === "steaming") { statusText = "Ada di Kukusan"; statusColor = "timer-orange"; }
      else { statusText = "Matang!"; statusColor = "timer-red"; }

      statusLabel.textContent = statusText;
      statusLabel.className = `status-label ${statusColor}`;

      if (status === "done") {
        timerDisplay.textContent = "SELESAI!";
        timerDisplay.className = "timer-display timer-red";
      } else {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        timerDisplay.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        timerDisplay.className = `timer-display ${remaining > 60 ? "timer-green" : "timer-orange"}`;
      }
    }

    function renderActions() {
      actions.innerHTML = "";
      if (status === "waiting") {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.textContent = "Masuk Kukusan";
        btn.addEventListener("click", () => startTimer(id));
        actions.appendChild(btn);
      } else if (status === "done") {
        const btn = document.createElement("button");
        btn.className = "btn btn-warning";
        btn.textContent = "Keluarkan dari Kukusan";
        btn.addEventListener("click", () => removeTimer(id));
        actions.appendChild(btn);
      }
    }

    header.append(orderNo, namaSpan, varianSpan, statusLabel);
    updateDisplay();
    renderActions();
    card.append(header, timerDisplay, actions);
    return card;
  }

  function startTimer(id) {
    Components.requestNotificationPermission();
    const duration = (parseInt(document.getElementById("timer-duration").value) || CONFIG.DEFAULT_TIMER_MINUTES) * 60;
    const now = new Date();

    DataStore.saveTimer(id, {
      startTime: now.toISOString(),
      durationSeconds: duration,
      status: "steaming",
    });
    DataStore.updateTransaksiById(App.getDateKey(), id, { statusPesanan: "Ada di Kukusan" });

    const timer = activeTimers[id];
    if (timer) {
      timer.status = "steaming";
      timer.remaining = duration;
      timer.startTime = now;
      timer.durationSeconds = duration;
    }
    refresh();
  }

  function removeTimer(id) {
    DataStore.removeTimer(id);
    DataStore.updateTransaksiById(App.getDateKey(), id, { statusPesanan: "Siap Diambil" });
    delete activeTimers[id];
    refresh();
    TransaksiModule.refresh();
    StokModule.refresh();
  }

  function startTicker() {
    stopTicker();
    ticker = setInterval(tick, 1000);
  }

  function stopTicker() {
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  function updateTitle() {
    const timers = Object.values(activeTimers);
    const steaming = timers.filter(t => t.status === "steaming");
    const done = timers.filter(t => t.status === "done");

    if (steaming.length > 0) {
      const minRem = Math.min(...steaming.map(t => t.remaining));
      const m = Math.floor(minRem / 60);
      const s = minRem % 60;
      document.title = `(${m}:${String(s).padStart(2, "0")}) Kukusan Aktif — Biapong SSS`;
    } else if (done.length > 0) {
      document.title = `(${done.length} Selesai!) Biapong SSS`;
    } else {
      document.title = "Biapong SSS";
    }
  }

  function tick() {
    const justDone = [];

    for (const id in activeTimers) {
      const t = activeTimers[id];
      if (t.status !== "steaming") continue;

      if (t.startTime) {
        const elapsed = (Date.now() - t.startTime.getTime()) / 1000;
        t.remaining = Math.max(0, Math.floor(t.durationSeconds - elapsed));
      }

      const display = document.getElementById(`display-${id}`);
      const statusEl = document.getElementById(`status-${id}`);
      const actionsEl = document.getElementById(`actions-${id}`);
      if (!display) continue;

      if (t.remaining <= 0) {
        t.status = "done";
        t.remaining = 0;
        display.textContent = "SELESAI!";
        display.className = "timer-display timer-red";
        if (statusEl) { statusEl.textContent = "Matang!"; statusEl.className = "status-label timer-red"; }
        if (actionsEl) {
          actionsEl.innerHTML = "";
          const btn = document.createElement("button");
          btn.className = "btn btn-warning";
          btn.textContent = "Keluarkan dari Kukusan";
          btn.addEventListener("click", () => removeTimer(id));
          actionsEl.appendChild(btn);
        }

        DataStore.saveTimer(id, { ...DataStore.getTimerStore().timers[id], status: "done" });
        justDone.push(t);
      } else {
        const m = Math.floor(t.remaining / 60);
        const s = t.remaining % 60;
        display.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        display.className = `timer-display ${t.remaining > 60 ? "timer-green" : "timer-orange"}`;
      }
    }

    if (justDone.length > 0) {
      Components.playBeep();
      const names = justDone.map(t => t.nama).join(", ");
      Components.sendNotification("Kukusan Selesai!", `Biapong pesanan ${names} sudah matang! Segera keluarkan dari kukusan.`);
      Components.showAlert("Kukusan Selesai!",
        `Biapong pesanan ${names} sudah matang! Segera keluarkan dari kukusan.`);
    }

    const anySteaming = Object.values(activeTimers).some(t => t.status === "steaming");
    if (!anySteaming) stopTicker();
    updateTitle();
  }

  function saveDefaultDuration() {
    const val = parseInt(document.getElementById("timer-duration").value) || CONFIG.DEFAULT_TIMER_MINUTES;
    DataStore.setDefaultTimerDuration(val);
    Components.showAlert("Berhasil", `Durasi timer default disimpan: ${val} menit`);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });

  return Object.freeze({ refresh, saveDefaultDuration });
})();
