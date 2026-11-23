"use strict";

function renderFire() {
  const F = S.fire;
  renderFireDays(F);
  renderFireMap(F);
  renderFireSummary(F);
  renderFireCity(F);
  renderFireMessage(F);
}

function renderFireDays(F) {
  const total = F.cities.length;
  $("#f-days").innerHTML = F.dates.map((d) => {
    const c = d.counts;
    const segs = [5, 4, 3, 2, 1].filter((k) => c[k] > 0)
      .map((k) => `<i style="width:${(100 * c[k]) / total}%;background:${FC[k].bg}"></i>`).join("");
    const tag = d.is_today ? `<b>${t("today")}</b>` : t("forecast");
    return `<button type="button" class="day ${d.date === F.selected ? "sel" : ""}" data-fdate="${d.date}">
      <span class="d"><span>${fmtDate(d.date)}</span><span>${tag}</span></span>
      <span class="counts">${pill(5)} ${c["5"]} &nbsp; ${pill(4)} ${c["4"]}</span>
      <span class="bar" aria-hidden="true">${segs}</span>
    </button>`;
  }).join("");
  $$("[data-fdate]").forEach((b) => b.addEventListener("click", () => act("/api/fire/date", { date: b.dataset.fdate })));
}

// Labels that would otherwise overlap a neighbouring city.
const LABEL_SIDE = { "Миколаїв": "left", "Херсон": "right", "Рівне": "right", "Луцьк": "left", "Тернопіль": "above" };

function cityLabel(name, x, y) {
  const side = LABEL_SIDE[name];
  if (side === "left") return `<text class="city" x="${x - 16}" y="${y + 4}" text-anchor="end">${esc(cityName(name))}</text>`;
  if (side === "above") return `<text class="city" x="${x}" y="${y - 17}" text-anchor="middle">${esc(cityName(name))}</text>`;
  if (side === "right") return `<text class="city" x="${x + 16}" y="${y + 4}" text-anchor="start">${esc(cityName(name))}</text>`;
  return `<text class="city" x="${x}" y="${y + 25}" text-anchor="middle">${esc(cityName(name))}</text>`;
}

/** Collapses consecutive dates into ranges: "Sat 18 Jul – Wed 22 Jul, Fri 24 Jul". */
function dateRanges(dates) {
  const out = [];
  let start = null, prev = null;
  const next = (iso) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
  for (const d of [...dates, null]) {
    if (d && prev && next(prev) === d) { prev = d; continue; }
    if (start) out.push(start === prev ? fmtDate(start) : `${fmtDate(start)} – ${fmtDate(prev)}`);
    start = prev = d;
  }
  return out.join(", ");
}

let fireMap = null;

function cityTip(F, c) {
  return `<b>${esc(cityName(c.name))}</b> · ${fmtDate(F.selected)}<br>`
    + `${t("f_col_index")}: ${fmtNum(c.nesterov)} → ${c.fire_roman} (${t(`fire_${c.fire_class}`)})<br>`
    + `${t("f_tbl_spread")}: ${c.spread_roman} (${t(`fire_${c.spread_class}`)})<br>`
    + `Tmax ${round(c.tmax)}° · ${t("f_col_wind")} ${fmtDec(c.wind)} ${t("ms")} · ${t("f_tbl_rain")} ${fmtDec(c.precip)} ${t("mm")}`;
}

function renderFireMap(F) {
  fireMap ??= new TileMap($("#f-map"), {
    minZoom: 5,
    maxZoom: 12,
    onClick: (target) => {
      const g = target.closest("[data-fcity]");
      if (g) act("/api/fire/city", { city: g.dataset.fcity });
    },
    tooltip: (target) => {
      const g = target.closest("[data-fcity]");
      const city = g && S.fire.cities.find((c) => c.name === g.dataset.fcity);
      if (city) return cityTip(S.fire, city);
      return target.closest("circle.hot") ? t("f_legend_hotspot") : null;
    },
  });
  fireMap.draw = (P, z) => {
    let svg = "";
    for (const h of F.hotspots) {
      const [x, y] = P(h.lat, h.lon);
      svg += `<circle class="hot" cx="${x}" cy="${y}" r="${z >= 8 ? 3 : 2}"/>`;
    }
    for (const c of F.cities) {
      const [x, y] = P(c.lat, c.lon);
      const color = FC[c.spread_class];
      svg += `<g class="city-mark" data-fcity="${esc(c.name)}">
        <circle class="c ${c.name === F.city ? "sel" : ""}" cx="${x}" cy="${y}" r="12" fill="${color.bg}"/>
        <text class="roman" x="${x}" y="${y + 3.5}" text-anchor="middle" fill="${color.fg}">${c.spread_roman}</text>
        ${c.wind_raised ? `<text class="wind" x="${x + 13}" y="${y - 8}">↑</text>` : ""}
        ${cityLabel(c.name, x, y)}
      </g>`;
    }
    return svg;
  };
  fireMap.fitOnce("ukraine", F.cities, 40);

  const classes = [1, 2, 3, 4, 5].map((k) => `<span><i class="fdot" style="background:${FC[k].bg}"></i>${ROMAN[k]} — ${t(`fire_${k}`)}</span>`).join("");
  $("#f-legend").innerHTML = classes
    + `<span><b class="up">↑</b> ${t("f_legend_wind")}</span>`
    + (F.hotspots.length ? `<span><i class="fdot" style="background:#7a0f0b;width:6px;height:6px"></i>${t("f_legend_hotspot")}</span>` : "")
    + `<span class="hint">${t("map_help")}</span>`;
}

