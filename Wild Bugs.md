# PS 02 Ideation and Architecture

## MVP
- Must work end-to-end
- Must be measurable. Not all features shld be taken by the LLM some shld be calculated by code.
- Must be demonstrable.
- And if we want to put this out into production then we shld be able to submit by the next day.

## End goal
1. Load the same predefined campus network and passenger demand every time.
2. Run the original timetable under normal and disrupted conditions.
3. Produce an alternative schedule using a constraint-aware optimizer.
4. Independently verify the alternative against every hard constraint.
5. Simulate both plans using identical initial conditions and scenario inputs.
6. Display the measured differences without inventing or hardcoding performance improvements.

## System Architecture

## Tech Stack
|Layer|Technology|Purpose|
|---|---|---|
|Frontend|React, TypeScript, Vite|Operator dashboard|
|Styling|Tailwind CSS|Fast, consistent UI|
|Map|Leaflet + OpenStreetMap tiles|Campus stops and routes|
|Charts|Recharts|Baseline versus optimized results|
|API|FastAPI + Pydantic|Typed requests and responses|
|Optimization|Google OR-Tools CP-SAT|Feasible assignments and schedule adjustments|
|Simulation|Python `heapq`|Discrete-event engine|
|Data|pandas + NumPy|Scenario generation and analysis|
|Persistence|JSON files initially, SQLite if needed|Network and experiment storage|
|Testing|pytest|Constraint and regression tests|
- Use a single Python backend

Keep one canonical schema shared by the optimizer, simulator, API, and frontend. Use IDs rather than embedding entire objects inside other records.
# Data Models

Implement the models with Pydantic and store the initial fixture in `data/scenarios/campus_normal.json`.

**Stops:**
```
{
  "stop_id": "S01",
  "name": "Main Gate",
  "lat": 17.5449,
  "lon": 78.5718
}
```

**Routes:**
```
{
  "route_id": "R01",
  "stop_ids": ["S01", "S02", "S03"],
  "segment_travel_min": [5, 7],
  "segment_distance_km": [1.2, 1.8],
  "allowed_vehicle_types": ["shuttle"],
  "min_headway_min": 5,
  "max_headway_min": 20
}
```

**Vehicles:**
```
{
  "vehicle_id": "V01",
  "capacity": 30,
  "vehicle_type": "shuttle",
  "available_from_min": 0,
  "available_until_min": 720,
  "initial_stop_id": "S01",
  "turnaround_min": 4,
  "cost_per_km": 18.0
}
```

**Scheduled trips:**
```
{
  "trip_id": "T001",
  "route_id": "R01",
  "vehicle_id": "V01",
  "planned_departure_min": 30,
  "departure_window_start_min": 25,
  "departure_window_end_min": 40
}
```

