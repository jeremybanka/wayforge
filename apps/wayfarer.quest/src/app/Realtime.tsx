"use client"

import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import { RealtimeProvider } from "atom.io/realtime-react"
import { Id } from "hamr/react-id"
import { SOCKET } from "wayfarer.quest/services/socket"

export default function Realtime({
	children,
}: {
	children: React.ReactNode
}): React.ReactNode {
	const id = useO(myIdState)
	return (
		<RealtimeProvider socket={SOCKET}>
			<Id id={id ?? `null`} key={id} />
			{children}
		</RealtimeProvider>
	)
}
