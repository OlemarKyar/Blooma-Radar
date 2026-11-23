"""Weather input: a synthetic demo scenario or the live Open-Meteo forecast."""

import hashlib
import json
import urllib.parse
import urllib.request

from .cities import CITIES
from .risk import Day

PAST_DAYS = 30  # history needed to accumulate the Nesterov index
FORECAST_DAYS = 7
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
USER_AGENT = "blooma-radar/1.0"

SCENARIO_TODAY = "2026-07-18"

# Synthetic July heatwave for Kyiv: date, Tmax, Tmin, T at 13:00, dew point at 13:00, rain (mm).
_SCENARIO = [
    ("2026-07-01", 24, 15, 23, 17, 8.2),
    ("2026-07-02", 25, 14, 24, 12, 0.0),
    ("2026-07-03", 26, 15, 25, 11, 0.4),
    ("2026-07-04", 26, 15, 25, 11, 0.0),
    ("2026-07-05", 27, 15, 26, 11, 1.1),
    ("2026-07-06", 26, 15, 25, 11, 0.0),
    ("2026-07-07", 27, 15, 26, 10, 0.0),
    ("2026-07-08", 28, 16, 27, 10, 0.0),
    ("2026-07-09", 28, 16, 27, 10, 0.0),
    ("2026-07-10", 29, 17, 28, 10, 0.0),
    ("2026-07-11", 29, 17, 28, 10, 0.0),
    ("2026-07-12", 28, 16, 27, 10, 0.2),
    ("2026-07-13", 29, 17, 28, 10, 0.0),
    ("2026-07-14", 29, 18, 28, 10, 0.0),
    ("2026-07-15", 29, 18, 28, 10, 0.0),
    ("2026-07-16", 31, 18, 30, 10, 0.0),
    ("2026-07-17", 33, 19, 32, 10, 0.0),
    ("2026-07-18", 34, 20, 33, 10, 0.0),
    ("2026-07-19", 36, 22, 35, 10, 0.0),
    ("2026-07-20", 38, 23, 37, 10, 0.0),
    ("2026-07-21", 37, 23, 36, 10, 0.0),
    ("2026-07-22", 35, 21, 34, 11, 0.0),
    ("2026-07-23", 31, 19, 29, 17, 9.0),
    ("2026-07-24", 27, 17, 26, 15, 2.0),
]

CARPATHIAN_CITIES = ("Ужгород", "Івано-Франківськ", "Чернівці")


def _noise(*parts: object) -> float:
    """Deterministic pseudo-random value in [0, 1]."""
    digest = hashlib.sha256("|".join(map(str, parts)).encode()).digest()
    return digest[0] / 255


def scenario_city(name: str) -> tuple[list[Day], str]:
    """Regional variant of the demo scenario: hotter and drier south, rainy west."""
    lat, lon = CITIES[name]
    d_t = (50.45 - lat) * 0.7
    d_dew = -1.5 if lat < 47.5 else (1.5 if lon < 26.5 else 0.0)
    wet_days = set()
    if lon < 26.5:
        wet_days.add("2026-07-11")
    if name in CARPATHIAN_CITIES:
        wet_days |= {"2026-07-16", "2026-07-20"}

    days = []
    for date, tmax, tmin, t13, td13, rain in _SCENARIO:
        n = _noise(name, date)
        wind = 2.5 + 5.0 * n
        if lat < 48.0 and date in ("2026-07-21", "2026-07-22"):
            wind += 4.0
        days.append(
            Day(
                date=date,
                tmax=round(tmax + d_t + (n - 0.5), 1),
                tmin=round(tmin + d_t * 0.6, 1),
                t13=round(t13 + d_t + (n - 0.5), 1),
                td13=round(td13 + d_dew, 1),
                precip=rain + (7.5 if date in wet_days else 0.0),
                wind_max=round(wind, 1),
                is_forecast=date >= SCENARIO_TODAY,
            )
        )
    return days, SCENARIO_TODAY


def fetch_all(timeout: float = 30.0) -> tuple[dict[str, list[Day]], str]:
    """Fetch history and forecast for every city in a single request."""
    names = list(CITIES)
    params = {
        "latitude": ",".join(f"{CITIES[n][0]:.4f}" for n in names),
        "longitude": ",".join(f"{CITIES[n][1]:.4f}" for n in names),
        "daily": "temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,wind_speed_10m_max",
        "hourly": "temperature_2m,dew_point_2m",
        "wind_speed_unit": "ms",
        "timezone": "auto",
        "past_days": str(PAST_DAYS),
        "forecast_days": str(FORECAST_DAYS),
    }
    url = f"{OPEN_METEO_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.load(resp)
    return parse_all(data, names)


def parse_all(data: dict | list, names: list[str]) -> tuple[dict[str, list[Day]], str]:
    # Open-Meteo returns an object for one location and a list for several.
    items = [data] if isinstance(data, dict) else data
    if len(items) != len(names):
        raise ValueError(f"expected {len(names)} locations, got {len(items)}")
    series, today = {}, ""
    for name, item in zip(names, items, strict=True):
        series[name], today = parse_city(item)
    return series, today


def parse_city(item: dict, past_days: int = PAST_DAYS) -> tuple[list[Day], str]:
    hourly = item["hourly"]
    at13 = {
        t[:10]: (temp, dew)
        for t, temp, dew in zip(hourly["time"], hourly["temperature_2m"], hourly["dew_point_2m"], strict=True)
        if t.endswith("T13:00") and temp is not None and dew is not None
    }
    daily = item["daily"]
    dates = daily["time"]
    today = dates[min(past_days, len(dates) - 1)]
    feels = daily.get("apparent_temperature_max") or [None] * len(dates)
    wind = daily.get("wind_speed_10m_max") or [None] * len(dates)

    days = []
    for i, date in enumerate(dates):
        tmax, tmin = daily["temperature_2m_max"][i], daily["temperature_2m_min"][i]
        if tmax is None or tmin is None:
            continue
        t13, td13 = at13.get(date, (tmax - 1, tmin))
        days.append(
            Day(
                date=date,
                tmax=tmax,
                tmin=tmin,
                t13=t13,
                td13=td13,
                precip=daily["precipitation_sum"][i] or 0.0,
                feels_max=feels[i],
                wind_max=wind[i] or 0.0,
                is_forecast=date >= today,
            )
        )
    return days, today
