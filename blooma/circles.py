"""Care Circles: which neighbour volunteers check on which vulnerable residents."""

from dataclasses import dataclass

from .people import Person, haversine_km, shared_depth

MAX_KM = 1.0  # walking far in the heat is a risk in itself
CAPACITY = 3
W_TREE, W_DIST, W_LOAD = 1.0, 2.0, 0.5


@dataclass
class Assignment:
    person_id: str
    buddy_ids: list[str]
    needed: int
    distances_km: list[float]
    shared_depth: list[int]

    @property
    def covered(self) -> bool:
        return bool(self.buddy_ids)

    @property
    def fully_covered(self) -> bool:
        return len(self.buddy_ids) >= self.needed


def buddies_needed(person: Person, heat_level: int) -> int:
    if heat_level < 2 or not person.is_vulnerable:
        return 0
    return 2 if person.risk == "high" or heat_level >= 3 else 1


def candidate_score(volunteer: Person, person: Person, load: int) -> float:
    depth = shared_depth(volunteer.circle_path, person.circle_path)
    dist = haversine_km(volunteer.lat, volunteer.lon, person.lat, person.lon)
    return W_TREE * depth - W_DIST * dist - W_LOAD * load


def form_circles(
    people: list[Person], heat_level: int, max_km: float = MAX_KM, capacity: int = CAPACITY
) -> list[Assignment]:
    """Greedy assignment, highest-risk residents first."""
    helpers = [p for p in people if p.can_volunteer]
    load = {h.id: 0 for h in helpers}
    vulnerable = sorted((p for p in people if buddies_needed(p, heat_level)), key=lambda p: (-p.score, p.id))

    result = []
    for person in vulnerable:
        options = []
        for h in helpers:
            if h.id == person.id or load[h.id] >= capacity:
                continue
            dist = haversine_km(person.lat, person.lon, h.lat, h.lon)
            if dist <= max_km:
                options.append((candidate_score(h, person, load[h.id]), h, dist))
        options.sort(key=lambda o: (-o[0], o[1].id))
        chosen = options[: buddies_needed(person, heat_level)]
        for _, h, _ in chosen:
            load[h.id] += 1
        result.append(
            Assignment(
                person_id=person.id,
                buddy_ids=[h.id for _, h, _ in chosen],
                needed=buddies_needed(person, heat_level),
                distances_km=[round(d, 3) for _, _, d in chosen],
                shared_depth=[shared_depth(person.circle_path, h.circle_path) for _, h, _ in chosen],
            )
        )
    return result


def _pct(part: int, whole: int) -> float:
    return round(100 * part / whole, 1) if whole else 0.0


def coverage(assignments: list[Assignment], people: list[Person]) -> dict:
    by_id = {p.id: p for p in people}
    high = [a for a in assignments if by_id[a.person_id].risk == "high"]
    covered = sum(a.covered for a in assignments)
    full = sum(a.fully_covered for a in assignments)
    return {
        "vulnerable": len(assignments),
        "high_risk": len(high),
        "covered": covered,
        "covered_pct": _pct(covered, len(assignments)),
        "fully_covered": full,
        "fully_covered_pct": _pct(full, len(assignments)),
        "high_two_buddies_pct": _pct(sum(a.fully_covered for a in high), len(high)),
        "uncovered_ids": [a.person_id for a in assignments if not a.covered],
        "volunteers_available": sum(p.can_volunteer for p in people),
        "volunteers_used": len({b for a in assignments for b in a.buddy_ids}),
    }


def group_by_building(assignments: list[Assignment], people: list[Person]) -> list[dict]:
    by_id = {p.id: p for p in people}
    groups: dict[tuple, dict] = {}
    for a in assignments:
        path = tuple(by_id[a.person_id].circle_path[:3])
        g = groups.setdefault(path, {"path": list(path), "building": path[2], "members": [], "volunteers": set()})
        g["members"].append(a.person_id)
        g["volunteers"].update(a.buddy_ids)
    return sorted(({**g, "volunteers": sorted(g["volunteers"])} for g in groups.values()), key=lambda g: g["building"])
