
import type { Scenario } from "../types/scenarios";

export const scenarios: Scenario[] = [
  {
    id: "normal_operations",
    name: "Normal Operations",
    category: "Normal",
    description:
      "Baseline transportation demand and vehicle availability.",
    type: "normal",
  },
  {
    id: "demand_spike",
    name: "Demand Spike",
    category: "Stress Test",
    description:
      "Passenger demand increases during peak periods.",
    type: "demand-spike",
  },
  {
    id: "vehicle_unavailable",
    name: "Vehicle Unavailable",
    category: "Disruption",
    description:
      "One vehicle becomes unavailable during the operating window.",
    type: "vehicle-unavailable",
  },
];
