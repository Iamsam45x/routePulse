"""Test configuration and shared fixtures for the prediction engine."""
from __future__ import annotations

import os
import sys

# Make the `app` package importable when running pytest from the backend dir.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402

from app.schemas.network import Route  # noqa: E402


@pytest.fixture
def sample_route() -> Route:
    return Route(
        route_id="R_TEST",
        stop_ids=["S0", "S1", "S2"],
        segment_travel_min=[5.0, 4.0],
        segment_distance_km=[1.0, 1.0],
    )
