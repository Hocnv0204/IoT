import { createFileRoute } from "@tanstack/react-router";
import CardManagement from "../components/CardManagement";

export const Route = createFileRoute('/cards')({
  component: CardManagement,
});

