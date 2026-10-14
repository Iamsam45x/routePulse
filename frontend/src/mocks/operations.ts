
import type { OperationsData } from "../types/operations";

export const operationsMockData: OperationsData = {
routes: [
  {
    id: "R1",
    name: "Route 1 – North & North-East",
    stopIds: ["S01", "S02", "S03", "S04", "S05"],
    status: "active",
  },
  {
    id: "R2",
    name: "Route 2 – East & South",
    stopIds: ["S06", "S07", "S08", "S09", "S10"],
    status: "delayed",
  },
  {
    id: "R3",
    name: "Route 3 – West & North-West",
    stopIds: ["S11", "S12", "S13", "S14", "S15"],
    status: "active",
  },
],

stops: [
  {
    id: "S01",
    name: "IIMB Main Gate, Bannerghatta Road",
    latitude: 12.8952,
    longitude: 77.5994,
  },
  {
    id: "S02",
    name: "Jayadeva Hospital Junction",
    latitude: 12.9177,
    longitude: 77.5993,
  },
  {
    id: "S03",
    name: "Hombegowda Nagar, Bannerghatta Road",
    latitude: 12.9316,
    longitude: 77.6008,
  },
  {
    id: "S04",
    name: "BTM Layout 2nd Stage",
    latitude: 12.9166,
    longitude: 77.6101,
  },
  {
    id: "S05",
    name: "Silk Board Junction",
    latitude: 12.9172,
    longitude: 77.6228,
  },
  {
    id: "S06",
    name: "Hongasandra Main Road",
    latitude: 12.8885,
    longitude: 77.6290,
  },
  {
    id: "S07",
    name: "Begur Lake Road",
    latitude: 12.8730,
    longitude: 77.6230,
  },
  {
    id: "S08",
    name: "Hulimavu Junction",
    latitude: 12.8790,
    longitude: 77.6090,
  },
  {
    id: "S09",
    name: "Meenakshi Mall Junction",
    latitude: 12.8765,
    longitude: 77.5963,
  },
  {
    id: "S10",
    name: "Gottigere, Bannerghatta Road",
    latitude: 12.8617,
    longitude: 77.5904,
  },
  {
    id: "S11",
    name: "IIMB Academic Block",
    latitude: 12.8962,
    longitude: 77.5972,
  },
  {
    id: "S12",
    name: "Konanakunte Cross Metro Area",
    latitude: 12.8903,
    longitude: 77.5798,
  },
  {
    id: "S13",
    name: "JP Nagar 7th Phase",
    latitude: 12.8890,
    longitude: 77.5650,
  },
  {
    id: "S14",
    name: "JP Nagar 2nd Phase",
    latitude: 12.9085,
    longitude: 77.5850,
  },
  {
    id: "S15",
    name: "Jayanagar 4th Block",
    latitude: 12.9250,
    longitude: 77.5838,
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
