"""Run the RoutePulse prediction engine on the dummy inputs and print results.

Usage (from the repo root):

    python backend/demo_prediction.py
"""
from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))  # backend/
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
sys.path.insert(0, HERE)

from app.prediction.demand import DemandForecaster  # noqa: E402
from app.prediction.eta import ETAEstimator  # noqa: E402
from app.prediction.explainer import GroqExplainer  # noqa: E402
from app.prediction.predictor import PredictionEngine  # noqa: E402
from app.schemas.network import Network  # noqa: E402
from app.schemas.scenario import (  # noqa: E402
    DemandRecord,
    GPSObservation,
    Scenario,
    TripObservation,
)


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    # Windows console defaults to cp1252; ensure UTF-8 so explanations print cleanly.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    network = Network.model_validate(load_json(os.path.join(DATA, "network", "campus.json")))
    demand_records = [
        DemandRecord.model_validate(r)
        for r in load_json(os.path.join(DATA, "demand_history.json"))
    ]
    trip_records = [
        TripObservation.model_validate(r)
        for r in load_json(os.path.join(DATA, "trip_history.json"))
    ]
    gps = [
        GPSObservation.model_validate(g)
        for g in load_json(os.path.join(DATA, "gps", "gps_traces.json"))
    ]
    scenario = Scenario.model_validate(
        load_json(os.path.join(DATA, "scenarios", "traffic_delay.json"))
    )

    demand = DemandForecaster()
    demand.fit(demand_records)

    eta = ETAEstimator(alpha=0.4)
    for t in trip_records:
        eta.observe(t)

    engine = PredictionEngine(network, demand, eta)

    # 08:00 (480 min) morning-peak forecast, 15-minute horizon, under traffic delay.
    output = engine.predict(
        timestamp_min=480,
        gps_observations=gps,
        horizon_minutes=15,
        scenario=scenario,
    )
    print(json.dumps(output.to_dict(), indent=2))

    # Optional LLM explanation (skipped if no key is configured).
    explainer = GroqExplainer()
    if explainer.available and output.stop_forecasts:
        worst = max(output.stop_forecasts, key=lambda s: s.capacity_shortfall)
        print("\n--- LLM explanation (worst stop) ---")
        print(explainer.explain_stop(worst))
    else:
        print("\n(no GROQ_API_KEY configured; skipping LLM explanation)")


if __name__ == "__main__":
    main()