**Passenger demand:**
```
{
  "demand_id": "D001",
  "origin_stop_id": "S01",
  "destination_stop_id": "S03",
  "arrival_time_min": 27,
  "passenger_count": 8,
  "max_wait_min": 25,
  "transfer_allowed": true
}
```
`
**GPS observations:**

```
{
  "vehicle_id": "V01",
  "timestamp_min": 32,
  "lat": 17.5454,
  "lon": 78.5722,
  "route_id": "R01",
  "segment_index": 0
}
```

**Disruptions and scenarios**
```
{
  "scenario_id": "event_spike_01",
  "seed": 42,
  "evaluation_horizon_min": 180,
  "demand_multipliers": {
    "S02": 2.0,
    "S03": 1.5
  },
  "travel_time_multipliers": {
    "R01": 1.3
  },
  "unavailable_vehicle_ids": ["V04"],
  "vehicle_delays_min": {
    "V02": 12
  }
}
```

**Results and audit records**
```
{
  "run_id": "run_0001",
  "scenario_id": "event_spike_01",
  "plan_type": "optimized",
  "seed": 42,
  "metrics": {
    "eta_mae_min": 3.2,
    "avg_wait_min": 8.4,
    "unserved_passengers": 5,
    "missed_connections": 1,
    "capacity_violations": 0,
    "vehicle_km": 46.8
  },
  "validation": {
    "feasible": true,
    "hard_violation_count": 0,
    "violations": []
  }
}
```


# Algorithms
4 Independent modules

### 1.ETA estimation

For a vehicle moving along a known route, estimate arrival at the next stop using observed segment travel times and the remaining distance.

For segment \(i\), define the observed travel time:

$$
t_i^{obs}=t_i^{arrival}-t_i^{departure}
$$

Use an exponentially weighted moving average to smooth noisy observations:

$$
\hat t_i^{(k)} =\alpha t_i^{obs}+(1-\alpha)\hat t_i^{(k-1)}
$$

Start with \(\alpha=0.4\), then tune it on validation data rather than the held-out test set.

For the next stop:

$$
 ETA = t_{now}+\hat t_{remaining} 
$$

For a stop farther along the route, sum the predicted travel times across remaining segments and include any expected dwell time.

Arrival windows: derive a lower and upper estimate from observed residuals on validation data. For example, use empirical 10th and 90th percentile residuals. Do not present an arbitrary fixed window as a calibrated confidence interval.

If GPS data is sparse, fall back to scheduled segment times adjusted by the scenario's delay factor. Record which estimation method was used.

**Evaluate:** MAE in minutes, plus the proportion of actual arrivals falling inside the reported windows.

### 2. Demand forecasting

1. **Deterministic, explainable baseline**
$$
		\\hat D_{s,h} =\operatorname{mean}(D_{s,h}^{historical}) 
$$
Here \(s\) is the stop and \(h\) is the departure time bucket.

If you have enough synthetic history, add weekday, event status, and time-of-day features to a small regression model. But the baseline must remain available for comparison.

Demand forecasting feeds the optimizer with expected passenger loads. It does not directly change vehicle assignments.

### 3. Constrained optimization

The decision variables should remain manageable:

- \(x_{tv}\): whether vehicle \(v\) is assigned to trip \(t\).
    
- \(d_t\): the chosen departure time of trip \(t\).
    
- \(y_{pt}\): how many passengers from demand group \(p\) are assigned to trip \(t\), if you implement explicit passenger assignment.

For each trip \(t\):

$$
\\sum_v x_{tv}=1 
$$

Each trip gets exactly one compatible, available vehicle.

Capacity:

$$
\\sum_{p \in B_t} y_{pt}\leq C_v 
$$

Here \(B_t\) is the set of passengers assigned to trip \(t\), and \(C_v\) is its capacity. For a simple first version, use estimated passenger loads per route segment rather than modeling every possible passenger itinerary.

Departure windows:
$$
 a_t\leq d_t\leq b_t 
$$

Vehicle non-overlap and turnaround:

$$
 start_{t_2}\geq end_{t_1}+turnaround_v 
$$

for consecutive trips \(t_1,t_2\) assigned to the same vehicle.

Your objective should combine waiting, unserved demand, missed connections, operating cost, and schedule deviation. However, for the initial implementation, use a small objective and hard constraints you can test thoroughly.

A critical modeling distinction: a passenger count at a stop is not the same as a vehicle's total onboard load. If passengers board and alight along a route, capacity must be checked on every segment. Otherwise, a plan may appear feasible while exceeding capacity midway through a trip.

### 4. Independent feasibility validator

Implement `validate_plan()` without relying on the optimizer's internal feasibility status.

It should return structured violations, such as:

```
{
  "feasible": false,
  "hard_violation_count": 1,
  "violations": [
    {
      "code": "CAPACITY_EXCEEDED",
      "vehicle_id": "V01",
      "trip_id": "T001",
      "segment_index": 1,
      "actual_load": 34,
      "capacity": 30
    }
  ]
}
```

Required checks:

- Every scheduled trip has exactly one valid vehicle assignment.
- Vehicle types match route requirements.
- Vehicles are available for their assigned trips.
- No overlapping trips or insufficient turnaround.
- Departure times obey their allowed windows.
- Every segment's passenger load respects vehicle capacity.
- Connections satisfy the configured transfer buffer.
- Required service constraints are respected.

The validator should run on the baseline too. A pre-existing baseline violation must be reported, not silently hidden.

# Discrete-event simulation design

This is the engine that makes your evaluation credible without requiring live hardware or a full traffic simulator.

Use Python's `heapq` as a priority queue of events. Each event contains a simulation timestamp, a tie-breaking counter, an event type, and its payload.

### Event types

|Event|What happens|
|---|---|
|`PASSENGER_ARRIVAL`|Add a passenger group to a stop's waiting queue|
|`VEHICLE_DEPARTURE`|Board eligible passengers and start a trip segment|
|`VEHICLE_ARRIVAL`|Move a vehicle to its next stop and update its state|
|`PASSENGER_ALIGHT`|Remove passengers whose destination has been reached|
|`CONNECTION_CHECK`|Record whether a passenger can make a planned transfer|

You may implement boarding and alighting together at vehicle arrival rather than creating separate event types. The key is to maintain a consistent event order.

**Core simulation loop:**
```while event_queue:
    event = heapq.heappop(event_queue)

    if event.time_min > evaluation_horizon_min:
        break

    state.advance_to(event.time_min)
    process_event(event, state, event_queue)

