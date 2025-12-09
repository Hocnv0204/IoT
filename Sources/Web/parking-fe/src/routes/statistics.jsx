import { createFileRoute } from '@tanstack/react-router'
import RevenueStatistics from '../components/RevenueStatistics'

export const Route = createFileRoute('/statistics')({
  component: RevenueStatistics,
})
