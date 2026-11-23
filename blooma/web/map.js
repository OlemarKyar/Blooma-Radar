"use strict";

const TILE = 256;
// OpenStreetMap tiles need no API key. To use another provider, add it here and
// change BASEMAP; keep its attribution, it is a licence requirement.
const BASEMAPS = {
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
};
const BASEMAP = BASEMAPS.osm;

function worldXY(lat, lon, z) {
  const n = TILE * 2 ** z;
  const s = Math.sin((Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180);
  return [((lon + 180) / 360) * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n];
}

function worldLatLon(x, y, z) {
  const n = TILE * 2 ** z;
  const lon = (x / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  return [lat, lon];
}

/**
 * Minimal slippy map: integer zoom levels (tiles are never scaled, so they stay sharp),
 * wheel / button / double-click zoom anchored at the cursor, drag to pan.
 * Overlay content is an SVG string produced by `draw(P)`; interaction uses event
 * delegation so it survives re-renders.
 */
class TileMap {
  constructor(el, { minZoom = 3, maxZoom = 18, onClick, tooltip } = {}) {
    this.el = el;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.onClick = onClick;
    this.tooltip = tooltip;
    this.draw = () => "";
    this.z = minZoom;
    this.center = [0, 0];
    this.fitKey = null;
    this.tiles = new Map();

    el.classList.add("tilemap");
    el.innerHTML = `
      <div class="tm-tiles"></div>
      <svg class="tm-overlay"></svg>
      <div class="tm-controls">
        <button type="button" data-zoom="1" aria-label="Zoom in">+</button>
        <button type="button" data-zoom="-1" aria-label="Zoom out">−</button>
        <button type="button" data-zoom="fit" aria-label="Fit">⤢</button>
      </div>
      <span class="attrib">${BASEMAP.attribution}</span>`;
    this.tileLayer = el.querySelector(".tm-tiles");
    this.svg = el.querySelector(".tm-overlay");
    this._bind();
  }

  get size() {
    return [this.el.clientWidth, this.el.clientHeight];
  }

  P = (lat, lon) => {
    const [cx, cy] = worldXY(this.center[0], this.center[1], this.z);
    const [x, y] = worldXY(lat, lon, this.z);
    const [w, h] = this.size;
    return [x - cx + w / 2, y - cy + h / 2];
  };

  fit(points, pad = 60) {
    this.fitPoints = points;
    this.fitPad = pad;
    const [w, h] = this.size;
    const xy = points.map((p) => worldXY(p.lat, p.lon, 0));
    const xs = xy.map((q) => q[0]);
    const ys = xy.map((q) => q[1]);
    const spanX = Math.max(1e-9, Math.max(...xs) - Math.min(...xs));
    const spanY = Math.max(1e-9, Math.max(...ys) - Math.min(...ys));
    const z = Math.floor(Math.log2(Math.min((w - pad) / spanX, (h - pad) / spanY)));
    this.z = Math.max(this.minZoom, Math.min(this.maxZoom, z));
    this.center = worldLatLon((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, 0);
    this.render();
  }

  /** Fits only when `key` changes, so user zoom/pan survives data updates. */
  fitOnce(key, points, pad) {
    if (this.fitKey === key) return this.render();
    this.fitKey = key;
    return this.fit(points, pad);
  }

  zoomBy(delta, anchor) {
    const z = Math.max(this.minZoom, Math.min(this.maxZoom, this.z + delta));
    if (z === this.z) return;
    const [w, h] = this.size;
    const [ax, ay] = anchor || [w / 2, h / 2];
    const [cx, cy] = worldXY(this.center[0], this.center[1], this.z);
    const fx = cx + ax - w / 2;
    const fy = cy + ay - h / 2;
    const k = 2 ** (z - this.z);
    this.center = worldLatLon(fx * k - (ax - w / 2), fy * k - (ay - h / 2), z);
    this.z = z;
    this.render();
  }

  panBy(dx, dy) {
    const [cx, cy] = worldXY(this.center[0], this.center[1], this.z);
    this.center = worldLatLon(cx - dx, cy - dy, this.z);
    this.render();
  }

  render() {
    const [w, h] = this.size;
    this._renderTiles(w, h);
    this.svg.setAttribute("width", w);
    this.svg.setAttribute("height", h);
    this.svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    this.svg.innerHTML = this.draw(this.P, this.z);
  }

  _tileUrl(z, x, y) {
    return BASEMAP.url.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  }

  _renderTiles(w, h) {
    const z = this.z;
    const n = 2 ** z;
    const [cx, cy] = worldXY(this.center[0], this.center[1], z);
    const ox = cx - w / 2;
    const oy = cy - h / 2;
    const wanted = new Set();

    for (let tx = Math.floor(ox / TILE); tx <= Math.floor((ox + w) / TILE); tx++) {
      for (let ty = Math.max(0, Math.floor(oy / TILE)); ty <= Math.min(n - 1, Math.floor((oy + h) / TILE)); ty++) {
        const wx = ((tx % n) + n) % n;
        const key = `${z}/${tx}/${ty}`;
        wanted.add(key);
        let img = this.tiles.get(key);
        if (!img) {
          img = new Image(TILE, TILE);
          img.className = "tile";
          img.alt = "";
          img.draggable = false;
          img.onload = () => img.classList.add("loaded");
          img.onerror = () => img.remove();
          img.src = this._tileUrl(z, wx, ty);
          this.tiles.set(key, img);
          this.tileLayer.appendChild(img);
        }
        img.style.transform = `translate(${Math.round(tx * TILE - ox)}px, ${Math.round(ty * TILE - oy)}px)`;
      }
    }
    for (const [key, img] of this.tiles) {
      if (!wanted.has(key)) {
        img.remove();
        this.tiles.delete(key);
      }
    }
  }

  _bind() {
    const el = this.el;
    let drag = null;
    let frame = 0;
    const local = (e) => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };

    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (this._wheelLock) return;
      this._wheelLock = true;
      setTimeout(() => { this._wheelLock = false; }, 120);
      this.zoomBy(e.deltaY < 0 ? 1 : -1, local(e));
    }, { passive: false });

    el.addEventListener("dblclick", (e) => {
      if (e.target.closest(".tm-controls")) return;
      e.preventDefault();
      this.zoomBy(e.shiftKey ? -1 : 1, local(e));
    });

    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(".tm-controls")) return;
      drag = { x: e.clientX, y: e.clientY, moved: false };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      if (!drag.moved) el.classList.add("dragging");
      drag.moved = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      this._hideTip();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => this.panBy(dx, dy));
    });
    window.addEventListener("pointerup", () => {
      if (!drag) return;
      this._suppressClick = drag.moved;
      el.classList.remove("dragging");
      drag = null;
    });

    el.addEventListener("click", (e) => {
      const zoom = e.target.closest("[data-zoom]");
      if (zoom) {
        if (zoom.dataset.zoom === "fit") this.fit(this.fitPoints, this.fitPad);
        else this.zoomBy(Number(zoom.dataset.zoom));
        return;
      }
      if (this._suppressClick) {
        this._suppressClick = false;
        return;
      }
      this.onClick?.(e.target);
    });

    el.addEventListener("mousemove", (e) => {
      if (drag?.moved || !this.tooltip) return;
      const html = this.tooltip(e.target);
      const tipEl = document.querySelector("#tooltip");
      if (!html) return this._hideTip();
      tipEl.innerHTML = html;
      tipEl.hidden = false;
      tipEl.style.left = `${Math.min(e.clientX + 14, window.innerWidth - tipEl.offsetWidth - 8)}px`;
      tipEl.style.top = `${e.clientY + 14}px`;
    });
    el.addEventListener("mouseleave", () => this._hideTip());
  }

  _hideTip() {
    const tipEl = document.querySelector("#tooltip");
    if (tipEl) tipEl.hidden = true;
  }
}
