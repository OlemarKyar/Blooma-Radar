"""Heat level and weather-based wildfire danger (Nesterov index)."""

from dataclasses import dataclass, field

HOT_DAY = 30.0
VERY_HOT_DAY = 35.0
TROPICAL_NIGHT = 20.0  # ETCCDI TR20
WAVE_MIN_DAYS = 3
RAIN_RESET_MM = 3.0

HEAT_LABELS = {0: "normal", 1: "caution", 2: "dangerous", 3: "very dangerous"}

# (upper bound, class, roman numeral, label)
FIRE_CLASSES = [
    (300, 1, "I", "none"),
    (1000, 2, "II", "low"),
    (4000, 3, "III", "moderate"),
    (10000, 4, "IV", "high"),
    (float("inf"), 5, "V", "extreme"),
]


@dataclass
class Day:
    date: str
    tmax: float
    tmin: float
    t13: float
    td13: float
    precip: float
    feels_max: float | None = None
    wind_max: float = 0.0
    is_forecast: bool = False
    spread_class: int = 1
    heat_level: int = 0
    heat_label: str = ""
    heat_reasons: list = field(default_factory=list)
    in_wave: bool = False
    nesterov: float = 0.0
    fire_class: int = 1
    fire_roman: str = "I"
    fire_label: str = ""


def nesterov_increment(t13: float, td13: float) -> float:
    if t13 <= 0:
        return 0.0
    return max(0.0, t13 * (t13 - td13))


def fire_class(g: float) -> tuple[int, str, str]:
    for limit, num, roman, label in FIRE_CLASSES:
        if g <= limit:
            return num, roman, label
    raise ValueError(g)


def mark_heat_waves(days: list[Day]) -> None:
    run: list[Day] = []
    for d in [*days, None]:
        if d is not None and d.tmax >= HOT_DAY:
            run.append(d)
            continue
        if len(run) >= WAVE_MIN_DAYS:
            for x in run:
                x.in_wave = True
        run = []


def heat_level(day: Day) -> tuple[int, list[dict]]:
    """Return the heat level (0-3) and machine-readable reasons for it."""
    if day.tmax >= VERY_HOT_DAY:
        level, reasons = 2, [{"code": "very_hot", "value": round(day.tmax), "limit": VERY_HOT_DAY}]
    elif day.tmax >= HOT_DAY:
        level, reasons = 1, [{"code": "hot", "value": round(day.tmax), "limit": HOT_DAY}]
    else:
        return 0, []

    # A warm night or a multi-day wave stops the body from recovering.
    if day.tmin >= TROPICAL_NIGHT:
        reasons.append({"code": "tropical_night", "value": round(day.tmin)})
    if day.in_wave:
        reasons.append({"code": "wave"})
    if len(reasons) > 1:
        level += 1
    return min(level, 3), reasons


def assess(days: list[Day]) -> list[Day]:
    """Fill heat and fire fields in place; returns the days sorted by date."""
    days = sorted(days, key=lambda d: d.date)
    mark_heat_waves(days)
    g = 0.0
    for d in days:
        g = 0.0 if d.precip >= RAIN_RESET_MM else g + nesterov_increment(d.t13, d.td13)
        d.nesterov = round(g, 1)
        d.fire_class, d.fire_roman, d.fire_label = fire_class(g)
        d.heat_level, d.heat_reasons = heat_level(d)
        d.heat_label = HEAT_LABELS[d.heat_level]
    return days