return calculate_metrics(state)
```

Use a monotonic counter to break ties between events with the same timestamp. Define event ordering explicitly so a bus arriving at a stop at the same minute as a passenger arrival does not create nondeterministic boarding outcomes.

### State to maintain

- Current vehicle location, status, route, trip, and onboard passengers.
- Passenger queues by stop and destination.
- Actual arrival and departure times.
- Passenger arrival, boarding, alighting, and abandonment times.
- Completed, missed, and unserved journeys.
- Predicted ETA and actual arrival pairs for evaluation.

### Boarding policy

Use a deterministic, documented policy:

1. Remove passengers who have abandoned waiting according to their maximum-wait constraint.
2. Alight passengers whose destination is the current stop.
3. Board eligible passengers while capacity remains.
4. Keep excess passengers in the queue for subsequent services.
5. Count passengers who remain unserved at the end of the evaluation horizon.

If a group exceeds remaining capacity, split the group. Never board the full group simply because it is represented by one demand record.

For transfers, track each passenger's intended connection and the transfer buffer. A missed connection occurs when the incoming trip arrives too late for the next feasible departure. Avoid counting the same missed connection multiple times for the same transfer.

### How to compare the plans fairly

For each scenario:

- Clone the exact same initial state.
- Use the same passenger arrivals and disruption timeline.
- Run the original timetable.
- Run the optimized timetable.
- Calculate metrics using the same definitions.
- Save both outputs with the same scenario ID and seed.

If the optimizer changes the plan but the simulator does not change the passenger or vehicle outcomes accordingly, the improvement is not real. The simulator must execute the schedule that was actually proposed.

## 6. API contracts

Keep the API small. These endpoints are sufficient for the MVP.

Base path: `/api/v1`

GET `/network`

Returns routes, stops, vehicles, and scheduled trips.

Response: `NetworkResponse` containing `stops[]`, `routes[]`, `vehicles[]`, and `trips[]`.

GET `/scenarios`

Lists the predefined normal and disruption scenarios.

Response: scenario IDs, names, seeds, and disruption parameters.

POST `/scenarios/{scenario_id}/run`

Runs the baseline and optionally the optimized plan.

Request:

```
{
  "include_optimized": true,
  "seed": 42,
  "evaluation_horizon_min": 180
}
```

Response: `run_id`, `scenario_id`, baseline metrics, optimized metrics, validation results, and plan references.

POST `/optimize`

Accepts a scenario ID and optimizer configuration.

```
{
  "scenario_id": "event_spike_01",
  "time_limit_seconds": 10,
  "objective_weights": {
    "waiting": 1.0,
    "unserved": 10.0,
    "missed_connections": 8.0,
    "operating_cost": 0.2,
    "schedule_deviation": 0.5
  }
}
```

Response: candidate plan, solver status, objective value, solve duration, and independent validation report. Weights are starting values to tune, not universal optimal values.

POST `/validate`

Accepts a scenario ID and proposed plan; returns hard violations and feasibility.

A successful HTTP response does not imply a feasible schedule. The JSON body must state the actual validation result.

POST `/evaluate`

Executes the baseline and a supplied validated plan against the same scenario.

Request:

```
{
  "scenario_id": "event_spike_01",
  "baseline_plan_id": "baseline_01",
  "candidate_plan_id": "candidate_01",
  "seed": 42
}
```

Response: raw metric values, absolute differences, percentage changes where meaningful, and validation status.

GET `/runs/{run_id}`

Retrieves a saved run, including the scenario, plans, metrics, validation report, and event-log summary.

### Shared API rules

- Define request and response models using Pydantic.
- Use stable identifiers for scenarios, runs, trips, and vehicles.
- Return `404` for unknown IDs and `422` for invalid request data.
- Return solver timeout or infeasibility as an explicit result status.
- Keep simulation time in integer minutes from the scenario start.
- Use a consistent unit system throughout the application.
- Persist the actual metrics and plans used by the frontend.

For the demo, run optimization and evaluation synchronously if they finish quickly. If optimization takes too long, add a job status endpoint later. Do not spend early hackathon hours building infrastructure for hypothetical scale.

# ## Repository structure

```routepulse/
├── README.md
├── docker-compose.yml
├── .env.example
├── data/
│   ├── network/
│   │   └── campus.json
│   ├── scenarios/
│   │   ├── normal.json
│   │   ├── event_spike.json
│   │   └── vehicle_failure.json
│   └── gps/
│       └── gps_traces.json
├── backend/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── network.py
│   │   │   ├── scenarios.py
│   │   │   ├── optimization.py
│   │   │   └── evaluation.py
│   │   ├── schemas/
│   │   │   ├── network.py
│   │   │   ├── scenario.py
│   │   │   ├── plan.py
│   │   │   └── metrics.py
│   │   ├── prediction/
│   │   │   ├── eta.py
│   │   │   └── demand.py
│   │   ├── optimizer/
│   │   │   ├── model.py
│   │   │   ├── solve.py
│   │   │   └── fallback.py
│   │   ├── validation/
│   │   │   └── constraints.py
│   │   ├── simulation/
│   │   │   ├── engine.py
│   │   │   ├── events.py
│   │   │   └── boarding.py
│   │   └── evaluation/
│   │       ├── metrics.py
│   │       └── comparison.py
│   └── tests/
│       ├── test_capacity.py
│       ├── test_timetable.py
│       ├── test_vehicle_conflicts.py
│       ├── test_simulation.py
│       └── test_metrics.py
├── frontend/
│   ├── package.json
│   └── src/
│       ├── api/
│       │   └── client.ts
│       ├── components/
│       │   ├── NetworkMap.tsx
│       │   ├── KPIGrid.tsx
│       │   ├── AlertsPanel.tsx
│       │   └── PlanComparison.tsx
│       ├── pages/
│       │   ├── Operations.tsx
│       │   ├── RecoveryPlanner.tsx
│       │   └── PerformanceLab.tsx
│       └── App.tsx
└── docs/
    ├── architecture.md
    ├── assumptions.md
    └── evaluation_protocol.md
