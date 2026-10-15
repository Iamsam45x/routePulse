
export type ScenarioType =
  | "normal"
  | "demand-spike"
  | "vehicle-unavailable";

export interface Scenario {
  id: string;
  name: string;
  category: "Normal" | "Stress Test" | "Disruption";
  description: string;
  type: ScenarioType;
}
