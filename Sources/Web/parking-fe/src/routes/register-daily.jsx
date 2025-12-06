import { createFileRoute } from '@tanstack/react-router'
import RegisterDailyTicket from '../components/RegisterDailyTicket'

export const Route = createFileRoute('/register-daily')({
  component: RegisterDailyTicket,
})
