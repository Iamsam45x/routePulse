"""Vehicle assignment and dispatch (greedy baseline optimizer).

The game plan specifies OR-Tools CP-SAT as the final solver; this greedy
dispatcher is the deterministic, dependency-free baseline it recommends
building first. It:

1. starts from the original timetable,
2. drops trips whose assigned vehicle is unavailable in the scenario,
3. reassigns those trips to spare compatible vehicles (respecting the
   availability window, turnaround, and non-overlapping trips),
4. optionally adds extra dispatches for stops the prediction engine flags as
   HIGH crowding risk,
5. returns a Plan for the validator / simulator / API to consume.
"""
from __future__ import annotations

from typing import Optional

from app.prediction.predictor import PredictionOutput
from app.schemas.network import Network, Route, Trip, Vehicle
from app.schemas.plan import Plan, TripAssignment
from app.schemas.scenario import Scenario


def route_duration_min(route: Route) -> float:
    return sum(route.segment_travel_min)


def _fits_availability(v: Vehicle, dep: float, end: float) -> bool:
    return dep >= v.available_from_min and end <= v.available_until_min


def _overlaps(busy: dict[str, list[tuple[float, float]]], vid: str, start: float, end: float) -> bool:
    return any(start < e and s < end for s, e in busy.get(vid, []))


def _can_assign(vid: str, dep: float, end: float, vehicles: dict[str, Vehicle],
                busy: dict[str, list[tuple[float, float]]]) -> bool:
    v = vehicles[vid]
    return _fits_availability(v, dep, end) and not _overlaps(busy, vid, dep, end)


def _mark_busy(busy: dict[str, list[tuple[float, float]]], vid: str,
               start: float, end: float, turnaround: int) -> None:
    busy.setdefault(vid, []).append((start, end + turnaround))


def _find_spare(trip: Trip, route: Route, duration: float,
                vehicles: dict[str, Vehicle], busy: dict[str, list[tuple[float, float]]],
                unavailable: set[str]) -> tuple[Optional[str], float]:
    """Find a spare compatible vehicle for a trip, trying small departure shifts."""
    for shift in (0, 5, -5, 10, -10, 15, -15):
        dep = float(trip.planned_departure_min + shift)
        if not (trip.departure_window_start_min <= dep <= trip.departure_window_end_min):
            continue
        end = dep + duration
        for vid, v in vehicles.items():
            if vid in unavailable or v.vehicle_type not in route.allowed_vehicle_types:
                continue
            if _can_assign(vid, dep, end, vehicles, busy):
                return vid, dep
    return None, 0.0


def _route_serving_stop(routes: dict[str, Route], stop_id: str) -> Optional[Route]:
    for r in routes.values():
        if stop_id in r.stop_ids:
            return r
    return None


def _extra_dispatches(network: Network, scenario: Scenario,
                      prediction: Optional[PredictionOutput],
                      busy: dict[str, list[tuple[float, float]]]) -> list[TripAssignment]:
    """Add dispatches for stops the prediction engine flags as HIGH crowding risk."""
    if prediction is None:
        return []
    unavailable = set(scenario.unavailable_vehicle_ids)
    vehicles = network.vehicles_by_id
    routes = network.routes_by_id
    extra: list[TripAssignment] = []
    high = sorted(
        (f for f in prediction.stop_forecasts if f.crowding_risk == "HIGH"),
        key=lambda f: -f.capacity_shortfall,
    )
    for f in high:
        route = _route_serving_stop(routes, f.stop_id)
        if route is None:
            continue
        dep = float(f.time_bucket_min)
        duration = route_duration_min(route)
        for vid, v in vehicles.items():
            if vid in unavailable or v.vehicle_type not in route.allowed_vehicle_types:
                continue
            if _can_assign(vid, dep, dep + duration, vehicles, busy):
                extra.append(TripAssignment(
                    trip_id=f"X_{f.stop_id}",
                    route_id=route.route_id,
                    vehicle_id=vid,
                    departure_min=int(dep),
                ))
                _mark_busy(busy, vid, dep, dep + duration, v.turnaround_min)
                break
    return extra


def optimize(network: Network, scenario: Scenario,
             prediction: Optional[PredictionOutput] = None,
             time_limit_seconds: Optional[int] = None) -> Plan:
    """Greedy vehicle-assignment optimizer (baseline).

    ``prediction`` enables extra dispatches for predicted-crowded stops.
    ``time_limit_seconds`` is accepted for API parity (the greedy solver is
    effectively instant and does not use it).
    """
    unavailable = set(scenario.unavailable_vehicle_ids)
    vehicles = network.vehicles_by_id
    routes = network.routes_by_id
    delays = scenario.vehicle_delays_min

    busy: dict[str, list[tuple[float, float]]] = {}
    assignments: list[TripAssignment] = []
    unassigned: list[str] = []

    trips = sorted(network.trips, key=lambda t: t.planned_departure_min)
    for trip in trips:
        route = routes[trip.route_id]
        duration = route_duration_min(route)
        dep = float(trip.planned_departure_min + delays.get(trip.vehicle_id, 0))
        end = dep + duration

        vid = trip.vehicle_id
        if vid in unavailable or not _can_assign(vid, dep, end, vehicles, busy):
            vid = None

        if vid is None:
            vid, dep = _find_spare(trip, route, duration, vehicles, busy, unavailable)
            if vid is None:
                unassigned.append(trip.trip_id)
                continue
            end = dep + duration

        _mark_busy(busy, vid, dep, end, vehicles[vid].turnaround_min)
        assignments.append(TripAssignment(
            trip_id=trip.trip_id, route_id=trip.route_id,
            vehicle_id=vid, departure_min=int(dep),
        ))

    extra = _extra_dispatches(network, scenario, prediction, busy)

    status = "OK" if not unassigned else "PARTIAL"
    return Plan(
        plan_type="optimized",
        assignments=assignments,
        extra_trips=extra,
        unassigned_trip_ids=unassigned,
        solver_status=status,
    )
