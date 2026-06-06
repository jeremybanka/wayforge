import * as React from "react"
import type { JSX } from "react/jsx-runtime"

type TicketStatus = `closed` | `open`

type TicketFilterContextValue = {
	status: TicketStatus
	setStatus: React.Dispatch<React.SetStateAction<TicketStatus>>
}

const TicketFilterContext = React.createContext<TicketFilterContextValue | null>(
	null,
)

function useTicketFilter(): TicketFilterContextValue {
	const value = React.useContext(TicketFilterContext)
	if (!value) {
		throw new Error(`useTicketFilter must be used inside TicketFilterProvider`)
	}
	return value
}

function TicketFilterProvider(props: React.PropsWithChildren): JSX.Element {
	const [status, setStatus] = React.useState<TicketStatus>(`open`)

	return (
		<TicketFilterContext.Provider value={{ status, setStatus }}>
			{props.children}
		</TicketFilterContext.Provider>
	)
}

function TicketStatusSelect(): JSX.Element {
	const { status, setStatus } = useTicketFilter()

	return (
		<label>
			Status
			<select
				value={status}
				onChange={(event) => {
					setStatus(event.currentTarget.value as TicketStatus)
				}}
			>
				<option value="open">Open</option>
				<option value="closed">Closed</option>
			</select>
		</label>
	)
}

function TicketQueueHeading(): JSX.Element {
	const { status } = useTicketFilter()

	return <h2>{status === `open` ? `Open tickets` : `Closed tickets`}</h2>
}

export function TicketQueue(): JSX.Element {
	return (
		<TicketFilterProvider>
			<TicketStatusSelect />
			<TicketQueueHeading />
		</TicketFilterProvider>
	)
}
