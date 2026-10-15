"""Minimal time-stepped campus simulator (demo-grade baseline).

Simplified relative to the full heapq discrete-event design in ``Wild Bugs.md``.
It advances time in fixed steps, injects synthetic passenger arrivals, calls the
dispatcher each step, moves dispatched buses, and boards passengers on arrival.

The simulator is the authority on outcomes; the optimizer only proposes actions.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.optimizer.state import BusState, OptimizationState, StopQueue
from app.schemas.network import Network


@dataclass
class SimBus:
    bus_id: str
    current_stop: str
    capacity: int
    status: str = "idle"  # "idle" | "dispatched"
    target_stop: str | None = None
    remaining_min: float = 0.0


@dataclass
class SimResult:
    boarded: int = 0
    unserved: int = 0
    total_wait_min: float = 0.0
    actions: list[tuple] = field(default_factory=list)

    @property
    def avg_wait_min(self) -> float:
        return round(self.total_wait_min / self.boarded, 2) if self.boarded else 0.0


class Simulator:
    """Minimal rolling-horizon simulator (demo-grade)."""

    def __init__(self, network: Network, travel_matrix: dict[tuple[str, str], float]):
        self.network = network
        self.travel_matrix = travel_matrix
        self.buses = {
            v.vehicle_id: SimBus(v.vehicle_id, v.initial_stop_id, v.capacity)
            for v in network.vehicles
        }
        self.queues: dict[str, list[float]] = {s.stop_id: [] for s in network.stops}
        self.result = SimResult()

    # ------------------------------------------------------------------ #
    def inject(self, arrivals: dict[str, list[float]]) -> None:
        """Inject passenger arrival times per stop."""
        for stop_id, times in arrivals.items():
            self.queues.setdefault(stop_id, []).extend(times)

    def snapshot(self, time_min: int) -> OptimizationState:
        buses = {
            b.bus_id: BusState(b.bus_id, b.current_stop, b.capacity, status=b.status)
            for b in self.buses.values()
        }
        queues = {
            s: StopQueue(s, waiting=len(self.queues.get(s, [])))
            for s in self.network.stops_by_id
        }
        return OptimizationState(
            time_min=time_min, buses=buses, queues=queues, travel_matrix=self.travel_matrix
        )

    def step(self, time_min: int, step_min: int, dispatch_fn) -> None:
        """Dispatch idle buses, then advance time and board on arrival."""
        state = self.snapshot(time_min)
        plan = dispatch_fn(state, time_min)
        for action in plan.actions:
            bus = self.buses[action.bus_id]
            if bus.status == "idle" and action.target_stop:
                bus.status = "dispatched"
                bus.target_stop = action.target_stop
                bus.remaining_min = self.travel_matrix.get(
                    (bus.current_stop, action.target_stop), float(step_min)
                )
                self.result.actions.append(
                    (time_min, action.bus_id, action.target_stop, action.reason)
                )
        self._advance(time_min + step_min, step_min)

    def run(self, horizon_min: int, step_min: int, dispatch_fn) -> SimResult:
        for t in range(0, horizon_min, step_min):
            self.step(t, step_min, dispatch_fn)
        # passengers still queued at the horizon are unserved
        self.result.unserved = sum(len(q) for q in self.queues.values())
        return self.result

    # ------------------------------------------------------------------ #
    def _advance(self, time_min: int, step_min: int) -> None:
        for bus in self.buses.values():
            if bus.status == "dispatched":
                bus.remaining_min -= step_min
                if bus.remaining_min <= 0:
                    self._arrive(bus, time_min)

    def _arrive(self, bus: SimBus, time_min: int) -> None:
        bus.current_stop = bus.target_stop or bus.current_stop
        bus.target_stop = None
        bus.status = "idle"
        queue = sorted(self.queues.get(bus.current_stop, []))
        boarded = 0
        remaining: list[float] = []
        for arrival in queue:
            if boarded < bus.capacity:
                boarded += 1
                self.result.boarded += 1
                self.result.total_wait_min += max(0.0, time_min - arrival)
            else:
                remaining.append(arrival)
        self.queues[bus.current_stop] = remaining
