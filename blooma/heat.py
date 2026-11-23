"""Heat Circles tab: heat level, vulnerable residents, Care Circles, check-ins."""

from dataclasses import asdict

from . import checkins, circles, demo, places, risk, simulate
from .cities import CITIES
from .risk import Day


class HeatCircles:
    def __init__(self, city: str, days: list[Day], today: str, mode: str) -> None:
        self.load(city, days, today, mode)

    def load(
        self,
        city: str,
        days: list[Day],
        today: str,
        mode: str,
        place_list: list[dict] | None = None,
        notes: list[dict] | None = None,
    ) -> None:
        lat, lon = CITIES[city]
        self.mode, self.city, self.lat, self.lon = mode, city, lat, lon
        self.days = risk.assess(days)
        self.today = today
        self.places = place_list or demo.demo_places(lat, lon)
        self.notes = notes or []
        self.people = demo.make_people(city, lat, lon)
        self.force_level: int | None = None

        forecast = [d for d in self.days if d.date >= today]
        hot = [d for d in forecast if d.heat_level >= 2]
        self.selected = (hot or forecast or self.days[-1:])[0].date
        self._plan()

    def select_day(self, date: str) -> None:
        if any(d.date == date for d in self.days):
            self.selected = date
            self._plan()

    def set_force_level(self, level: int | str | None) -> None:
        self.force_level = None if level in (None, "", "auto") else max(0, min(3, int(level)))
        self._plan()

    def check(self, check_id: str, result: str) -> None:
        check = next((c for c in self.checks if c.id == check_id), None)
        if check is None:
            raise KeyError(check_id)
        checkins.apply_result(check, result)

    def reset_checks(self) -> None:
        self.checks = checkins.make_schedule(self.assignments, self.level)

    @property
    def day(self) -> Day:
        return next(d for d in self.days if d.date == self.selected)

    def _plan(self) -> None:
        self.level = self.day.heat_level if self.force_level is None else self.force_level
        self.assignments = circles.form_circles(self.people, self.level)
        self.coverage = circles.coverage(self.assignments, self.people)
        self.groups = circles.group_by_building(self.assignments, self.people)
        self.checks = checkins.make_schedule(self.assignments, self.level)
        self.sim = simulate.run(self.people, self.assignments, self.level) if self.assignments else None

    def state(self) -> dict:
        by_id = {p.id: p for p in self.people}
        assignments = []
        for a in self.assignments:
            p = by_id[a.person_id]
            assignments.append(
                {
                    **asdict(a),
                    "covered": a.covered,
                    "fully_covered": a.fully_covered,
                    "nearest_place": places.nearest(p.lat, p.lon, self.places),
                }
            )
        return {
            "mode": self.mode,
            "city": self.city,
            "center": {"lat": self.lat, "lon": self.lon},
            "today": self.today,
            "selected": self.selected,
            "level": self.level,
            "force_level": self.force_level,
            "day": asdict(self.day),
            "days": [{**asdict(d), "is_today": d.date == self.today} for d in self.days],
            "people": [p.to_dict() for p in self.people],
            "assignments": assignments,
            "coverage": self.coverage,
            "groups": self.groups,
            "checks": [c.to_dict() for c in self.checks],
            "simulation": self.sim,
            "places": self.places,
            "notes": self.notes,
        }
