"""Monte Carlo model: how long until someone notices a resident is unwell.

A model with explicit assumptions, not evidence. Without the system a person
is noticed only at ordinary contacts (a Poisson process); with it, scheduled
check-ins are added, each completed with probability P_REACH per volunteer.
"""

import random
import statistics

from .checkins import SLOTS
from .circles import Assignment
from .people import Person

CONTACT_MEAN_H = {"household": 6.0, "alone_out": 24.0, "alone_home": 72.0}
P_REACH = 0.85
BACKUP_DELAY_H = 1.0
RESPONSE_H = 0.25
WAVE_HOURS = 72
HORIZON_H = 24 * 7
CDF_HOURS = [0, 2, 4, 6, 8, 12, 16, 20, 24, 30, 36, 48]


def contact_profile(person: Person) -> str:
    f = person.factors
    if not f.get("lives_alone"):
        return "household"
    if f.get("not_leaving_home") or f.get("bedridden"):
        return "alone_home"
    return "alone_out"


def _slot_hours(level: int) -> list[float]:
    hours = []
    for slot in SLOTS.get(min(level, 3), []):
        h, m = slot.split(":")
        hours.append(int(h) + int(m) / 60)
    return hours


def _check_delay(t: float, slots: list[float], n_buddies: int, rng: random.Random) -> float | None:
    """Hours from t until the first successful check-in, or None."""
    if not slots or not n_buddies:
        return None
    day = int(t // 24)
    while day * 24 <= t + HORIZON_H:
        for s in slots:
            when = day * 24 + s
            if when < t:
                continue
            for k in range(n_buddies):
                if rng.random() < P_REACH:
                    return when + k * BACKUP_DELAY_H - t + RESPONSE_H
        day += 1
    return None


def run(people: list[Person], assignments: list[Assignment], heat_level: int, n: int = 400, seed: int = 2027) -> dict:
    rng = random.Random(seed)
    by_id = {p.id: p for p in people}
    slots = _slot_hours(heat_level)
    without, with_sys, alone_without, alone_with = [], [], [], []

    for a in assignments:
        profile = contact_profile(by_id[a.person_id])
        mean = CONTACT_MEAN_H[profile]
        for _ in range(n):
            t = rng.uniform(0, WAVE_HOURS)
            natural = rng.expovariate(1 / mean)
            check = _check_delay(t, slots, len(a.buddy_ids), rng)
            found = natural if check is None else min(natural, check)
            without.append(natural)
            with_sys.append(found)
            if profile != "household":
                alone_without.append(natural)
                alone_with.append(found)

    return {
        "events": len(without),
        "assumptions": {
            "contact_mean_hours": CONTACT_MEAN_H,
            "p_reach": P_REACH,
            "backup_delay_h": BACKUP_DELAY_H,
            "response_h": RESPONSE_H,
            "slots": SLOTS.get(min(heat_level, 3), []),
        },
        "without": _summary(without),
        "with": _summary(with_sys),
        "alone_people": sum(contact_profile(by_id[a.person_id]) != "household" for a in assignments),
        "alone_without": _summary(alone_without),
        "alone_with": _summary(alone_with),
    }


def _summary(values: list[float]) -> dict:
    if not values:
        return {"median_h": None, "within_6h": 0, "within_12h": 0, "within_24h": 0, "cdf": []}

    def share(h: float) -> float:
        return round(100 * sum(v <= h for v in values) / len(values), 1)

    return {
        "median_h": round(statistics.median(values), 1),
        "within_6h": share(6),
        "within_12h": share(12),
        "within_24h": share(24),
        "cdf": [{"h": h, "pct": share(h)} for h in CDF_HOURS],
    }
