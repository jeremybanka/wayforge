import { atom, type Loadable } from "atom.io"
import { useLoadable } from "atom.io/react"
import type { JSX } from "react/jsx-runtime"

type DashboardStats = {
	openTicketCount: number
	overdueTicketCount: number
	medianResponseTime: string
}

const EMPTY_DASHBOARD_STATS: DashboardStats = {
	openTicketCount: 0,
	overdueTicketCount: 0,
	medianResponseTime: `--`,
}

async function fetchDashboardStats(): Promise<DashboardStats> {
	const response = await fetch(`/api/dashboard/stats`)
	if (!response.ok) {
		throw new Error(`Could not load dashboard stats.`)
	}
	return response.json()
}

const dashboardStatsAtom = atom<Loadable<DashboardStats>, Error>({
	key: `dashboardStats`,
	default: fetchDashboardStats,
	catch: [Error],
})

export function DashboardSummary(): JSX.Element {
	const stats = useLoadable(dashboardStatsAtom, EMPTY_DASHBOARD_STATS)

	if (stats.error) {
		return <p role="alert">{stats.error.message}</p>
	}

	return (
		<section>
			<h2>Support dashboard</h2>
			<p>{stats.value.openTicketCount} open tickets</p>
			<p>{stats.value.overdueTicketCount} overdue</p>
			<p>Median response: {stats.value.medianResponseTime}</p>
			{stats.loading ? <small>Refreshing...</small> : null}
		</section>
	)
}
