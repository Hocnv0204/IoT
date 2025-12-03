import { createFileRoute } from "@tanstack/react-router";
import HistoryLogs from "../components/HistoryLogs";

export const Route = createFileRoute('/logs')({
  component: HistoryLogs,
});

