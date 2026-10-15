import { useEffect, useRef, useState } from "react";

import { runRecoveryPlan } from "../lib/recoveryPlannerApi";
import type { RecoveryPlanResult, RunStage } from "../types/recoveryPlanner";

export const optimizationStages = [
  {
    id: "loading-scenario",
    title: "Load scenario",
    description: "Preparing network and initial conditions.",
  },
  {
    id: "optimizing",
    title: "Optimize schedule",
    description: "Generating a candidate transportation plan.",
  },
  {
    id: "validating",
    title: "Validate constraints",
    description: "Checking operational constraints.",
  },
  {
    id: "evaluating",
    title: "Evaluate plan",
    description: "Simulating baseline and candidate plans.",
  },
] as const;

const STAGE_DELAY_MS = 350;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      window.clearTimeout(timer);
      resolve();
    }

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function useOptimization() {
  const [stage, setStage] = useState<RunStage>("idle");
  const [result, setResult] = useState<RecoveryPlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const isRunning = optimizationStages.some((item) => item.id === stage);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function run(scenarioId: string) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setResult(null);
    setError(null);
    setStage("loading-scenario");

    const request = runRecoveryPlan(scenarioId, controller.signal).then(
      (value) => ({ ok: true as const, value }),
      (requestError: unknown) => ({ ok: false as const, error: requestError }),
    );

    await sleep(STAGE_DELAY_MS, controller.signal);
    if (controller.signal.aborted) return;
    setStage("optimizing");

    await sleep(STAGE_DELAY_MS, controller.signal);
    if (controller.signal.aborted) return;
    setStage("validating");

    await sleep(STAGE_DELAY_MS, controller.signal);
    if (controller.signal.aborted) return;
    setStage("evaluating");

    const outcome = await request;
    if (controller.signal.aborted) return;

    if (!outcome.ok) {
      setError(
        outcome.error instanceof Error
          ? outcome.error.message
          : "Optimization failed.",
      );
      setStage("error");
      return;
    }

    setResult(outcome.value);
    setStage("completed");
  }

  function reset() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setResult(null);
    setError(null);
    setStage("idle");
  }

  return { stage, result, error, isRunning, run, reset };
}