function renderFireSummary(F) {
  const counts = F.dates.find((d) => d.date === F.selected).counts;
  $("#f-summary").innerHTML = `
    <div class="kpi"><div class="v">${counts["5"]} ${pill(5)}</div><div class="l">${t("f_extreme")}</div></div>
    <div class="kpi"><div class="v">${counts["4"]} ${pill(4)}</div><div class="l">${t("f_high")}</div></div>`;
  $("#f-rank-title").textContent = t("f_rank", { date: fmtDate(F.selected) });
  $("#f-rank").innerHTML = `<table class="rank">
    <thead><tr><th>${t("f_col_city")}</th><th>${t("f_col_class")}</th><th class="num">${t("f_col_index")}</th><th class="num">${t("f_col_wind")}</th></tr></thead>
    <tbody>${F.cities.slice(0, 10).map((c) => `
      <tr data-rcity="${esc(c.name)}" class="${c.name === F.city ? "sel" : ""}">
        <td>${esc(cityName(c.name))}</td>
        <td>${pill(c.spread_class)} ${c.wind_raised ? '<b class="up">↑</b>' : ""}</td>
        <td class="num">${fmtNum(c.nesterov)}</td>
        <td class="num">${fmtDec(c.wind)} ${t("ms")}</td>
      </tr>`).join("")}</tbody></table>`;
  $$("[data-rcity]").forEach((r) => r.addEventListener("click", () => act("/api/fire/city", { city: r.dataset.rcity })));
}

function renderFireCity(F) {
  $("#f-city-title").textContent = t("f_city", { city: cityName(F.city) });
  $("#f-city-hint").textContent = t("f_city_hint", { mm: F.rain_reset_mm });
  renderNesterovChart(F);

  const sd = F.selected_city_day;
  const wind = sd.spread_class > sd.fire_class
    ? `<p>${t("f_why_wind", { w: fmtDec(sd.wind), lim: `${F.wind_ms} ${t("ms")}`, a: ROMAN[sd.fire_class], b: ROMAN[sd.spread_class] })}</p>` : "";
  $("#f-advice").innerHTML = `
    <div class="hint">${esc(cityName(F.city))} · ${fmtDate(F.selected)}</div>
    <div class="big">${pill(sd.spread_class)} ${t("fire_" + sd.spread_class)}</div>
    <p>${t("f_col_index")}: <b>${fmtNum(sd.nesterov)}</b></p>
    ${wind}
    <div><h3>${t("f_what")}</h3><p>${t(`fire_advice_${sd.spread_class}`)}</p></div>`;

  const rows = F.detail.filter((d) => d.is_forecast);
  $("#f-table").innerHTML = `<table>
    <thead><tr><th>${t("f_tbl_date")}</th><th class="num">${t("f_tbl_tmax")}</th><th class="num">${t("f_tbl_wind")}</th>
      <th class="num">${t("f_tbl_rain")}</th><th class="num">${t("f_tbl_index")}</th><th>${t("f_tbl_class")}</th><th>${t("f_tbl_spread")}</th></tr></thead>
    <tbody>${rows.map((d) => `<tr class="${d.is_today ? "today" : ""}">
      <td>${fmtDate(d.date)}${d.is_today ? ` · ${t("today")}` : ""}</td>
      <td class="num">${round(d.tmax)}°</td>
      <td class="num">${fmtDec(d.wind)} ${t("ms")}</td>
      <td class="num">${fmtDec(d.precip)} ${t("mm")}</td>
      <td class="num">${fmtNum(d.nesterov)}</td>
      <td>${pill(d.fire_class)} ${t("fire_" + d.fire_class)}</td>
      <td>${pill(d.spread_class)}${d.spread_class > d.fire_class ? ' <b class="up">↑</b>' : ""}</td>
    </tr>`).join("")}</tbody></table>`;
}