```

# Evaluation formulas and judging evidence

Your evaluation code should use raw event logs and actual vehicle states. These formulas should be fixed in `docs/evaluation_protocol.md` before you start comparing plans.

### ETA mean absolute error

For \(N\) observed stop arrivals:

$$ MAE_{ETA}=\frac{1}{N}\sum_{i=1}^{N} |\hat t_i-t_i| 
$$
- \(\hat t_i\): predicted arrival time recorded at a defined prediction cutoff.
- \(t_i\): simulated actual arrival time.
- Report minutes.
- Exclude arrivals without a valid prediction and report the coverage separately.

Do not generate predictions after the arrival has already occurred and then count them as valid forecasts.

### Average passenger waiting time

For \(P\) passengers who board within the evaluation horizon:
$$
 W_{avg}=\frac{1}{P}\sum_{i=1}^{P} (t_i^{board}-t_i^{arrival}) 
$$
Report this alongside the number of passengers who never board. Otherwise, a plan that leaves difficult passengers behind could misleadingly reduce average waiting time.

### Unserved passenger rate
$$
 U=\frac{P_{unserved}}{P_{total}}\times100\% 
$$
Define unserved passengers consistently, such as passengers still waiting or passengers who abandon the queue before completing their journey. Report those categories separately if possible.

### Missed connections
$$
 M=\sum_{j=1}^{K}\mathbf{1} \left(t_j^{incoming}+b_j>t_j^{departure}\right) 
$$
Here \(b_j\) is the required transfer buffer. Count each intended transfer at most once.

### Fleet utilization
$$
 F=\frac{\sum_v T_v^{active}}{\sum_v T_v^{available}}\times100\% 
$$
Define whether active time includes travel, boarding, and turnaround. Use the same definition for both plans. High utilization is not automatically better if it creates unreliable service or eliminates recovery capacity.

### Operational cost

A simple model:
$$
 C=c_{km}D+c_hT_{active}+c_sN_{shifts} 
$$
Where:

- \(D\): vehicle-kilometres.
    
- \(T_{active}\): active vehicle time.
    
- \(N_{shifts}\): number of additional vehicle assignments or schedule changes.
    
- \(c_{km}, c_h, c_s\): explicitly declared cost weights.
    

Use actual supplied operating costs if available. Otherwise, label the result a simulated cost index.

### Percentage improvement

For metrics where lower is better:

$$ I=\frac{B-O}{B}\times100\% $$

Where \(B\) is the baseline metric and \(O\) is the optimized metric. If \(B=0\), report the absolute difference instead of dividing by zero.

For utilization or other metrics where higher is not always better, report the change and interpret it alongside the other outcomes rather than automatically calling it an improvement.

### Feasibility

Track at least these three quantities separately:

- Hard-constraint violation count.
- Percentage of proposed plans that pass validation.
- Percentage of scenarios for which a feasible plan was found.

### Experimental protocol

Use three fixed scenarios for the initial MVP, then test additional seeds if time allows.

|Experiment|Baseline|Candidate|
|---|---|---|
|Normal service|Original timetable|Optimized timetable|
|Demand spike|Original timetable under spike|Optimized timetable under same spike|
|Vehicle unavailable|Original timetable under failure|Optimized timetable under same failure|

Freeze the network, evaluation horizon, random seed, passenger demand generation rules, and objective weights before the comparison.

For a stronger result, run multiple seeds per scenario and report the mean and range of improvements. Do not tune on your held-out test scenarios.

# Priority order

|Priority|Feature|Decision|
|---|---|---|
|P0|Independent validator|Never cut|
|P0|Baseline and optimized evaluation|Never cut|
|P0|Vehicle assignment optimizer|Never cut|
|P1|Disruption simulation|Keep at least two scenarios|
|P1|ETA estimator|Keep a working, measurable baseline|
|P2|Demand forecasting model|Use a simple historical baseline if needed|
|P2|Fancy map animations|Cut|
|P3|LLM dispatch copilot|Cut if the core system is incomplete|
|P3|Live GPS or hardware|Cut|
