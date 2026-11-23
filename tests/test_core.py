import math
import unittest

from blooma import checkins, circles, risk, simulate
from blooma.demo import make_people
from blooma.people import Person, shared_depth
from blooma.weather import parse_city, scenario_city


def day(date, tmax, tmin=15, t13=None, td13=10, precip=0.0):
    return risk.Day(date=date, tmax=tmax, tmin=tmin, t13=tmax - 1 if t13 is None else t13, td13=td13, precip=precip)


def person(pid, path, lat=50.0, lon=30.0, age=70, can_help=False, **factors):
    return Person(id=pid, name=pid, age=age, lat=lat, lon=lon, circle_path=path, factors=factors, can_help=can_help)


class HeatLevelTest(unittest.TestCase):
    def test_normal_day(self):
        self.assertEqual(risk.assess([day("2026-07-01", 28)])[0].heat_level, 0)

    def test_hot_and_very_hot(self):
        days = risk.assess([day("2026-07-01", 31), day("2026-07-02", 25), day("2026-07-03", 36), day("2026-07-04", 25)])
        self.assertEqual(days[0].heat_level, 1)
        self.assertEqual(days[2].heat_level, 2)

    def test_tropical_night_raises_level(self):
        self.assertEqual(risk.assess([day("2026-07-01", 36, tmin=22)])[0].heat_level, 3)

    def test_heat_wave_needs_three_days(self):
        days = risk.assess(
            [
                day("2026-07-01", 31),
                day("2026-07-02", 31),
                day("2026-07-03", 25),
                day("2026-07-04", 31),
                day("2026-07-05", 32),
                day("2026-07-06", 33),
            ]
        )
        self.assertEqual([d.in_wave for d in days], [False, False, False, True, True, True])
        self.assertEqual(days[3].heat_level, 2)


class NesterovTest(unittest.TestCase):
    def test_increment(self):
        self.assertEqual(risk.nesterov_increment(30, 10), 600)
        self.assertEqual(risk.nesterov_increment(-2, -5), 0)

    def test_accumulates_and_resets_after_rain(self):
        days = risk.assess(
            [
                day("2026-07-01", 31, t13=30, td13=10),
                day("2026-07-02", 31, t13=30, td13=10),
                day("2026-07-03", 25, precip=5.0),
                day("2026-07-04", 31, t13=30, td13=10),
            ]
        )
        self.assertEqual([d.nesterov for d in days], [600, 1200, 0, 600])
        self.assertEqual(days[1].fire_roman, "III")

    def test_classes(self):
        self.assertEqual(risk.fire_class(300)[1], "I")
        self.assertEqual(risk.fire_class(301)[1], "II")
        self.assertEqual(risk.fire_class(4000)[1], "III")
        self.assertEqual(risk.fire_class(10001)[1], "V")

    def test_scenario_reaches_high_danger(self):
        days = risk.assess(scenario_city("Київ")[0])
        self.assertTrue(any(d.fire_class >= 4 for d in days))
        self.assertTrue(any(d.heat_level == 3 for d in days))


class VulnerabilityTest(unittest.TestCase):
    def test_log_odds_sum(self):
        p = person("a", [], lives_alone=True, not_leaving_home=True)
        self.assertAlmostEqual(p.score, math.log(2.3) + math.log(6.7), places=2)
        self.assertEqual(p.risk, "medium")

    def test_single_household_factor_is_not_vulnerable(self):
        self.assertFalse(person("a", [], no_ac=True).is_vulnerable)

    def test_high_risk(self):
        self.assertEqual(person("a", [], lives_alone=True, not_leaving_home=True, no_ac=True).risk, "high")

    def test_volunteer_rules(self):
        self.assertTrue(person("v", [], age=17, can_help=True).can_volunteer)
        self.assertFalse(person("v", [], age=17, can_help=False).can_volunteer)
        self.assertFalse(person("v", [], age=80, can_help=True).can_volunteer)


