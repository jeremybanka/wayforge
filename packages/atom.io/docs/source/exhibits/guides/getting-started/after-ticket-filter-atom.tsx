import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"
import type { JSX } from "react/jsx-runtime"

type TicketStatus = `closed` | `open`

const ticketStatusAtom = atom<TicketStatus>({
	key: `ticketStatus`,
	default: `open`,
})

function TicketStatusSelect(): JSX.Element {
	const status = useO(ticketStatusAtom)
	const setStatus = useI(ticketStatusAtom)

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
	const status = useO(ticketStatusAtom)

	return <h2>{status === `open` ? `Open tickets` : `Closed tickets`}</h2>
}

export function TicketQueue(): JSX.Element {
	return (
		<>
			<TicketStatusSelect />
			<TicketQueueHeading />
		</>
	)
}
