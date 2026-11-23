"""Residents, their Circles and heat vulnerability."""

import math
from dataclasses import dataclass, field

# Odds ratios of heat-related death from the 1995 Chicago case-control study
# (Semenza et al., NEJM 1996). A working air conditioner was protective (OR 0.3),
# so "no AC" uses the inverse.
RISK_FACTORS: dict[str, float] = {
    "not_leaving_home": 6.7,
    "bedridden": 5.5,
    "top_floor": 4.7,
    "cannot_self_care": 4.1,
    "lives_alone": 2.3,
    "no_ac": 1 / 0.3,
}
WEIGHTS = {k: math.log(v) for k, v in RISK_FACTORS.items()}

# One household factor alone (only "no AC" or only "top floor") is not enough;
# a combination is. Age is not scored: the study matched pairs by age.
HIGH_RISK = 3.0
MEDIUM_RISK = 2.0


@dataclass
class Person:
    id: str
    name: str
    age: int
    lat: float
    lon: float
    circle_path: list[str]  # [city, district, building, entrance]
    floor: int = 1
    floors_total: int = 9
    factors: dict[str, bool] = field(default_factory=dict)
    can_help: bool = False
    blooma_user: bool = False

    @property
    def score(self) -> float:
        return round(sum(WEIGHTS[k] for k, v in self.factors.items() if v and k in WEIGHTS), 3)

    @property
    def risk(self) -> str:
        if self.score >= HIGH_RISK:
            return "high"
        if self.score >= MEDIUM_RISK:
            return "medium"
        return "low"

    @property
    def is_vulnerable(self) -> bool:
        return self.risk != "low"

    @property
    def can_volunteer(self) -> bool:
        f = self.factors
        return (
            self.can_help
            and self.risk == "low"
            and 14 <= self.age <= 75
            and not (f.get("bedridden") or f.get("cannot_self_care") or f.get("not_leaving_home"))
        )

    def to_dict(self) -> dict:
        path = self.circle_path
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "lat": self.lat,
            "lon": self.lon,
            "circle_path": path,
            "building": path[2] if len(path) > 2 else "",
            "entrance": path[3] if len(path) > 3 else "",
            "floor": self.floor,
            "floors_total": self.floors_total,
            "factors": [k for k in RISK_FACTORS if self.factors.get(k)],
            "score": self.score,
            "risk": self.risk,
            "vulnerable": self.is_vulnerable,
            "volunteer": self.can_volunteer,
            "blooma_user": self.blooma_user,
        }


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def shared_depth(a: list[str], b: list[str]) -> int:
    """Depth of the deepest Circle two people share (4 = same entrance)."""
    n = 0
    for x, y in zip(a, b, strict=False):
        if x != y:
            break
        n += 1
    return n
