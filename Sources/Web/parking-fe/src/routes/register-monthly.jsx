import { createFileRoute } from "@tanstack/react-router";
import RegisterMonthly from "../components/RegisterMonthly";

export const Route = createFileRoute('/register-monthly')({
  component: RegisterMonthly,
});
