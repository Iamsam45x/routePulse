import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BusFront, Users, MapPin } from "lucide-react";

import type {
  DemandRecord,
  Route,
  Stop,
  Vehicle,
} from "../../types/operations";

interface DemandCapacityChartProps {
  demand: DemandRecord[];
  stops: Stop[];
  vehicles: Vehicle[];
  routes: Route[];
}

export default function DemandCapacityChart({
  demand,
  stops,
  vehicles,
  routes,
}: DemandCapacityChartProps) {
  const totalDemand = demand.reduce(
    (total, record) => total + record.passengerCount,
    0,
  );

  const assignedCapacity = vehicles
    .filter(
      (vehicle) =>
        vehicle.status === "in-service" && vehicle.routeId,
    )
    .reduce((total, vehicle) => total + vehicle.capacity, 0);

  const chartData = stops.map((stop) => {
    const stopDemand = demand
      .filter((record) => record.stopId === stop.id)
      .reduce((total, record) => total + record.passengerCount, 0);

    const stopRouteIds = routes
      .filter((route) => route.stopIds.includes(stop.id))
      .map((route) => route.id);

    const stopCapacity = vehicles
      .filter(
        (vehicle) =>
          vehicle.status === "in-service" &&
          vehicle.routeId &&
          stopRouteIds.includes(vehicle.routeId),
      )
      .reduce((total, vehicle) => total + vehicle.capacity, 0);

    return {
      stop: stop.name,
      demand: stopDemand,
      capacity: stopCapacity,
    };
  });

  if (stops.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          No stop data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            Recorded Demand
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {totalDemand.toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Across sample demand records
          </p>
        </div>

        <div className="rounded-lg border border-border bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BusFront size={16} />
            Assigned Capacity
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {assignedCapacity.toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            In-service vehicles on assigned routes
          </p>
        </div>

        <div className="rounded-lg border border-border bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={16} />
            Stops Monitored
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {stops.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Stops in the network dataset
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Demand vs. Capacity by Stop
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Compare recorded passenger demand with assigned vehicle capacity.
          </p>
        </div>

        <span className="rounded-md border border-border bg-white px-2.5 py-1 text-xs text-muted-foreground">
          Sample data
        </span>
      </div>

      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -16, bottom: 28 }}
            barGap={5}
            barCategoryGap="28%"
          >
            <CartesianGrid
              stroke="#E2E8F0"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="stop"
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
              angle={-18}
              textAnchor="end"
              interval={0}
              height={52}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={42}
            />

            <Tooltip
              cursor={{ fill: "#F1F5F9" }}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                fontSize: "12px",
              }}
              labelStyle={{
                color: "#0F172A",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: "12px",
                paddingBottom: "16px",
              }}
            />

            <Bar
              dataKey="demand"
              name="Passenger Demand"
              fill="#2563EB"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />

            <Bar
              dataKey="capacity"
              name="Assigned Capacity"
              fill="#16A34A"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
        Capacity is based on in-service vehicles assigned to routes serving
        each stop. Demand and capacity are sample values, not live operational
        measurements.
      </p>
    </div>
  );
}
