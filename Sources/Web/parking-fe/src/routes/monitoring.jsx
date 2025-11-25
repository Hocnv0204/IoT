import { createFileRoute } from "@tanstack/react-router";
import MonitoringPage from "../components/MonitoringPage";

export const Route = createFileRoute('/monitoring')({
  component: MonitoringPage,
});
