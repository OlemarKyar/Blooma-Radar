"""Synthetic demo district. All residents are fictional."""

import math
import random

from .people import Person

# name, offset north (m), offset east (m), floors, entrances
BUILDINGS = [
    ("А", 0, 0, 16, 3),
    ("Б", 140, 260, 9, 2),
    ("В", 190, -230, 9, 3),
    ("Г", -250, 110, 16, 2),
    ("Д", -210, -200, 5, 2),
    ("Е", -60, 420, 9, 2),
]

# kind, offset north (m), offset east (m)
PLACES = [
    ("library", 330, 40),
    ("mall", -420, 380),
    ("clinic", 60, -480),
    ("park", -380, -40),
    ("cinema", 420, 520),
]

NAMES_F = [
    "Галина",
    "Ніна",
    "Валентина",
    "Людмила",
    "Тамара",
    "Олена",
    "Ірина",
    "Марія",
    "Оксана",
    "Наталія",
    "Софія",
    "Анна",
    "Дарина",
    "Вікторія",
    "Юлія",
    "Катерина",
]
NAMES_M = [
    "Василь",
    "Микола",
    "Петро",
    "Іван",
    "Григорій",
    "Олег",
    "Сергій",
    "Андрій",
    "Дмитро",
    "Максим",
    "Артем",
    "Богдан",
    "Назар",
    "Денис",
    "Тарас",
    "Олександр",
]
INITIALS = "АБВГДЕЗІКЛМНОПРСТФХШЯ"

DISTRICT_OFFSET_M = (900, -600)


def offset(lat: float, lon: float, north_m: float, east_m: float) -> tuple[float, float]:
    return lat + north_m / 111_320, lon + east_m / (111_320 * math.cos(math.radians(lat)))


def neighborhood_center(city_lat: float, city_lon: float) -> tuple[float, float]:
    return offset(city_lat, city_lon, *DISTRICT_OFFSET_M)


def _age(rng: random.Random) -> int:
    r = rng.random()
    if r < 0.28:
        return rng.randint(65, 92)
    if r < 0.62:
        return rng.randint(14, 30)
    return rng.randint(31, 64)


def make_people(city: str, city_lat: float, city_lon: float, seed: int = 7) -> list[Person]:
    rng = random.Random(seed)
    clat, clon = neighborhood_center(city_lat, city_lon)
    people = []
    for building, north, east, floors, entrances in BUILDINGS:
        blat, blon = offset(clat, clon, north, east)
        per_entrance = 5 if floors >= 9 else 4
        for entrance in range(1, entrances + 1):
            for _ in range(per_entrance):
                age = _age(rng)
                first = rng.choice(NAMES_F if rng.random() < 0.55 else NAMES_M)
                name = f"{first} {rng.choice(INITIALS)}."
                floor = rng.randint(1, floors)
                if rng.random() < 0.15:
                    floor = floors
                old = age >= 65
                factors = {
                    "lives_alone": rng.random() < (0.55 if old else 0.2),
                    "not_leaving_home": old and rng.random() < 0.35,
                    "bedridden": old and rng.random() < 0.08,
                    "cannot_self_care": old and rng.random() < 0.12,
                    "top_floor": floor == floors,
                    "no_ac": rng.random() < (0.75 if old else 0.55),
                }
                can_help = rng.random() < (0.65 if 14 <= age <= 35 else 0.25)
                lat, lon = offset(
                    blat, blon, rng.uniform(-18, 18) + (entrance - 1) * 6, rng.uniform(-25, 25) + (entrance - 1) * 22
                )
                people.append(
                    Person(
                        id=f"p{len(people) + 1:03d}",
                        name=name,
                        age=age,
                        lat=round(lat, 6),
                        lon=round(lon, 6),
                        circle_path=[city, "demo", building, str(entrance)],
                        floor=floor,
                        floors_total=floors,
                        factors=factors,
                        can_help=can_help,
                        blooma_user=can_help and 14 <= age <= 35,
                    )
                )
    return people


def demo_places(city_lat: float, city_lon: float) -> list[dict]:
    clat, clon = neighborhood_center(city_lat, city_lon)
    places = []
    for kind, north, east in PLACES:
        lat, lon = offset(clat, clon, north, east)
        places.append({"name": None, "demo": True, "kind": kind, "lat": round(lat, 6), "lon": round(lon, 6)})
    return places
