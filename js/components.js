"use strict";

const Components = (() => {
  function escape(s) { return Utils.escapeHtml(s); }

  function showAlert(title, message) {
    dismissAllAlerts();
    const overlay = document.createElement("div");
    overlay.className = "custom-alert-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", title);

    const box = document.createElement("div");
    box.className = "custom-alert";

    const h = document.createElement("h3");
    h.textContent = title;

    const p = document.createElement("p");
    p.textContent = message;

    const actions = document.createElement("div");
    actions.className = "alert-actions";
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "OK";
    btn.onclick = () => overlay.remove();
    actions.appendChild(btn);

    box.append(h, p, actions);
    overlay.appendChild(box);
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    btn.focus();
  }

  function showConfirm(title, message, onYes) {
    dismissAllAlerts();
    const overlay = document.createElement("div");
    overlay.className = "custom-alert-overlay";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");

    const box = document.createElement("div");
    box.className = "custom-alert";

    const h = document.createElement("h3");
    h.textContent = title;

    const p = document.createElement("p");
    p.textContent = message;

    const actions = document.createElement("div");
    actions.className = "alert-actions";

    const btnNo = document.createElement("button");
    btnNo.className = "btn";
    btnNo.textContent = "Batal";
    btnNo.onclick = () => overlay.remove();

    const btnYes = document.createElement("button");
    btnYes.className = "btn btn-primary";
    btnYes.textContent = "Ya";
    btnYes.onclick = () => { overlay.remove(); onYes(); };

    actions.append(btnNo, btnYes);
    box.append(h, p, actions);
    overlay.appendChild(box);
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    btnYes.focus();
  }

  function dismissAllAlerts() {
    document.querySelectorAll(".custom-alert-overlay").forEach(el => el.remove());
  }

  function pesananBadge(status) {
    const cls = CONFIG.PESANAN_BADGE_MAP[status] || "";
    const span = document.createElement("span");
    span.className = `badge ${cls}`;
    span.textContent = status;
    return span;
  }

  function bayarBadge(status) {
    const cls = CONFIG.BAYAR_BADGE_MAP[status] || "";
    const span = document.createElement("span");
    span.className = `badge ${cls}`;
    span.textContent = status;
    return span;
  }

  function stokStatusClass(status) {
    return CONFIG.STOK_STATUS_MAP[status] || "";
  }

  function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".tab-content").forEach(c => {
      c.classList.remove("active");
      c.setAttribute("aria-hidden", "true");
    });
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    const panel = document.getElementById(tabId);
    if (btn) { btn.classList.add("active"); btn.setAttribute("aria-selected", "true"); }
    if (panel) { panel.classList.add("active"); panel.setAttribute("aria-hidden", "false"); }

    if (tabId === "tab-stok") StokModule.refresh();
    if (tabId === "tab-transaksi") TransaksiModule.refresh();
    if (tabId === "tab-kukusan") KukusanModule.refresh();
  }

  function buildQtyGrid(containerId, prefix, maxVal, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    CONFIG.VARIAN.forEach(v => {
      const item = document.createElement("div");
      item.className = "qty-item";

      const label = document.createElement("label");
      label.textContent = `${v}:`;
      label.setAttribute("for", `${prefix}-${v}`);

      const stepper = document.createElement("div");
      stepper.className = "stepper";

      const btnMin = document.createElement("button");
      btnMin.className = "stepper-btn";
      btnMin.textContent = "−";
      btnMin.setAttribute("aria-label", `Kurangi ${v}`);
      btnMin.type = "button";

      const input = document.createElement("input");
      input.type = "number";
      input.className = "stepper-input";
      input.id = `${prefix}-${v}`;
      input.value = "0";
      input.min = "0";
      input.max = String(maxVal);
      input.setAttribute("aria-label", `Jumlah ${v}`);

      const btnPlus = document.createElement("button");
      btnPlus.className = "stepper-btn";
      btnPlus.textContent = "+";
      btnPlus.setAttribute("aria-label", `Tambah ${v}`);
      btnPlus.type = "button";

      const doStep = (delta) => {
        const cur = parseInt(input.value) || 0;
        input.value = String(Utils.clampValue(cur + delta, 0, maxVal));
        if (onChange) onChange();
      };

      btnMin.addEventListener("click", () => doStep(-1));
      btnPlus.addEventListener("click", () => doStep(1));
      input.addEventListener("change", () => {
        input.value = String(Utils.clampValue(parseInt(input.value) || 0, 0, maxVal));
        if (onChange) onChange();
      });
      if (onChange) input.addEventListener("input", onChange);

      stepper.append(btnMin, input, btnPlus);
      item.append(label, stepper);
      container.appendChild(item);
    });
  }

  let _notifRequested = false;

  function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") return;
    if (_notifRequested) return;
    _notifRequested = true;
    Notification.requestPermission();
  }

  function sendNotification(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      new Notification(title, { body, tag: "kukusan-timer", requireInteraction: true });
    } catch { /* Notification failed */ }
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const play = (freq, delay) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = "sine";
          gain.gain.value = 0.3;
          osc.start();
          osc.stop(ctx.currentTime + CONFIG.TIMER_BEEP_DURATION_MS / 1000);
        }, delay);
      };
      play(CONFIG.TIMER_BEEP_FREQ_1, 0);
      play(CONFIG.TIMER_BEEP_FREQ_2, CONFIG.TIMER_BEEP_DELAY_MS);
    } catch { /* AudioContext not supported */ }
  }

  return Object.freeze({
    showAlert, showConfirm, dismissAllAlerts,
    pesananBadge, bayarBadge, stokStatusClass,
    switchTab, buildQtyGrid, playBeep, escape,
    requestNotificationPermission, sendNotification,
  });
})();