class CirclesTest(unittest.TestCase):
    def setUp(self):
        base = ["Київ", "demo", "А", "1"]
        other = ["Київ", "demo", "Б", "1"]
        self.old = person("old", base, lives_alone=True, not_leaving_home=True, no_ac=True)
        self.near = person("near", base, age=20, can_help=True)
        self.same_house = person("house", [*base[:3], "2"], lat=50.0005, age=22, can_help=True)
        self.other = person("other", other, lat=50.003, age=25, can_help=True)
        self.far = person("far", other, lat=50.05, age=25, can_help=True)

    def test_shared_depth(self):
        self.assertEqual(shared_depth(self.old.circle_path, self.near.circle_path), 4)
        self.assertEqual(shared_depth(self.old.circle_path, self.other.circle_path), 2)

    def test_prefers_same_circle_and_respects_distance(self):
        res = circles.form_circles([self.old, self.near, self.same_house, self.other, self.far], heat_level=3)
        self.assertEqual(res[0].buddy_ids, ["near", "house"])

    def test_no_circles_below_level_two(self):
        self.assertEqual(circles.form_circles([self.old, self.near], heat_level=1), [])

    def test_capacity(self):
        olds = [
            person(f"o{i}", self.old.circle_path, lives_alone=True, not_leaving_home=True, no_ac=True) for i in range(5)
        ]
        res = circles.form_circles([*olds, self.near], heat_level=2, capacity=3)
        self.assertEqual(sum("near" in a.buddy_ids for a in res), 3)

    def test_demo_coverage(self):
        people = make_people("Київ", 50.45, 30.52)
        cov = circles.coverage(circles.form_circles(people, 2), people)
        self.assertGreater(cov["vulnerable"], 10)
        self.assertGreaterEqual(cov["covered_pct"], 90)


class CheckinTest(unittest.TestCase):
    def setUp(self):
        a = circles.Assignment("old", ["b1", "b2"], 2, [0.1, 0.2], [4, 3])
        self.checks = checkins.make_schedule([a], heat_level=3)

    def test_schedule(self):
        self.assertEqual([c.slot for c in self.checks], ["09:00", "14:00", "19:00"])

    def test_escalation(self):
        c = self.checks[0]
        checkins.apply_result(c, "no_answer")
        self.assertEqual((c.status, c.current_buddy), ("backup", "b2"))
        checkins.apply_result(c, "no_answer")
        self.assertEqual(c.status, "escalated")
        checkins.apply_result(c, "ok")
        self.assertEqual(c.status, "escalated")

    def test_help(self):
        c = checkins.apply_result(self.checks[1], "help")
        self.assertEqual(c.status, "help")
        self.assertEqual(c.log[-1]["event"], "help")

    def test_unknown_result(self):
        with self.assertRaises(ValueError):
            checkins.apply_result(self.checks[0], "maybe")


class SimulationTest(unittest.TestCase):
    def test_system_detects_faster(self):
        people = make_people("Київ", 50.45, 30.52)
        res = simulate.run(people, circles.form_circles(people, 2), heat_level=2, n=200)
        self.assertGreater(res["with"]["within_12h"], res["without"]["within_12h"])
        self.assertLess(res["alone_with"]["median_h"], res["alone_without"]["median_h"])


class OpenMeteoParseTest(unittest.TestCase):
    def test_parse(self):
        data = {
            "daily": {
                "time": ["2026-07-01", "2026-07-02"],
                "temperature_2m_max": [31.0, 36.0],
                "temperature_2m_min": [18.0, 21.0],
                "apparent_temperature_max": [33.0, 39.0],
                "precipitation_sum": [0.0, None],
            },
            "hourly": {
                "time": ["2026-07-01T13:00", "2026-07-02T13:00"],
                "temperature_2m": [30.0, 35.0],
                "dew_point_2m": [12.0, 14.0],
            },
        }
        days, today = parse_city(data, past_days=1)
        self.assertEqual(today, "2026-07-02")
        self.assertEqual(days[1].t13, 35.0)
        self.assertEqual(days[1].precip, 0.0)
        self.assertTrue(days[1].is_forecast)


if __name__ == "__main__":
    unittest.main()
