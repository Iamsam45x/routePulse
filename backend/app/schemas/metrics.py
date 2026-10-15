"""Result and audit-record schemas.

These capture the metrics and independent validation report produced after a
simulation run (see `Wild Bugs.md` "Results and audit records").
"""
from __future__ import annotations

from pydantic import BaseModel


class Metrics(BaseModel):
    eta_mae_min: float
    avg_wait_min: float
    unserved_passengers: int
    missed_connections: int
    capacity_violations: int
    vehicle_km: float


class ValidationReport(BaseModel):
    feasible: bool
    hard_violation_count: int
    violations: list[dict] = []


class RunResult(BaseModel):
    run_id: str
    scenario_id: str
    plan_type: str  # "baseline" | "optimized"
    seed: int
    metrics: Metrics
    validation: ValidationReport
