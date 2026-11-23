"use strict";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const FC = {
  1: { bg: "#a1a19a", fg: "#fff" },
  2: { bg: "#a6bf4a", fg: "#18181b" },
  3: { bg: "#f2c230", fg: "#18181b" },
  4: { bg: "#e0701c", fg: "#fff" },
  5: { bg: "#c42a24", fg: "#fff" },
};
const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

let S = null;
let TAB = readPref("blooma_tab", "fire");

function readPref(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writePref(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode, embedded view) */
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const round = (x) => Math.round(x);
const locale = () => (LANG === "en" ? "en-GB" : "uk-UA");
const fmtNum = (x) => Math.round(x).toLocaleString(locale());
const fmtDec = (x, digits = 1) => Number(x).toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
const fmtPct = (x) => `${Number(x).toLocaleString(locale(), { maximumFractionDigits: 1 })}%`;
const fmtDate = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return `${t("weekdays")[d.getDay()]} ${d.getDate()} ${t("months")[d.getMonth()]}`;
};
const meters = (km) => (km < 1 ? `${Math.round(km * 1000)} ${t("unit_m")}` : `${fmtDec(km)} ${t("unit_km")}`);
const pill = (cls) => `<span class="pill" style="background:${FC[cls].bg};color:${FC[cls].fg}">${ROMAN[cls]}</span>`;

async function api(path, body) {
  const opts = body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) {
    const key = `err_${data.error}`;
    const err = new Error(key in I18N[LANG] ? t(key) : t("err_generic"));
    err.detail = data.detail;
    throw err;
  }
  return data;
}

async function act(path, body, button) {
  const label = button?.textContent;
  if (button) {
    button.textContent = t("loading");
    button.disabled = true;
  }
  try {
    $("#error").hidden = true;
    S = await api(path, body);
    render();
  } catch (e) {
    $("#error").textContent = e.detail ? `${e.message} (${e.detail})` : e.message;
    $("#error").hidden = false;
  } finally {
    if (button) {
      button.textContent = label;
      button.disabled = false;
    }
  }
}

function applyStatic() {
  document.documentElement.lang = LANG === "en" ? "en" : "uk";
  document.title = `${t(TAB === "fire" ? "tab_fire" : "tab_heat")} · Blooma`;
  $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === LANG));
  $$("[data-tab]").forEach((b) => {
    b.classList.toggle("on", b.dataset.tab === TAB);
    b.setAttribute("aria-selected", String(b.dataset.tab === TAB));
  });
  $("#view-fire").hidden = TAB !== "fire";
  $("#view-heat").hidden = TAB !== "heat";
}

function renderNotes() {
  const tab = TAB === "fire" ? S.fire : S.heat;
  const notes = tab.notes.map((n) => t(`note_${n.code}`, n));
  const quiet = TAB === "fire"
    ? S.fire.dates.every((d) => d.counts["4"] + d.counts["5"] === 0)
    : S.heat.days.filter((d) => d.is_forecast).every((d) => d.heat_level < 2);
  if (S.mode === "live" && quiet) notes.push(t("note_live_season"));
  $("#notes").textContent = notes.join(" ");
}

function render() {
  applyStatic();
  if (!S) return;
  $("#mode-demo").classList.toggle("on", S.mode === "demo");
  $("#mode-live").classList.toggle("on", S.mode === "live");
  renderNotes();
  if (TAB === "fire") renderFire();
  else renderHeat();
}

function tip(node, html) {
  const el = $("#tooltip");
  node.addEventListener("mouseenter", () => {
    el.innerHTML = typeof html === "function" ? html() : html;
    el.hidden = false;
  });
  node.addEventListener("mousemove", (e) => {
    el.style.left = `${Math.min(e.clientX + 14, window.innerWidth - el.offsetWidth - 8)}px`;
    el.style.top = `${e.clientY + 14}px`;
  });
  node.addEventListener("mouseleave", () => { el.hidden = true; });
}

function start() {
  $$("[data-tab]").forEach((b) => b.addEventListener("click", () => {
    TAB = b.dataset.tab;
    writePref("blooma_tab", TAB);
    render();
  }));
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    setLang(b.dataset.lang);
    render();
  }));
  $("#mode-demo").addEventListener("click", (e) => act("/api/mode", { mode: "demo" }, e.currentTarget));
  $("#mode-live").addEventListener("click", (e) => act("/api/mode", { mode: "live" }, e.currentTarget));
  bindHeatControls();

  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fireMap?.render();
      heatMap?.render();
    }, 150);
  });

  applyStatic();
  act("/api/state");
}
