"""Result and audit-record schemas.

These capture the metrics and independent validation report produced after a
simulation run (see `Wild Bugs.md` "Results and audit records").
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class Metrics(BaseModel):
    eta_mae_min: float
    avg_wait_min: float
    unserved_passengers: int
    missed_connections: int
    capacity_violations: int
    vehicle_km: float


class ValidationReport(BaseModel):
    """Independent validation result.

    ``feasible`` is true only when there are no hard violations *and* no
    required hard constraint was left unverified. Hard constraints that could
    not be checked (e.g. capacity without a passenger allocation) are listed in
    ``unverified_constraints`` so a schedule is never reported as fully feasible
    on the strength of a check that never ran.
    """

    feasible: bool
    hard_violation_count: int
    violations: list[dict] = Field(default_factory=list)
    unverified_constraints: list[dict] = Field(default_factory=list)


class RunResult(BaseModel):
    run_id: str
    scenario_id: str
    plan_type: str  # "baseline" | "optimized"
    seed: int
    metrics: Metrics
    validation: ValidationReport
