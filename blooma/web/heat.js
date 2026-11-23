"use strict";

let simGroup = "all";
let checkSlot = null;
let byId = {};

const entranceName = (e) => t("entrance", { e });
const factorList = (p) => p.factors.map((f) => t("fac_" + f));
function placeName(pl) {
  if (pl.name) return pl.name;
  return t("place_" + pl.kind) + (pl.demo ? t("demo_suffix") : "");
}

function bindHeatControls() {
  $("#h-city").addEventListener("change", (e) => act("/api/heat/city", { city: e.target.value }));
  $("#h-force").addEventListener("change", (e) => act("/api/heat/force", { level: e.target.value }));
  $("#h-reset").addEventListener("click", () => act("/api/heat/reset", {}));
  $("#sim-all").addEventListener("click", () => { simGroup = "all"; renderSim(S.heat); });
  $("#sim-alone").addEventListener("click", () => { simGroup = "alone"; renderSim(S.heat); });
}

function renderHeat() {
  const H = S.heat;
  byId = Object.fromEntries(H.people.map((p) => [p.id, p]));
  $("#h-city").innerHTML = S.cities.map((c) => `<option value="${esc(c)}">${esc(cityName(c))}</option>`).join("");
  $("#h-city").value = H.city;
  $("#h-force").value = H.force_level === null ? "auto" : String(H.force_level);
  renderHeatDays(H);
  renderHeatDayCard(H);
  renderHeatKpis(H);
  renderHeatMap(H);
  renderGroups(H);
  renderChecks(H);
  renderSim(H);
}

function renderHeatDays(H) {
  const i = Math.max(0, H.days.findIndex((d) => d.date === H.today));
  $("#h-days").innerHTML = H.days.slice(Math.max(0, i - 3)).map((d) => {
    const tag = d.is_today ? `<b>${t("today")}</b>` : d.is_forecast ? t("forecast") : t("past");
    const feels = d.feels_max != null ? ` · ${t("feels")} ${round(d.feels_max)}°` : "";
    return `<button type="button" class="day ${d.date === H.selected ? "sel" : ""} ${d.is_forecast ? "" : "past"}" data-hdate="${d.date}">
      <span class="d"><span>${fmtDate(d.date)}</span><span>${tag}</span></span>
      <span class="t">${round(d.tmax)}° <small>/ ${round(d.tmin)}°${feels}</small></span>
      <span class="badge lvl-${d.heat_level}">${d.heat_level} · ${t("heat_" + d.heat_level)}</span>
      <span class="fire">${t("fire_short")} ${pill(d.fire_class)}</span>
    </button>`;
  }).join("");
  $$("[data-hdate]").forEach((b) => b.addEventListener("click", () => act("/api/heat/day", { date: b.dataset.hdate })));
}

function renderHeatDayCard(H) {
  const d = H.day;
  const reasons = d.heat_reasons.map((r) => `<li>${esc(t("r_" + r.code, r))}</li>`).join("");
  $("#h-day-card").className = `card day-card l${H.level}`;
  $("#h-day-card").innerHTML = `
    <h3>${t("heat_day", { date: fmtDate(d.date) })}</h3>
    <div class="big">${t("heat_level", { n: H.level, label: t("heat_" + H.level) })}</div>
    <p class="hint" style="margin:6px 0 0">${t("heat_text_" + H.level)}</p>
    ${reasons ? `<ul class="reasons">${reasons}</ul>` : ""}
    ${H.force_level !== null ? `<p class="hint">${t("heat_forced", { n: H.level })}</p>` : ""}`;
  $("#h-fire-card").innerHTML = `
    <h3 class="sub">${t("fire_card")}</h3>
    <div class="big">${pill(d.fire_class)} ${t("fire_" + d.fire_class)}</div>
    <p class="hint">${t("fire_card_text", { n: fmtNum(d.nesterov) })}</p>`;
}

function renderHeatKpis(H) {
  const c = H.coverage;
  if (H.level < 2) {
    $("#h-kpis").innerHTML = `<div class="kpi" style="grid-column:1/-1"><div class="v">${t("k_off_title")}</div><div class="l">${t("k_off")}</div></div>`;
    return;
  }
  const unc = c.uncovered_ids.length;
  $("#h-kpis").innerHTML = `
    <div class="kpi"><div class="v">${c.vulnerable}</div><div class="l">${t("k_vulnerable", { n: c.high_risk })}</div></div>
    <div class="kpi"><div class="v">${fmtPct(c.covered_pct)}</div><div class="l">${t("k_covered")}</div></div>
    <div class="kpi"><div class="v">${c.volunteers_used} / ${c.volunteers_available}</div><div class="l">${t("k_volunteers")}</div></div>
    <div class="kpi ${unc ? "warn" : ""}"><div class="v">${unc}</div><div class="l">${unc ? t("k_uncovered") : t("k_all_covered")}</div></div>`;
}

