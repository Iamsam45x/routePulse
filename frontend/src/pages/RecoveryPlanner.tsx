
import { useState } from "react";
import {
  Check,
  Clock3,
  Play,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  BusFront,
} from "lucide-react";

import { scenarios } from "../config/scenarios";
import { operationsMockData } from "../mocks/operations";

export default function RecoveryPlanner() {
  const [selectedScenarioId, setSelectedScenarioId] =
    useState("normal_operations");

  const [runMessage, setRunMessage] = useState("");

  const selectedScenario = scenarios.find(
    (scenario) => scenario.id === selectedScenarioId,
  );

  const availableVehicles = operationsMockData.vehicles.filter(
    (vehicle) =>
      vehicle.status === "available" ||
      vehicle.status === "in-service",
  ).length;

  const scenarioDetails = [
    {
      label: "Demand Condition",
      value:
        selectedScenario?.type === "demand-spike"
          ? "Increased demand"
          : selectedScenario?.type === "vehicle-unavailable"
            ? "Baseline demand"
            : "Baseline demand",
      icon: TrendingUp,
    },
    {
      label: "Available Vehicles",
      value: String(availableVehicles),
      icon: BusFront,
    },
    {
      label: "Affected Period",
      value: "08:00–10:00",
      icon: Clock3,
    },
    {
      label: "Evaluation Horizon",
      value: "120 minutes",
      icon: RotateCcw,
    },
  ];

  function handleRunOptimization() {
    setRunMessage(
      "The optimization API is not connected yet. The selected scenario is ready for backend integration.",
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          Recovery Planner
        </h1>

        <p className="mt-2 text-sm text-secondary">
          Test operational scenarios and generate a feasible
          transportation plan.
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Select Scenario
          </h2>

          <p className="mt-1 text-sm text-secondary">
            Choose an operational condition to evaluate.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((scenario) => {
            const isSelected =
              scenario.id === selectedScenarioId;

            return (
              <button
                key={scenario.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedScenarioId(scenario.id);
                  setRunMessage("");
                }}
                className={`min-w-0 rounded-xl border p-4 text-left transition sm:p-5 ${
                  isSelected
                    ? "border-primary bg-blue-50/50 ring-1 ring-primary"
                    : "border-border bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-secondary">
                    {scenario.category}
                  </span>

                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-border text-transparent"
                    }`}
                  >
                    <Check size={14} />
                  </span>
                </div>

                <h3 className="mt-4 font-semibold text-foreground">
                  {scenario.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-secondary">
                  {scenario.description}
                </p>

                <p
                  className={`mt-4 text-sm font-medium ${
                    isSelected
                      ? "text-primary"
                      : "text-secondary"
                  }`}
                >
                  {isSelected ? "Selected scenario" : "Select scenario"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {selectedScenario && (
        <section className="rounded-xl border border-border bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-secondary">
                Selected Scenario
              </p>

              <h2 className="mt-1 text-xl font-semibold text-foreground">
                {selectedScenario.name}
              </h2>

              <p className="mt-2 text-sm text-secondary">
                {selectedScenario.description}
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-secondary">
              <ShieldCheck size={15} />
              Predefined scenario
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {scenarioDetails.map((detail) => {
              const Icon = detail.icon;

              return (
                <div
                  key={detail.label}
                  className="min-w-0 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-2 text-secondary">
                    <Icon size={16} />
                    <span className="text-xs">
                      {detail.label}
                    </span>
                  </div>

                  <p className="mt-3 break-words text-lg font-semibold text-foreground">
                    {detail.value}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs leading-5 text-secondary">
            Prototype configuration: scenario timing and demand
            conditions must be aligned with the backend configuration.
            Vehicle availability is calculated from current mock data.
          </p>
        </section>
      )}

      <section className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Run Optimization
          </h2>

          <p className="mt-1 text-sm text-secondary">
            Generate a constraint-aware transportation plan for the
            selected scenario.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunOptimization}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
        >
          <Play size={16} />
          Run Optimization
        </button>

        {runMessage && (
          <p
            role="status"
            className="mt-4 rounded-lg border border-border bg-slate-50 p-3 text-sm leading-6 text-secondary"
          >
            {runMessage}
          </p>
        )}

        <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-border px-5 py-8 text-center">
          <div className="rounded-full bg-slate-100 p-3 text-secondary">
            <ShieldCheck size={23} />
          </div>

          <h3 className="mt-4 font-semibold text-foreground">
            No optimization run yet
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-secondary">
            Choose a scenario and run the optimizer to see the proposed
            transportation plan and its feasibility results.
          </p>
        </div>
      </section>
    </div>
  );
}
