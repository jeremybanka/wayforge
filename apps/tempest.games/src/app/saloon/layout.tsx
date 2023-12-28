"use client"

import { AtomIODevtools } from "atom.io/react-devtools"
import { RealtimeProvider } from "atom.io/realtime-react"
import { io } from "socket.io-client"

// import { SocketStatus } from "~/apps/web/saloon/src/components/SocketStatus"

import { env } from "src/services/env"

export default function GameLayout({
	children,
}: {
	children: React.ReactNode
}): JSX.Element {
	return (
		<RealtimeProvider socket={io(env.NEXT_PUBLIC_REMOTE_ORIGIN)}>
			{/* <SocketStatus /> */}
			{children}
			{/* <AtomIODevtools /> */}
		</RealtimeProvider>
	)
}
