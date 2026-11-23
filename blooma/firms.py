"""Active fire detections from NASA FIRMS (VIIRS 375 m).

Requires a free MAP_KEY in the FIRMS_MAP_KEY environment variable:
https://firms.modaps.eosdis.nasa.gov/api/map_key/
"""

import csv
import io
import os
import urllib.request

from .cities import UKRAINE_BBOX

API_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
SOURCE = "VIIRS_SNPP_NRT"


def api_key() -> str:
    return os.environ.get("FIRMS_MAP_KEY", "").strip()


def fetch(days: int = 2, key: str | None = None, timeout: float = 30.0) -> list[dict]:
    key = key or api_key()
    if not key:
        return []
    west, south, east, north = UKRAINE_BBOX
    url = f"{API_URL}/{key}/{SOURCE}/{west},{south},{east},{north}/{days}"
    req = urllib.request.Request(url, headers={"User-Agent": "blooma-radar/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        text = resp.read().decode("utf-8", "replace")
    # On a bad key FIRMS answers with plain text instead of CSV.
    if not text.startswith("latitude"):
        raise ValueError(text.strip()[:200] or "empty response")
    return parse_csv(text)


def parse_csv(text: str) -> list[dict]:
    points = []
    for row in csv.DictReader(io.StringIO(text)):
        try:
            points.append(
                {
                    "lat": float(row["latitude"]),
                    "lon": float(row["longitude"]),
                    "date": row.get("acq_date", ""),
                    "time": row.get("acq_time", ""),
                    "frp": float(row.get("frp") or 0),
                    "confidence": row.get("confidence", ""),
                }
            )
        except (KeyError, ValueError):
            continue
    return points
