"""Check-in schedule and escalation for Care Circles."""

from dataclasses import dataclass, field

from .circles import Assignment

SLOTS = {
    2: ["10:00", "18:00"],
    3: ["09:00", "14:00", "19:00"],
}
RESULTS = ("ok", "help", "no_answer")
CLOSED = ("ok", "help", "escalated")


@dataclass
class Check:
    id: str
    person_id: str
    slot: str
    buddy_ids: list[str]
    status: str = "pending"  # pending | ok | help | backup | escalated
    active_buddy: int = 0
    log: list[dict] = field(default_factory=list)

    @property
    def current_buddy(self) -> str | None:
        return self.buddy_ids[self.active_buddy] if self.active_buddy < len(self.buddy_ids) else None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "person_id": self.person_id,
            "slot": self.slot,
            "buddy_ids": self.buddy_ids,
            "current_buddy": self.current_buddy,
            "status": self.status,
            "log": self.log,
        }


def make_schedule(assignments: list[Assignment], heat_level: int) -> list[Check]:
    slots = SLOTS.get(min(heat_level, 3), [])
    return [
        Check(id=f"{a.person_id}@{slot}", person_id=a.person_id, slot=slot, buddy_ids=list(a.buddy_ids))
        for a in assignments
        if a.buddy_ids
        for slot in slots
    ]


def apply_result(check: Check, result: str) -> Check:
    """Advance a check; a no-answer passes it to the backup volunteer, then escalates."""
    if result not in RESULTS:
        raise ValueError(f"unknown result: {result}")
    if check.status in CLOSED:
        return check

    check.log.append({"who": check.current_buddy, "event": result})
    if result != "no_answer":
        check.status = result
        return check

    check.active_buddy += 1
    if check.current_buddy is not None:
        check.status = "backup"
        check.log.append({"who": check.current_buddy, "event": "backup"})
    else:
        check.status = "escalated"
        check.log.append({"who": None, "event": "escalated"})
    return check
