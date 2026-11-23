"""Wildfire radar: weather-based fire danger for 23 Ukrainian cities."""

from . import firms, risk, weather
from .cities import CITIES
from .risk import Day

# The Nesterov index ignores wind, yet wind is what makes a fire spread.
# Project heuristic, not an official scale: from class III upwards, a daily
# maximum wind of 7 m/s (~25 km/h) or more raises the spread class by one.
WIND_MS = 7.0


def wind_adjusted(fire_class: int, wind_ms: float) -> int:
    if fire_class >= 3 and wind_ms >= WIND_MS:
        return min(5, fire_class + 1)
    return fire_class


def roman(n: int) -> str:
    return risk.FIRE_CLASSES[n - 1][2]


class FireRadar:
    def __init__(self) -> None:
        self.load_demo()

    def load_demo(self) -> None:
        series, today = {}, weather.SCENARIO_TODAY
        for name in CITIES:
            series[name], today = weather.scenario_city(name)
        self.load(series, today, mode="demo", hotspots=[], notes=[{"code": "demo_fire"}])

    def load_live(self, series: dict[str, list[Day]], today: str) -> None:
        notes = [{"code": "live_fire"}]
        hotspots: list[dict] = []
        if not firms.api_key():
            notes.append({"code": "firms_nokey"})
        else:
            try:
                hotspots = firms.fetch()
                notes.append({"code": "firms_count", "n": len(hotspots)})
            except (OSError, ValueError) as e:
                notes.append({"code": "firms_error", "detail": str(e)[:200]})
        self.load(series, today, mode="live", hotspots=hotspots, notes=notes)

    def load(
        self, series: dict[str, list[Day]], today: str, mode: str, hotspots: list[dict], notes: list[dict]
    ) -> None:
        self.mode, self.today, self.hotspots, self.notes = mode, today, hotspots, notes
        self.series = {name: risk.assess(days) for name, days in series.items()}
        for days in self.series.values():
            for d in days:
                d.spread_class = wind_adjusted(d.fire_class, d.wind_max)
        self.dates = sorted({d.date for days in self.series.values() for d in days if d.date >= today})
        self.selected = today if today in self.dates else self.dates[0]
        self.city = self._worst_city(self.selected)

    def select_date(self, date: str) -> None:
        if date in self.dates:
            self.selected = date

    def select_city(self, city: str) -> None:
        if city in CITIES:
            self.city = city

    def day(self, city: str, date: str) -> Day:
        return next((d for d in self.series[city] if d.date == date), self.series[city][-1])

    def _worst_city(self, date: str) -> str:
        return max(CITIES, key=lambda c: (self.day(c, date).spread_class, self.day(c, date).nesterov))

    def counts(self, date: str) -> dict[str, int]:
        classes = [self.day(c, date).spread_class for c in CITIES]
        return {str(k): classes.count(k) for k in range(1, 6)}

    def state(self) -> dict:
        cities = []
        for name, (lat, lon) in CITIES.items():
            d = self.day(name, self.selected)
            cities.append(
                {
                    "name": name,
                    "lat": lat,
                    "lon": lon,
                    "tmax": d.tmax,
                    "wind": d.wind_max,
                    "precip": d.precip,
                    "nesterov": d.nesterov,
                    "fire_class": d.fire_class,
                    "fire_roman": d.fire_roman,
                    "spread_class": d.spread_class,
                    "spread_roman": roman(d.spread_class),
                    "wind_raised": d.spread_class > d.fire_class,
                }
            )
        cities.sort(key=lambda c: (-c["spread_class"], -c["nesterov"], c["name"]))

        detail = [
            {
                "date": d.date,
                "is_forecast": d.is_forecast,
                "is_today": d.date == self.today,
                "tmax": d.tmax,
                "precip": d.precip,
                "wind": d.wind_max,
                "nesterov": d.nesterov,
                "fire_class": d.fire_class,
                "fire_roman": d.fire_roman,
                "spread_class": d.spread_class,
                "spread_roman": roman(d.spread_class),
                "rain_reset": d.precip >= risk.RAIN_RESET_MM,
            }
            for d in self.series[self.city]
        ]

        selected = self.day(self.city, self.selected)
        return {
            "mode": self.mode,
            "today": self.today,
            "selected": self.selected,
            "dates": [{"date": dt, "is_today": dt == self.today, "counts": self.counts(dt)} for dt in self.dates],
            "city": self.city,
            "cities": cities,
            "detail": detail,
            "selected_city_day": {
                "spread_class": selected.spread_class,
                "fire_class": selected.fire_class,
                "nesterov": selected.nesterov,
                "wind": selected.wind_max,
            },
            "danger_days": [d.date for d in self.series[self.city] if d.is_forecast and d.spread_class >= 4],
            "thresholds": [300, 1000, 4000, 10000],
            "wind_ms": WIND_MS,
            "rain_reset_mm": risk.RAIN_RESET_MM,
            "hotspots": self.hotspots,
            "notes": self.notes,
        }
