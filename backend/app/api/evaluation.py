"""POST /api/v1/evaluate — compare baseline and candidate plans.

OWNED BY: API + evaluation workstreams.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api import deps
from app.evaluation.comparison import compare_runs
from app.optimizer.fallback import fallback_plan
from app.optimizer.solve import optimize
from app.schemas.plan import Plan
from app.schemas.scenario import PassengerDemand
from app.simulation.engine import simulate
from app.simulation.models import SimulationResult
from app.simulation.store import save_run
from app.validation.constraints import validate_plan

router = APIRouter(prefix="/api/v1", tags=["evaluation"])


class EvaluateRequest(BaseModel):
    """Request body for ``POST /api/v1/evaluate``.

    Plans may be supplied inline; when omitted the baseline defaults to the
    original timetable and the candidate defaults to the optimizer's output.
    """

    scenario_id: str
    seed: int = 42
    evaluation_horizon_min: int | None = None
    baseline_plan: Plan | None = None
    candidate_plan: Plan | None = None
    demand: list[PassengerDemand] | None = None


class EvaluateResponse(BaseModel):
    """Baseline-vs-candidate comparison."""

    scenario_id: str
    baseline: SimulationResult | None = None
    candidate: SimulationResult | None = None
    baseline_plan: Plan | None = None
    candidate_plan: Plan | None = None
    comparison: dict
    notes: list[str] = Field(default_factory=list)


@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate_endpoint(request: EvaluateRequest) -> EvaluateResponse:
    """Simulate both plans against identical inputs and report the difference."""
    try:
        network = deps.load_network()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    try:
        scenario = deps.load_scenario(request.scenario_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=404, detail=f"unknown scenario_id: {request.scenario_id}"
        ) from exc

    demand = request.demand if request.demand is not None else deps.load_demand()
    notes: list[str] = []

    baseline_plan = request.baseline_plan or fallback_plan(network, scenario)
    baseline_result = simulate(
        network,
        baseline_plan,
        scenario,
        demand=demand,
        seed=request.seed,
        horizon_min=request.evaluation_horizon_min,
    )
    save_run(baseline_result.model_dump())

    candidate_plan = request.candidate_plan or optimize(network, scenario)
    candidate_validation = validate_plan(
        network, candidate_plan, scenario, demand=demand
    )

    candidate_result: SimulationResult | None = None
    if candidate_validation["feasible"]:
        candidate_result = simulate(
            network,
            candidate_plan,
            scenario,
            demand=demand,
            seed=request.seed,
            horizon_min=request.evaluation_horizon_min,
        )
        save_run(candidate_result.model_dump())
    else:
        notes.append(
            "candidate was not simulated: "
            f"{candidate_validation['hard_violation_count']} hard violations"
        )

    comparison = compare_runs(baseline_result, candidate_result)
    comparison.setdefault("notes", [])
    comparison["notes"].extend(notes)
    comparison["candidate_validation"] = candidate_validation

    return EvaluateResponse(
        scenario_id=request.scenario_id,
        baseline=baseline_result,
        candidate=candidate_result,
        baseline_plan=baseline_plan,
        candidate_plan=candidate_plan,
        comparison=comparison,
        notes=notes,
    )
