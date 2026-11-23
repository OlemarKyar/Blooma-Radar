"""Cool places nearby (libraries, malls, community centres) from OpenStreetMap."""

import json
import urllib.parse
import urllib.request

from .people import haversine_km

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
WALK_KMH = 4.0


def fetch_osm_places(lat: float, lon: float, radius_m: int = 1500, timeout: float = 15.0) -> list[dict]:
    around = f"around:{radius_m},{lat},{lon}"
    query = f"""
    [out:json][timeout:12];
    (
      nwr({around})[amenity=library];
      nwr({around})[shop=mall];
      nwr({around})[amenity=community_centre];
    );
    out center 40;
    """
    body = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=body, headers={"User-Agent": "blooma-radar/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.load(resp)

    places = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        plat = el.get("lat") or el.get("center", {}).get("lat")
        plon = el.get("lon") or el.get("center", {}).get("lon")
        if plat is None or plon is None:
            continue
        if tags.get("amenity") == "library":
            kind = "library"
        elif tags.get("shop") == "mall":
            kind = "mall"
        else:
            kind = "community_centre"
        places.append({"name": tags.get("name"), "demo": False, "kind": kind, "lat": plat, "lon": plon})
    return places


def nearest(lat: float, lon: float, places: list[dict]) -> dict | None:
    if not places:
        return None
    place, dist = min(((p, haversine_km(lat, lon, p["lat"], p["lon"])) for p in places), key=lambda x: x[1])
    return {**place, "distance_km": round(dist, 2), "walk_min": round(dist / WALK_KMH * 60)}
