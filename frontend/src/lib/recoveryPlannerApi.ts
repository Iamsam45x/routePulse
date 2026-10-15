import { API_BASE_URL, resolveBackendScenarioId } from "../config/api";
import type {
  ConstraintCheck,
  OptimizationMetrics,
  OptimizationStatus,
  RecoveryPlanResult,
  TimetableTrip,
} from "../types/recoveryPlanner";

interface BackendTripAssignment {
  trip_id: string;
  route_id: string;
  vehicle_id: string;
  departure_min: number;
}

interface BackendPlan {
  plan_type: string;
  assignments: BackendTripAssignment[];
  extra_trips: BackendTripAssignment[];
  unassigned_trip_ids: string[];
  solver_status: string;
}

interface BackendViolation {
  code?: string;
  [key: string]: unknown;
}

interface BackendValidation {
  feasible: boolean;
  hard_violation_count: number;
  violations: BackendViolation[];
  unverified_constraints: BackendViolation[];
}

interface BackendMetrics {
  avg_wait_min: number;
  unserved_passengers: number;
  missed_connections: number;
  vehicle_km: number;
}

interface BackendSimulationResult {
  feasible: boolean;
  validation: BackendValidation;
  metrics: BackendMetrics;
}

interface BackendEvaluateResponse {
  scenario_id: string;
  baseline: BackendSimulationResult | null;
  candidate: BackendSimulationResult | null;
  baseline_plan: BackendPlan | null;
  candidate_plan: BackendPlan | null;
  comparison: {
    candidate_validation?: BackendValidation;
    notes?: string[];
  } & Record<string, unknown>;
  notes: string[];
}

const CONSTRAINT_CATEGORIES: {
  id: string;
  label: string;
  codes: string[];
}[] = [
  {
    id: "vehicle-assignment",
    label: "Vehicle assignment",
    codes: [
      "UNASSIGNED_TRIP",
      "DUPLICATE_ASSIGNMENT",
      "UNKNOWN_TRIP",
      "UNKNOWN_ROUTE",
      "UNKNOWN_VEHICLE",
      "ROUTE_MISMATCH",
      "VEHICLE_TYPE_INCOMPATIBLE",
    ],
  },
  {
    id: "vehicle-availability",
    label: "Vehicle availability",
    codes: ["VEHICLE_UNAVAILABLE", "VEHICLE_AVAILABILITY"],
  },
  {
    id: "departure-windows",
    label: "Departure windows",
    codes: ["DEPARTURE_WINDOW", "HEADWAY_TOO_SHORT", "HEADWAY_EXCEEDED"],
  },
  {
    id: "vehicle-turnaround",
    label: "Vehicle turnaround",
    codes: [
      "VEHICLE_OVERLAP",
      "INSUFFICIENT_TURNAROUND",
      "INITIAL_STOP_MISMATCH",
    ],
  },
  {
    id: "segment-capacity",
    label: "Segment capacity",
    codes: ["CAPACITY_EXCEEDED", "CAPACITY_UNVERIFIED"],
  },
  {
    id: "transfer-buffer",
    label: "Transfer buffer",
    codes: ["MISSED_CONNECTION", "TRANSFER_UNVERIFIED"],
  },
];

function formatDeparture(minute: number): string {
  const hours = Math.floor(minute / 60) % 24;
  const minutes = Math.round(minute % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toTimetable(plan: BackendPlan | null): TimetableTrip[] {
  if (!plan) return [];

  return plan.assignments.map((assignment) => ({
    tripId: assignment.trip_id,
    routeId: assignment.route_id,
    vehicleId: assignment.vehicle_id,
    departureTime: formatDeparture(assignment.departure_min),
  }));
}

function buildConstraints(validation: BackendValidation | null): {
  constraints: ConstraintCheck[];
  hardViolationCount: number;
} {
  if (!validation) {
    return {
      constraints: CONSTRAINT_CATEGORIES.map((category) => ({
        id: category.id,
        label: category.label,
        passed: false,
      })),
      hardViolationCount: 0,
    };
  }

  const violations = validation.violations ?? [];
  const unverified = validation.unverified_constraints ?? [];

  const constraints = CONSTRAINT_CATEGORIES.map((category) => {
    const failed = violations.some(
      (violation) =>
        violation.code != null && category.codes.includes(violation.code),
    );
    const unverifiedMatch = unverified.some(
      (item) => item.code != null && category.codes.includes(item.code),
    );

    return {
      id: category.id,
      label: category.label,
      passed: !failed && !unverifiedMatch,
    };
  });

  return { constraints, hardViolationCount: validation.hard_violation_count };
}

function mapMetrics(
  candidate: BackendSimulationResult | null,
  baseline: BackendSimulationResult | null,
): OptimizationMetrics {
  const metrics = candidate?.metrics ?? baseline?.metrics;

  return {
    averageWaitingTimeMin: metrics?.avg_wait_min ?? 0,
    unservedPassengers: metrics?.unserved_passengers ?? 0,
    missedConnections: metrics?.missed_connections ?? 0,
    vehicleDistanceKm: metrics?.vehicle_km ?? 0,
  };
}

function mapStatus(
  validation: BackendValidation | null,
): OptimizationStatus {
  if (!validation) return "unknown";
  return validation.feasible ? "feasible" : "infeasible";
}

export function mapEvaluateResponse(
  response: BackendEvaluateResponse,
): RecoveryPlanResult {
  const validation =
    response.comparison?.candidate_validation ??
    response.candidate?.validation ??
    response.baseline?.validation ??
    null;

  const originalTrips = toTimetable(response.baseline_plan);
  const proposedTrips = toTimetable(response.candidate_plan);
  const { constraints, hardViolationCount } = buildConstraints(validation);

  return {
    status: mapStatus(validation),
    originalTrips,
    proposedTrips,
    totalTrips: Math.max(originalTrips.length, proposedTrips.length),
    constraints,
    hardViolationCount,
    metrics: mapMetrics(response.candidate, response.baseline),
  };
}

export async function runRecoveryPlan(
  frontendScenarioId: string,
  signal?: AbortSignal,
): Promise<RecoveryPlanResult> {
  const scenarioId = resolveBackendScenarioId(frontendScenarioId);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: scenarioId }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new Error(
      `Could not reach the backend at ${API_BASE_URL}. ` +
        "Start it with `uvicorn app.main:app` (see backend/README).",
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Backend returned ${response.status}${
        detail ? `: ${detail.slice(0, 200)}` : ""
      }`,
    );
  }

  const data = (await response.json()) as BackendEvaluateResponse;
  return mapEvaluateResponse(data);
}
