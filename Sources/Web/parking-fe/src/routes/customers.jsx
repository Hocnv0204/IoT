import { createFileRoute } from "@tanstack/react-router";
import CustomerManagement from "../components/CustomerManagement";

export const Route = createFileRoute("/customers")({
  component: CustomerManagement,
});
