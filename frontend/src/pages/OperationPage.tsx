
import {
  BusFront,
  CalendarDays,
  Users,
  BellRing,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import { operationsMockData } from "../mocks/operations";
import AlertItem from "../components/dashboard/AlertItem";
import RouteStatusTable from "../components/dashboard/RouteStatusTable";
import DemandCapacityChart from "../components/dashboard/DemandCapacityChart";
import CampusMap from "../components/map/CampusMap";

export default function OperationsPage() {



const { vehicles, trips, demand, alerts } = operationsMockData;

const availableBuses = vehicles.filter(
  (vehicle) => vehicle.status === "available"
).length;

const scheduledTrips = trips.filter(
  (trip) => trip.status === "scheduled"
).length;

const passengerDemand = demand.reduce(
  (total, record) => total + record.passengerCount,
  0
);

const activeAlerts = alerts.filter(
  (alert) => alert.status === "active"
).length;


    
const statCards = [
  {
    title: "Available Buses",
    value: String(availableBuses),
    description: "Vehicles marked available in sample data",
    icon: BusFront,
  },
  {
    title: "Scheduled Trips",
    value: String(scheduledTrips),
    description: "Trips marked as scheduled",
    icon: CalendarDays,
  },
  {
    title: "Passenger Demand",
    value: String(passengerDemand),
    description: "Total across sample demand records",
    icon: Users,
  },
  {
    title: "Active Alerts",
    value: String(activeAlerts),
    description: "Alerts currently marked active",
    icon: BellRing,
  },
];
  return (
    <div className="space-y-6">

   
<section aria-label="Transport metrics">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {statCards.map((card) => (
      <StatCard
        key={card.title}
        title={card.title}
        value={card.value}
        description={card.description}
        icon={card.icon}
      />
    ))}
  </div>
</section>



      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-h-72 rounded-lg border border-border bg-white p-5 xl:col-span-2">
          <h2 className="font-semibold">Campus Transport Network</h2>
<CampusMap
  stops={operationsMockData.stops}
  routes={operationsMockData.routes}
  vehicles={operationsMockData.vehicles}
/>
        </div>

        <div className="min-h-72 rounded-lg border border-border bg-white p-5">
          <h2 className="font-semibold">Demand vs. Capacity</h2>
<DemandCapacityChart
  demand={operationsMockData.demand}
  stops={operationsMockData.stops}
  vehicles={operationsMockData.vehicles}
  routes={operationsMockData.routes}
/>
        </div>
      </section>

 
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-h-52 rounded-lg border border-border bg-white p-5">
          <h2 className="font-semibold">Route Status</h2>
<RouteStatusTable 
  routes={operationsMockData.routes}
  vehicles={operationsMockData.vehicles}
  trips={operationsMockData.trips}
/>
        </div>

        <div className="min-h-52 rounded-lg border border-border bg-white p-5">
          <h2 className="font-semibold  mb-4">Active Alerts</h2>

          <div className="space-y-3">
  {operationsMockData.alerts
    .filter((alert) => alert.status === "active")
    .map((alert) => (
      <AlertItem key={alert.id} alert={alert} />
    ))}
</div>
        </div>
      </section>
    </div>
  );
}