let heatMap = null;

function personTip(H, p) {
  const helps = H.assignments.filter((a) => a.buddy_ids.includes(p.id)).map((a) => personName(byId[a.person_id].name));
  let s = `<b>${esc(personName(p.name))}</b>, ${t("age", { a: p.age })} · ${esc(buildingName(p.building))}, `
    + `${esc(entranceName(p.entrance))}, ${t("floor", { f: p.floor, n: p.floors_total })}`;
  if (p.vulnerable) {
    s += `<br>${t("tip_risk", { label: t(`risk_${p.risk}`), score: fmtDec(p.score, 2) })}<br>${factorList(p).map(esc).join(", ")}`;
  } else if (p.volunteer) {
    s += `<br>${t("tip_volunteer")}${p.blooma_user ? t("tip_blooma") : ""}`;
    if (helps.length) s += `<br>${t("tip_checks", { names: helps.map(esc).join(", ") })}`;
  }
  return s;
}

function renderHeatMap(H) {
  heatMap ??= new TileMap($("#h-map"), {
    minZoom: 12,
    maxZoom: 18,
    tooltip: (target) => {
      const dot = target.closest("circle.p");
      if (dot) return personTip(S.heat, byId[dot.dataset.id]);
      const place = target.closest("rect.place");
      if (place) return `<b>${esc(placeName(S.heat.places[+place.dataset.place]))}</b><br>${t("place_tip")}`;
      return null;
    },
  });
  heatMap.draw = (P, z) => {
    let svg = "";
    for (const a of H.assignments) {
      const [x1, y1] = P(byId[a.person_id].lat, byId[a.person_id].lon);
      for (const id of a.buddy_ids) {
        const [x2, y2] = P(byId[id].lat, byId[id].lon);
        svg += `<line class="link" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      }
    }
    H.places.forEach((p, i) => {
      const [x, y] = P(p.lat, p.lon);
      svg += `<rect class="place" data-place="${i}" x="${x - 8}" y="${y - 8}" width="16" height="16" rx="4"/>`;
    });
    const buildings = {};
    for (const p of H.people) {
      const [x, y] = P(p.lat, p.lon);
      (buildings[p.building] ??= { xs: [], ys: [] }).xs.push(x);
      buildings[p.building].ys.push(y);
    }
    for (const [b, g] of Object.entries(buildings)) {
      const x = g.xs.reduce((sum, v) => sum + v, 0) / g.xs.length;
      svg += `<text class="bldg" x="${x}" y="${Math.min(...g.ys) - 12}" text-anchor="middle">${esc(buildingName(b))}</text>`;
    }
    const order = (p) => (p.vulnerable ? 2 : p.volunteer ? 1 : 0);
    const r = z >= 17 ? 1.4 : 1;
    for (const p of [...H.people].sort((a, b) => order(a) - order(b))) {
      const [x, y] = P(p.lat, p.lon);
      const cls = p.vulnerable ? p.risk : p.volunteer ? "vol" : "other";
      const color = { high: "var(--high)", medium: "var(--medium)", vol: "var(--vol)", other: "var(--other)" }[cls];
      svg += `<circle class="p" data-id="${p.id}" cx="${x}" cy="${y}" r="${(cls === "other" ? 4 : 7) * r}" fill="${color}"/>`;
    }
    return svg;
  };
  heatMap.fitOnce(`${S.mode}/${H.city}`, [...H.people, ...H.places], 50);
  $("#h-map-hint").textContent = t("h_map_hint", { city: cityName(H.city), n: H.people.length, b: new Set(H.people.map((p) => p.building)).size });
}

function highlight(ids, on) {
  for (const id of ids) {
    const c = document.querySelector(`#h-map circle[data-id="${id}"]`);
    if (c) { c.classList.toggle("hl", on); if (on) c.parentNode.appendChild(c); }
  }
}

function renderGroups(H) {
  if (!H.assignments.length) {
    $("#h-groups").innerHTML = `<div class="empty">${t("h_groups_off")}</div>`;
    return;
  }
  const byPerson = Object.fromEntries(H.assignments.map((a) => [a.person_id, a]));
  $("#h-groups").innerHTML = H.groups.map((g) => `
    <div class="group">
      <header><b>${t("g_circle", { b: esc(buildingName(g.building)) })}</b><span>${t("g_counts", { v: g.members.length, h: g.volunteers.length })}</span></header>
      ${g.members.map((pid) => groupRow(byId[pid], byPerson[pid])).join("")}
    </div>`).join("");
  $$("#h-groups .row[data-pid]").forEach((row) => {
    const ids = [row.dataset.pid, ...(row.dataset.buddies ? row.dataset.buddies.split(",") : [])];
    row.addEventListener("mouseenter", () => highlight(ids, true));
    row.addEventListener("mouseleave", () => highlight(ids, false));
  });
}

function groupRow(p, a) {
  let buddies;
  if (!a.buddy_ids.length) {
    buddies = `<div class="buddies">${t("g_none")}</div>`;
  } else {
    const list = a.buddy_ids.map((id, i) =>
      `<span class="b">${esc(personName(byId[id].name))}</span> (${t("depth_" + a.shared_depth[i])}, ${meters(a.distances_km[i])})`).join(", ");
    const lack = a.needed > a.buddy_ids.length ? ` · ${t("g_need_more", { n: a.needed - a.buddy_ids.length })}` : "";
    buddies = `<div class="buddies">${t("g_checkers")} ${list}${lack}</div>`;
  }
  const np = a.nearest_place;
  const cool = np ? `<div class="cool">${t("g_cool", { name: esc(placeName(np)), dist: meters(np.distance_km), min: np.walk_min })}</div>` : "";
  return `<div class="row ${a.buddy_ids.length ? "" : "uncovered"}" data-pid="${p.id}" data-buddies="${a.buddy_ids.join(",")}">
    <div class="who"><b>${esc(personName(p.name))}</b><span>${t("age", { a: p.age })} · ${esc(entranceName(p.entrance))}, ${t("floor", { f: p.floor, n: p.floors_total })}</span>
      <span class="risk ${p.risk}">${t("risk_" + p.risk)}</span></div>
    <div class="chips">${factorList(p).map((f) => `<span class="chip">${esc(f)}</span>`).join("")}</div>
    ${buddies}${cool}
  </div>`;
}

const STATUS_CLASS = { pending: "st-pending", ok: "st-ok", help: "st-help", backup: "st-backup", escalated: "st-escalated" };

function renderChecks(H) {
  const box = $("#h-checks");
  if (!H.checks.length) { box.innerHTML = `<div class="empty">${t("h_checks_off")}</div>`; return; }
  const slots = [...new Set(H.checks.map((c) => c.slot))];
  if (!slots.includes(checkSlot)) checkSlot = slots[0];
  const list = H.checks.filter((c) => c.slot === checkSlot);
  const n = (st) => list.filter((c) => c.status === st).length;
  box.innerHTML = `
    <div class="section-head" style="margin-bottom:8px">
      <div class="seg small">${slots.map((s) => `<button type="button" data-slot="${s}" class="${s === checkSlot ? "on" : ""}">${s}</button>`).join("")}</div>
      <span class="hint">${t("c_summary", { ok: n("ok"), help: n("help"), backup: n("backup"), escalated: n("escalated"), pending: n("pending") })}</span>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>${t("c_person")}</th><th>${t("c_buddy")}</th><th>${t("c_status")}</th><th>${t("c_result")}</th></tr></thead>
      <tbody>${list.map(checkRow).join("")}</tbody>
    </table></div>`;
  box.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => { checkSlot = b.dataset.slot; renderChecks(S.heat); }));
  box.querySelectorAll("[data-check]").forEach((b) => b.addEventListener("click", () => act("/api/heat/check", { id: b.dataset.check, result: b.dataset.result })));
}

