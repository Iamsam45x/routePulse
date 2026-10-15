# Assumptions

Explicit assumptions behind the current implementation. Change these here if
they become wrong, and update the affected code.

- **Simulated data.** All `data/` files are synthetic (seed 42). They are
  placeholders for real campus data and carry no claim about Berry College.
- **Time unit.** Simulation time is integer minutes from midnight. Demand and
  ETA forecasts use 5-minute buckets.
- **Service window.** Vehicles are modelled from 06:00 (360) to 18:00 (1080).
- **Demand baseline.** `D_hat = mean(historical)` per (stop, day type, bucket).
  EWMA recent-blend is optional (default `alpha=0.0`).
- **ETA smoothing.** `alpha = 0.4` for segment EWMA; tuned later on validation
  data, never the held-out test set.
- **ETA dwell.** A fixed 0.5-minute dwell per intermediate stop (a placeholder
  for a real boarding-time model).
- **Confidence intervals.** Empirical 10th/90th percentile residuals. No
  arbitrary fixed windows are reported for the schedule fallback.
- **Capacity.** The baseline "serving capacity" per stop is derived from the
  timetable (trips × vehicle capacity). The optimizer will supersede this.
- **LLM usage.** Groq (GPT OSS 20B) is only for explanations; it is optional,
  lazy, cached, and never computes the numbers.
