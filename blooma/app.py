"""Application state shared by both tabs."""

import copy
import threading

from . import demo, places, weather
from .cities import CITIES
from .fire import FireRadar
from .heat import HeatCircles
from .risk import Day


class App:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.mode = "demo"
        self.heat_city = "Київ"
        self._series, self._today = self._demo_series()
        self.fire = FireRadar()
        self.heat = HeatCircles(self.heat_city, self._days(self.heat_city), self._today, self.mode)
        self.heat.notes = [{"code": "demo_heat"}]

    @staticmethod
    def _demo_series() -> tuple[dict[str, list[Day]], str]:
        return {c: weather.scenario_city(c)[0] for c in CITIES}, weather.SCENARIO_TODAY

    def _days(self, city: str) -> list[Day]:
        # Each tab mutates its own copy of the days.
        return copy.deepcopy(self._series[city])

    def set_mode(self, mode: str) -> None:
        if mode == "live":
            self._series, self._today = weather.fetch_all()
            self.fire.load_live(copy.deepcopy(self._series), self._today)
        else:
            mode = "demo"
            self._series, self._today = self._demo_series()
            self.fire.load_demo()
        self.mode = mode
        self._load_heat()

    def set_heat_city(self, city: str) -> None:
        if city not in CITIES:
            raise ValueError(f"unknown city: {city}")
        self.heat_city = city
        self._load_heat()

    def _load_heat(self) -> None:
        notes = [{"code": f"{self.mode}_heat"}]
        place_list = None
        if self.mode == "live":
            lat, lon = demo.neighborhood_center(*CITIES[self.heat_city])
            try:
                place_list = places.fetch_osm_places(lat, lon) or None
            except (OSError, ValueError):
                notes.append({"code": "overpass_down"})
        self.heat.load(self.heat_city, self._days(self.heat_city), self._today, self.mode, place_list, notes)

    def state(self) -> dict:
        return {
            "mode": self.mode,
            "cities": list(CITIES),
            "fire": self.fire.state(),
            "heat": self.heat.state(),
        }
