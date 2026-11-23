"""HTTP server and JSON API built on the standard library.

Every successful response is the full application state.

    GET  /api/state
    POST /api/mode          {"mode": "demo" | "live"}
    POST /api/fire/date     {"date": "2026-07-20"}
    POST /api/fire/city     {"city": "Херсон"}
    POST /api/heat/city     {"city": "Київ"}
    POST /api/heat/day      {"date": "2026-07-20"}
    POST /api/heat/force    {"level": "auto" | 2 | 3}
    POST /api/heat/check    {"id": "p001@10:00", "result": "ok" | "help" | "no_answer"}
    POST /api/heat/reset    {}

Errors: {"error": "<code>", "detail": "..."}
"""

import json
from collections.abc import Callable
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from .app import App

WEB_DIR = Path(__file__).resolve().parent / "web"
CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".json": "application/json; charset=utf-8",
}

APP = App()

ROUTES: dict[str, Callable[[App, dict], None]] = {
    "/api/mode": lambda a, b: a.set_mode(b.get("mode", "demo")),
    "/api/fire/date": lambda a, b: a.fire.select_date(b["date"]),
    "/api/fire/city": lambda a, b: a.fire.select_city(b["city"]),
    "/api/heat/city": lambda a, b: a.set_heat_city(b["city"]),
    "/api/heat/day": lambda a, b: a.heat.select_day(b["date"]),
    "/api/heat/force": lambda a, b: a.heat.set_force_level(b.get("level")),
    "/api/heat/check": lambda a, b: a.heat.check(b["id"], b["result"]),
    "/api/heat/reset": lambda a, b: a.heat.reset_checks(),
}


class Handler(BaseHTTPRequestHandler):
    server_version = "BloomaRadar/1.0"

    def log_message(self, format: str, *args: object) -> None:
        pass

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, payload: dict, status: int = 200) -> None:
        self._send(status, json.dumps(payload, ensure_ascii=False).encode(), CONTENT_TYPES[".json"])

    def do_GET(self) -> None:
        path = self.path.split("?")[0]
        if path == "/api/state":
            with APP.lock:
                return self._json(APP.state())
        file = (WEB_DIR / (path.lstrip("/") or "index.html")).resolve()
        if WEB_DIR not in file.parents or not file.is_file():
            return self._json({"error": "not_found"}, 404)
        self._send(200, file.read_bytes(), CONTENT_TYPES.get(file.suffix, "application/octet-stream"))

    def do_POST(self) -> None:
        route = ROUTES.get(self.path.split("?")[0])
        if route is None:
            return self._json({"error": "not_found"}, 404)
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        except json.JSONDecodeError:
            return self._json({"error": "bad_json"}, 400)
        try:
            with APP.lock:
                route(APP, body)
                return self._json(APP.state())
        except (KeyError, ValueError, TypeError) as e:
            return self._json({"error": "bad_request", "detail": str(e)}, 400)
        except OSError as e:
            return self._json({"error": "network", "detail": str(e)}, 502)


def serve(host: str = "127.0.0.1", port: int = 8000) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), Handler)