function checkRow(c) {
  const p = byId[c.person_id];
  const who = c.current_buddy ? esc(personName(byId[c.current_buddy].name)) : "—";
  const closed = ["ok", "help", "escalated"].includes(c.status);
  const advice = c.status === "help" ? t("adv_help") : c.status === "escalated" ? t("adv_escalated") : "";
  const btn = (result, key) => `<button type="button" data-check="${esc(c.id)}" data-result="${result}" ${closed ? "disabled" : ""}>${t(key)}</button>`;
  return `<tr>
    <td><b>${esc(personName(p.name))}</b><br><span class="hint">${esc(buildingName(p.building))}, ${esc(entranceName(p.entrance))}</span></td>
    <td>${who}</td>
    <td><span class="status ${STATUS_CLASS[c.status]}">${t("st_" + c.status)}</span>${advice ? `<div class="advice">${esc(advice)}</div>` : ""}</td>
    <td><div class="actions">${btn("ok", "c_ok")}${btn("help", "c_help")}${btn("no_answer", "c_no")}</div></td>
  </tr>`;
}

function renderSim(H) {
  const sim = H.simulation;
  $("#sim-all").classList.toggle("on", simGroup === "all");
  $("#sim-alone").classList.toggle("on", simGroup === "alone");
  if (!sim) {
    $("#sim-chart").innerHTML = `<div class="empty">${t("sim_off")}</div>`;
    $("#sim-kpis").innerHTML = "";
    $("#sim-assumptions").textContent = "";
    return;
  }
  const wo = simGroup === "all" ? sim.without : sim.alone_without;
  const wi = simGroup === "all" ? sim.with : sim.alone_with;
  const W = 640, Ht = 290, ml = 46, mr = 20, mt = 34, mb = 40;
  const X = (h) => ml + (h / 48) * (W - ml - mr);
  const Y = (pct) => mt + (1 - pct / 100) * (Ht - mt - mb);
  const at = (cdf, h) => cdf.find((p) => p.h === h).pct;
  let svg = `<svg viewBox="0 0 ${W} ${Ht}" role="img" aria-label="${esc(t("sim_y"))}">`;
  svg += `<text x="${ml}" y="14" class="axis">${t("sim_y")}</text>`;
  for (const v of [0, 25, 50, 75, 100]) svg += `<line class="grid-line" x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axis" x="${ml - 8}" y="${Y(v) + 4}" text-anchor="end">${v}%</text>`;
  for (const h of [0, 6, 12, 24, 36, 48]) svg += `<text class="axis" x="${X(h)}" y="${Ht - mb + 18}" text-anchor="middle">${t("sim_h", { h })}</text>`;
  svg += `<text class="axis" x="${(ml + W - mr) / 2}" y="${Ht - 4}" text-anchor="middle">${t("sim_x")}</text>`;
  const line = (cdf, color, dash) => `<polyline fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" ${dash ? 'stroke-dasharray="6 4"' : ""} points="${cdf.map((p) => `${X(p.h)},${Y(p.pct)}`).join(" ")}"/>`;
  svg += line(wo.cdf, "var(--series-without)", true) + line(wi.cdf, "var(--series-with)", false);
  svg += `<text class="lbl" x="${X(30)}" y="${Y(at(wi.cdf, 30)) - 10}" text-anchor="middle">${t("sim_with_short")}</text>`;
  svg += `<text class="lbl" x="${X(30)}" y="${Y(at(wo.cdf, 30)) + 22}" text-anchor="middle">${t("sim_without_short")}</text>`;
  svg += `<line id="xhair" x1="0" x2="0" y1="${mt}" y2="${Ht - mb}" stroke="#85837d" stroke-width="1" visibility="hidden"/>`;
  svg += `<rect id="hit" x="${ml}" y="${mt}" width="${W - ml - mr}" height="${Ht - mt - mb}" fill="transparent"/></svg>`;
  $("#sim-chart").innerHTML = `<div><span class="key"><i style="border-color:var(--series-with)"></i>${t("sim_with")}</span><span class="key"><i style="border-color:var(--series-without);border-top-style:dashed"></i>${t("sim_without")}</span></div>` + svg;

  const svgEl = $("#sim-chart svg"), hit = $("#hit"), xh = $("#xhair"), tipEl = $("#tooltip");
  hit.addEventListener("mousemove", (e) => {
    const r = svgEl.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    const pt = wi.cdf.reduce((best, p) => (Math.abs(X(p.h) - sx) < Math.abs(X(best.h) - sx) ? p : best));
    xh.setAttribute("x1", X(pt.h)); xh.setAttribute("x2", X(pt.h)); xh.setAttribute("visibility", "visible");
    tipEl.innerHTML = t("sim_tip", { h: pt.h, a: fmtDec(pt.pct), b: fmtDec(at(wo.cdf, pt.h)) });
    tipEl.hidden = false; tipEl.style.left = `${e.clientX + 14}px`; tipEl.style.top = `${e.clientY + 14}px`;
  });
  hit.addEventListener("mouseleave", () => { xh.setAttribute("visibility", "hidden"); tipEl.hidden = true; });

  const events = fmtNum(sim.events);
  const who = simGroup === "all" ? t("sim_who_all", { n: H.coverage.vulnerable, e: events }) : t("sim_who_alone", { n: sim.alone_people, e: events });
  const kpi = (key, a, b) => `<div class="sim-kpi"><div class="l">${t(key)}</div><div class="v"><span class="from">${a}</span><span class="to">${b}</span></div></div>`;
  const hours = (x) => `${fmtDec(x)} ${t("unit_h")}`;
  $("#sim-kpis").innerHTML = `<div class="hint">${who}</div>`
    + kpi("sim_6", fmtPct(wo.within_6h), fmtPct(wi.within_6h))
    + kpi("sim_12", fmtPct(wo.within_12h), fmtPct(wi.within_12h))
    + kpi("sim_med", hours(wo.median_h), hours(wi.median_h));
  const a = sim.assumptions;
  $("#sim-assumptions").textContent = t("sim_assume", {
    a: a.contact_mean_hours.household, b: a.contact_mean_hours.alone_out, c: a.contact_mean_hours.alone_home,
    p: Math.round(a.p_reach * 100), d: a.backup_delay_h, slots: a.slots.join(", "),
  });
}
