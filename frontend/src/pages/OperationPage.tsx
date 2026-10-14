
import {
  BusFront,
  CalendarDays,
  Users,
  BellRing,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";

export default function OperationsPage() {
    
const statCards = [
  {
    title: "Available Buses",
    value: "—",
    description: "Vehicle availability from the network data",
    icon: BusFront,
  },
  {
    title: "Scheduled Trips",
    value: "—",
    description: "Trips recorded in the schedule",
    icon: CalendarDays,
  },
  {
    title: "Passenger Demand",
    value: "—",
    description: "Demand reported by the dataset",
    icon: Users,
  },
  {
    title: "Active Alerts",
    value: "—",
    description: "Alerts reported by the network",
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
          <p className="mt-2 text-sm text-muted-foreground">
            Route and stop map will be displayed here.
          </p>
        </div>

        <div className="min-h-72 rounded-lg border border-border bg-white p-5">
          <h2 className="font-semibold">Demand vs. Capacity</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Passenger demand and vehicle capacity chart will be displayed here.
          </p>
        </div>
      </section>

 
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-h-52 rounded-lg border border-border bg-white p-5">
          <h2 className="font-semibold">Route Status</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Route and scheduled-trip details will be displayed here.
          </p>
        </div>

        <div className="min-h-52 rounded-lg border border-border bg-white p-5">
          <h2 className="font-semibold">Active Alerts</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Transport alerts from the dataset will be displayed here.
          </p>
        </div>
      </section>
    </div>
  );
}
