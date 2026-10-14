
import type { OperationsData } from "../types/operations";

export const operationsMockData: OperationsData = {
  routes: [
    {
      id: "R1",
      name: "Route 1",
      stopIds: ["S01", "S02", "S03"],
      status: "active",
    },
    {
      id: "R2",
      name: "Route 2",
      stopIds: ["S04", "S05", "S06"],
      status: "delayed",
    },
  ],

 
stops: [
  {
    id: "S01",
    name: "Main Gate",
    latitude: 12.8976,
    longitude: 77.6002,
  },
  {
    id: "S02",
    name: "Academic Block",
    latitude: 12.8981,
    longitude: 77.6008,
  },
  {
    id: "S03",
    name: "Hostel",
    latitude: 12.8969,
    longitude: 77.6010,
  },
  {
    id: "S04",
    name: "Library",
    latitude: 12.8983,
    longitude: 77.5997,
  },
  {
    id: "S05",
    name: "Sports Complex",
    latitude: 12.8967,
    longitude: 77.5994,
  },
  {
    id: "S06",
    name: "North Gate",
    latitude: 12.8990,
    longitude: 77.6003,
  },
],


  vehicles: [
    { id: "BUS01", capacity: 40, status: "available" },
    { id: "BUS02", capacity: 40, status: "in-service", routeId: "R1" },
    { id: "BUS03", capacity: 30, status: "in-service", routeId: "R2" },
    { id: "BUS04", capacity: 30, status: "unavailable" },
  ],

  trips: [
    {
      id: "T001",
      routeId: "R1",
      vehicleId: "BUS02",
      departureTime: "08:00",
      status: "scheduled",
    },
    {
      id: "T002",
      routeId: "R2",
      vehicleId: "BUS03",
      departureTime: "08:15",
      status: "scheduled",
    },
  ],

  demand: [
    { stopId: "S01", time: "08:00", passengerCount: 32 },
    { stopId: "S02", time: "08:15", passengerCount: 24 },
    { stopId: "S04", time: "08:00", passengerCount: 28 },
    { stopId: "S05", time: "08:15", passengerCount: 18 },
  ],

  etas: [
    {
      tripId: "T001",
      stopId: "S02",
      scheduledArrival: "08:10",
      estimatedArrival: "08:13",
    },
    {
      tripId: "T002",
      stopId: "S05",
      scheduledArrival: "08:12",
      estimatedArrival: "08:12",
    },
  ],

  alerts: [
    {
      id: "A001",
      title: "Route 2 delay",
      description: "The trip is running behind its scheduled arrival.",
      severity: "warning",
      status: "active",
      routeId: "R2",
    },
  ],
};
