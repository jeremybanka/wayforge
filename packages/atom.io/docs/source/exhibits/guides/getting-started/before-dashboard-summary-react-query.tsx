import { useQuery } from "@tanstack/react-query"
import type { JSX } from "react/jsx-runtime"

type DashboardStats = {
	openTicketCount: number
	overdueTicketCount: number
	medianResponseTime: string
}

async function fetchDashboardStats(): Promise<DashboardStats> {
	const response = await fetch(`/api/dashboard/stats`)
	if (!response.ok) {
		throw new Error(`Could not load dashboard stats.`)
	}
	return response.json()
}

export function DashboardSummary(): JSX.Element {
	const statsQuery = useQuery({
		queryKey: [`dashboardStats`],
		queryFn: fetchDashboardStats,
	})

	if (statsQuery.isPending) {
		return <p>Loading dashboard...</p>
	}

	if (statsQuery.isError) {
		return <p role="alert">{statsQuery.error.message}</p>
	}

	return (
		<section>
			<h2>Support dashboard</h2>
			<p>{statsQuery.data.openTicketCount} open tickets</p>
			<p>{statsQuery.data.overdueTicketCount} overdue</p>
			<p>Median response: {statsQuery.data.medianResponseTime}</p>
			{statsQuery.isFetching ? <small>Refreshing...</small> : null}
		</section>
	)
}
