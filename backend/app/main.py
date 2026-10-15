"""FastAPI application entry point.

OWNED BY: integration / API workstream.

Wires the prediction engine behind ``POST /api/v1/prediction`` and mounts the
network/scenarios/optimization/evaluation routers described in
``Wild Bugs.md`` ("API contracts"). A module-level ``app`` FastAPI instance is
exposed so ASGI servers and platforms such as Vercel can discover it
(``uvicorn app.main:app``); ``create_app()`` remains available for the
factory-style ``uvicorn app.main:create_app --factory`` invocation.
"""
from __future__ import annotations


def create_app():
    """Build the FastAPI app (imports FastAPI lazily)."""
    import os  # noqa: PLC0415

    from fastapi import FastAPI  # noqa: PLC0415
    from fastapi.middleware.cors import CORSMiddleware  # noqa: PLC0415

    app = FastAPI(title="RoutePulse API", version="0.1.0")

    # Browser clients (the React frontend on a different origin/port) need CORS.
    # Override with a comma-separated ROUTEPULSE_CORS_ORIGINS to lock it down.
    configured_origins = os.environ.get("ROUTEPULSE_CORS_ORIGINS")
    allow_origins = (
        [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
        if configured_origins
        else ["*"]
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    # Independent constraint validator: POST /api/v1/validate.
    from app.api.validation import router as validation_router  # noqa: PLC0415
    from app.api.network import router as network_router  # noqa: PLC0415
    from app.api.scenarios import router as scenarios_router  # noqa: PLC0415
    from app.api.optimization import router as optimization_router  # noqa: PLC0415
    from app.api.evaluation import router as evaluation_router  # noqa: PLC0415
    from app.api.runs import router as runs_router  # noqa: PLC0415

    app.include_router(network_router)
    app.include_router(scenarios_router)
    app.include_router(optimization_router)
    app.include_router(evaluation_router)
    app.include_router(runs_router)
    app.include_router(validation_router)

    return app


# Top-level ASGI instance so platforms (Vercel) and `uvicorn app.main:app` find
# it. `uvicorn app.main:create_app --factory` continues to work as well.
app = create_app()
