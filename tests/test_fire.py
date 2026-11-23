import json
import threading
import unittest
import urllib.error
import urllib.request

from blooma import fire, firms, weather
from blooma.app import App
from blooma.cities import CITIES


class WindTest(unittest.TestCase):
    def test_wind_raises_only_from_class_three(self):
        self.assertEqual(fire.wind_adjusted(3, 8.0), 4)
        self.assertEqual(fire.wind_adjusted(5, 12.0), 5)
        self.assertEqual(fire.wind_adjusted(2, 15.0), 2)
        self.assertEqual(fire.wind_adjusted(4, 6.9), 4)


class ScenarioTest(unittest.TestCase):
    def test_regions_differ(self):
        radar = fire.FireRadar()
        south = radar.day("Херсон", "2026-07-18").nesterov
        carpathians = radar.day("Ужгород", "2026-07-20").fire_class
        self.assertGreater(south, radar.day("Львів", "2026-07-18").nesterov)
        self.assertEqual(carpathians, 1)

    def test_deterministic(self):
        a, _ = weather.scenario_city("Одеса")
        b, _ = weather.scenario_city("Одеса")
        self.assertEqual([d.wind_max for d in a], [d.wind_max for d in b])

    def test_state_shape(self):
        st = fire.FireRadar().state()
        self.assertEqual(len(st["cities"]), len(CITIES))
        self.assertEqual(sum(st["dates"][0]["counts"].values()), len(CITIES))
        classes = [c["spread_class"] for c in st["cities"]]
        self.assertEqual(classes, sorted(classes, reverse=True))
        self.assertTrue(all(d["spread_class"] >= d["fire_class"] for d in st["detail"]))


class ParseTest(unittest.TestCase):
    def _item(self, tmax):
        return {
            "daily": {
                "time": ["2026-07-01", "2026-07-02"],
                "temperature_2m_max": [tmax, tmax],
                "temperature_2m_min": [15.0, 16.0],
                "apparent_temperature_max": [None, None],
                "precipitation_sum": [0.0, 4.0],
                "wind_speed_10m_max": [3.0, 9.5],
            },
            "hourly": {
                "time": ["2026-07-01T13:00", "2026-07-02T13:00"],
                "temperature_2m": [tmax - 1, tmax - 1],
                "dew_point_2m": [10.0, 10.0],
            },
        }

    def test_parse_all_cities(self):
        names = list(CITIES)[:2]
        series, today = weather.parse_all([self._item(30.0), self._item(25.0)], names)
        self.assertEqual(set(series), set(names))
        self.assertEqual(series[names[0]][1].wind_max, 9.5)

    def test_wrong_length(self):
        with self.assertRaises(ValueError):
            weather.parse_all([self._item(30.0)], list(CITIES)[:2])

    def test_firms_csv(self):
        text = (
            "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,"
            "confidence,version,bright_ti5,frp,daynight\n"
            "50.1,30.2,330.1,0.4,0.4,2026-07-20,1130,N,VIIRS,n,2.0NRT,290.0,5.3,D\n"
            "bad,row\n"
        )
        pts = firms.parse_csv(text)
        self.assertEqual(len(pts), 1)
        self.assertEqual(pts[0]["frp"], 5.3)


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from blooma import server

        server.APP = App()
        cls.httpd = server.serve("127.0.0.1", 0)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()

    def post(self, path, body):
        req = urllib.request.Request(
            self.base + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as r:
            return json.load(r)

    def test_state_and_actions(self):
        with urllib.request.urlopen(self.base + "/api/state") as r:
            st = json.load(r)
        self.assertEqual(st["mode"], "demo")
        st = self.post("/api/fire/city", {"city": "Львів"})
        self.assertEqual(st["fire"]["city"], "Львів")
        st = self.post("/api/heat/day", {"date": "2026-07-20"})
        self.assertEqual(st["heat"]["level"], 3)
        check = st["heat"]["checks"][0]
        st = self.post("/api/heat/check", {"id": check["id"], "result": "no_answer"})
        self.assertEqual(st["heat"]["checks"][0]["status"], "backup")
        st = self.post("/api/heat/city", {"city": "Одеса"})
        self.assertEqual(st["heat"]["city"], "Одеса")

    def test_static_and_errors(self):
        with urllib.request.urlopen(self.base + "/") as r:
            self.assertIn("text/html", r.headers["Content-Type"])
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            self.post("/api/heat/city", {"city": "Atlantis"})
        self.assertEqual(ctx.exception.code, 400)
        with self.assertRaises(urllib.error.HTTPError):
            urllib.request.urlopen(self.base + "/../server.py")


if __name__ == "__main__":
    unittest.main()