function renderNesterovChart(F) {
  const D = F.detail;
  const W = 720, H = 300, ml = 56, mr = 70, mt = 26, mb = 48;
  const maxV = Math.max(12000, ...D.map((d) => d.nesterov)) * 1.05;
  const bw = (W - ml - mr) / D.length;
  const X = (i) => ml + i * bw;
  const Y = (v) => mt + (1 - v / maxV) * (H - mt - mb);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("f_axis"))}">`;
  svg += `<text class="axis" x="${ml}" y="14">${t("f_axis")}</text>`;
  for (let v = 0; v <= maxV; v += 2000) {
    svg += `<line class="grid-line" x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}"/>`;
    svg += `<text class="axis" x="${ml - 8}" y="${Y(v) + 4}" text-anchor="end">${fmtNum(v)}</text>`;
  }
  [[1000, 3], [4000, 4], [10000, 5]].forEach(([v, k]) => {
    svg += `<line class="thr" x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}"/>`;
    svg += `<text class="lbl" x="${W - mr + 6}" y="${Y(v) + 4}">${ROMAN[k]} &gt; ${fmtNum(v)}</text>`;
  });
  const firstF = D.findIndex((d) => d.is_forecast);
  if (firstF >= 0) {
    svg += `<rect class="fc-zone" x="${X(firstF)}" y="${mt}" width="${W - mr - X(firstF)}" height="${H - mt - mb}" opacity=".6"/>`;
    svg += `<text class="axis" x="${X(firstF) + 4}" y="${mt + 12}">${t("forecast")}</text>`;
  }
  D.forEach((d, i) => {
    const x = X(i) + 1, w = Math.max(1, bw - 2), y = Y(d.nesterov), h = Math.max(0, Y(0) - y);
    const sel = d.date === F.selected ? `stroke="#1d1c1a" stroke-width="2"` : "";
    svg += `<rect class="bar" data-i="${i}" x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${FC[d.fire_class].bg}" ${sel} opacity="${d.is_forecast ? 0.8 : 1}"/>`;
    if (d.rain_reset) svg += `<circle cx="${x + w / 2}" cy="${Y(0) + 8}" r="3.5" fill="#2a78d6"><title>${t("f_rain")}</title></circle>`;
    if (i % Math.ceil(D.length / 8) === 0) svg += `<text class="axis" x="${x + w / 2}" y="${H - mb + 26}" text-anchor="middle">${fmtDate(d.date).split(" ").slice(1).join(" ")}</text>`;
  });
  const ti = D.findIndex((d) => d.is_today);
  if (ti >= 0) {
    svg += `<line class="today-line" x1="${X(ti)}" x2="${X(ti)}" y1="${mt - 4}" y2="${Y(0)}"/>`;
    svg += `<text class="lbl" x="${X(ti) - 4}" y="${mt - 8}" text-anchor="end">${t("today")}</text>`;
  }
  svg += `<line stroke="#85837d" x1="${ml}" x2="${W - mr}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  svg += "</svg>";
  $("#f-chart").innerHTML = svg +
    `<div class="legend"><span><i class="fdot" style="background:#2a78d6;width:8px;height:8px"></i>${t("f_rain")}</span></div>`;
  $("#f-chart").querySelectorAll("rect.bar").forEach((r) => {
    const d = D[+r.dataset.i];
    tip(r, () => `<b>${fmtDate(d.date)}</b>${d.is_forecast ? ` · ${t("forecast")}` : ""}<br>${t("f_col_index")}: ${fmtNum(d.nesterov)} → ${d.fire_roman} (${t("fire_" + d.fire_class)})<br>` +
      `${t("f_tbl_spread")}: ${d.spread_roman}<br>Tmax ${round(d.tmax)}° · ${t("f_col_wind")} ${fmtDec(d.wind)} ${t("ms")} · ${t("f_tbl_rain")} ${fmtDec(d.precip)} ${t("mm")}`);
  });
}

function renderFireMessage(F) {
  const box = $("#f-message");
  const days = F.detail.filter((d) => F.danger_days.includes(d.date));
  if (!days.length) {
    box.innerHTML = `<pre>${esc(t("f_msg_none", { city: cityName(F.city) }))}</pre>`;
    return;
  }
  const worst = Math.max(...days.map((d) => d.spread_class));
  const text = t("f_msg", {
    city: cityName(F.city), roman: ROMAN[worst], label: t("fire_" + worst),
    dates: dateRanges(days.map((d) => d.date)),
  });
  box.innerHTML = `<pre id="f-msg-text">${esc(text)}</pre><button type="button" class="ghost" id="f-copy">${t("copy")}</button>`;
  $("#f-copy").addEventListener("click", async (e) => {
    try { await navigator.clipboard.writeText(text); } catch (err) {
      const range = document.createRange(); range.selectNodeContents($("#f-msg-text"));
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    }
    e.currentTarget.textContent = t("copied");
  });
}
