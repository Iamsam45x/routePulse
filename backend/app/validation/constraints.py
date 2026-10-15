"""Independent feasibility validator.

OWNED BY: validation workstream (P0 — never cut).

``validate_plan()`` must NOT rely on the optimizer's own feasibility status. It
returns structured violations. Required checks (from ``Wild Bugs.md``):

- every scheduled trip has exactly one valid vehicle assignment
- vehicle types match route requirements
- vehicles are available for their assigned trips
- no overlapping trips or insufficient turnaround
- departure times obey their allowed windows
- every segment's passenger load respects vehicle capacity
- connections satisfy the configured transfer buffer
- required service constraints are respected

Runs on the baseline too; pre-existing baseline violations must be reported.
"""
from __future__ import annotations


def validate_plan(plan, network) -> dict:
    """Validate a plan and return ``{feasible, hard_violation_count, violations}``."""
    raise NotImplementedError("TODO(validation): implement validate_plan()")
