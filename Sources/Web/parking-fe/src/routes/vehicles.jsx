import { createFileRoute } from "@tanstack/react-router";
import VehicleManagement from "../components/VehicleManagement";

export const Route = createFileRoute("/vehicles")({
  component: VehicleManagement,
});
