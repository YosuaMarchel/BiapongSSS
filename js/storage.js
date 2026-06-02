"use strict";

const DataStore = (() => {
  const PREFIX = "biapong_";

  function key(k) { return PREFIX + k; }

  function read(k) {
    try {
      const raw = localStorage.getItem(key(k));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function write(k, data) {
    try {
      localStorage.setItem(key(k), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Storage write failed:", e);
      return false;
    }
  }

  function getStokHarian(tanggal) {
    return read(`stok_${tanggal}`) || {};
  }

  function setStokHarian(tanggal, stokDict) {
    write(`stok_${tanggal}`, stokDict);
  }

  function getTransaksiList(tanggal) {
    const list = read(`transaksi_${tanggal}`);
    return Array.isArray(list) ? list : [];
  }

  function setTransaksiList(tanggal, list) {
    write(`transaksi_${tanggal}`, list);
  }

  function addTransaksi(tanggal, transaksi) {
    const list = getTransaksiList(tanggal);
    if (list.length >= CONFIG.MAX_TRANSAKSI_PER_DAY)
      throw new Error(`Transaksi penuh (maks ${CONFIG.MAX_TRANSAKSI_PER_DAY} per hari).`);
    transaksi.id = transaksi.id || Utils.generateId();
    list.push(transaksi);
    setTransaksiList(tanggal, list);
    return transaksi.id;
  }

  function updateTransaksiById(tanggal, id, updates) {
    const list = getTransaksiList(tanggal);
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return false;
    Object.assign(list[idx], updates);
    setTransaksiList(tanggal, list);
    return true;
  }

  function deleteTransaksi(tanggal, id) {
    const list = getTransaksiList(tanggal);
    const filtered = list.filter(t => t.id !== id);
    if (filtered.length === list.length) return false;
    setTransaksiList(tanggal, filtered);
    return true;
  }

  function getTransaksiById(tanggal, id) {
    const list = getTransaksiList(tanggal);
    return list.find(t => t.id === id) || null;
  }

  function getTimerStore() {
    return read("timer_store") || {
      default_duration_minutes: CONFIG.DEFAULT_TIMER_MINUTES,
      timers: {},
    };
  }

  function setTimerStore(data) {
    write("timer_store", data);
  }

  function getDefaultTimerDuration() {
    return getTimerStore().default_duration_minutes || CONFIG.DEFAULT_TIMER_MINUTES;
  }

  function setDefaultTimerDuration(minutes) {
    const store = getTimerStore();
    store.default_duration_minutes = minutes;
    setTimerStore(store);
  }

  function saveTimer(id, data) {
    const store = getTimerStore();
    store.timers[id] = data;
    setTimerStore(store);
  }

  function removeTimer(id) {
    const store = getTimerStore();
    delete store.timers[id];
    setTimerStore(store);
  }

  function listAllDates() {
    const dates = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX + "transaksi_")) {
        dates.push(k.replace(PREFIX + "transaksi_", ""));
      }
    }
    return dates.sort().reverse();
  }

  function clearDayData(tanggal) {
    // Clear today's transactions
    localStorage.removeItem(key(`transaksi_${tanggal}`));
    // Clear today's stock
    localStorage.removeItem(key(`stok_${tanggal}`));
    // Clear all active timers
    setTimerStore({ default_duration_minutes: getDefaultTimerDuration(), timers: {} });
  }

  return Object.freeze({
    getStokHarian, setStokHarian,
    getTransaksiList, setTransaksiList,
    addTransaksi, updateTransaksiById, deleteTransaksi, getTransaksiById,
    getTimerStore, setTimerStore,
    getDefaultTimerDuration, setDefaultTimerDuration,
    saveTimer, removeTimer,
    listAllDates, clearDayData,
  });
})();
