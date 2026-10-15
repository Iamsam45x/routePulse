"""Optimizer: vehicle assignment and dispatch.

Implemented: greedy dispatcher (``solve.optimize``) + timetable fallback
(``fallback.fallback_plan``). OR-Tools CP-SAT is the planned upgrade.
"""
from app.optimizer.fallback import fallback_plan
from app.optimizer.solve import optimize

__all__ = ["optimize", "fallback_plan"]
