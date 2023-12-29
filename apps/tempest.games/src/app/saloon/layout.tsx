"use client"

import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import { RealtimeProvider } from "atom.io/realtime-react"
import { Id } from "hamr/react-id"

// import { SocketStatus } from "~/apps/web/saloon/src/components/SocketStatus"

import { SOCKET } from "src/services/socket"

export default function GameLayout({
	children,
}: {
	children: React.ReactNode
}): JSX.Element {
	const id = useO(myIdState)
	return (
		<RealtimeProvider socket={SOCKET}>
			<Id id={id ?? `null`} key={id} />
			{/* <SocketStatus /> */}
			{children}
			{/* <AtomIODevtools /> */}
		</RealtimeProvider>
	)
}
