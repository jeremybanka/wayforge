import { useI } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"
import type { Socket } from "socket.io-client"

export type RealtimeServiceCounter = {
	consumerCount: number
	dispose: (() => void) | undefined
}

export type RealtimeReactStore = {
	socket: Socket | null
	services: Map<string, RealtimeServiceCounter> | null
}

export const RealtimeContext: React.Context<RealtimeReactStore> =
	React.createContext({
		socket: null,
		services: null,
	})

export const RealtimeProvider: React.FC<{
	children: React.ReactNode
	socket: Socket | null
}> = ({ children, socket }) => {
	const services = React.useRef(
		new Map<string, RealtimeServiceCounter>(),
	).current
	const setMyId = useI(RTC.myIdState__INTERNAL)
	React.useEffect(() => {
		setMyId(socket?.id)
		socket?.on(`connect`, () => {
			setMyId(socket.id)
		})
		socket?.on(`disconnect`, () => {
			setMyId(undefined)
		})
	}, [socket, setMyId])
	return (
		<RealtimeContext.Provider value={{ socket, services }}>
			{children}
		</RealtimeContext.Provider>
	)
}
