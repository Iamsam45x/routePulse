export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const BACKEND_SCENARIO_IDS: Record<string, string> = {
  normal_operations: "normal",
  demand_spike: "demand_surge",
  vehicle_unavailable: "vehicle_failure",
};

export function resolveBackendScenarioId(frontendScenarioId: string): string {
  return BACKEND_SCENARIO_IDS[frontendScenarioId] ?? frontendScenarioId;
}
