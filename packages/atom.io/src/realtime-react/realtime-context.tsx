import { useI } from "atom.io/react"
import type { RoomSocketInterface } from "atom.io/realtime/shared-room-store"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"
import type { Socket } from "socket.io-client"

export type RealtimeServiceCounter = {
	consumerCount: number
	dispose: () => void
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
	const setMySocketKey = useI(RTC.mySocketKeyAtom)
	React.useEffect(() => {
		setMySocketKey(socket?.id ? `socket::${socket.id}` : undefined)
		socket?.on(`connect`, () => {
			setMySocketKey(socket?.id ? `socket::${socket.id}` : undefined)
		})
		socket?.on(`disconnect`, () => {
			setMySocketKey(undefined)
		})
	}, [socket, setMySocketKey])
	return (
		<RealtimeContext.Provider value={{ socket, services }}>
			{children}
		</RealtimeContext.Provider>
	)
}

export function useRealtimeRooms<RoomNames extends string>(): Socket<
	{},
	RoomSocketInterface<RoomNames>
> {
	const { socket } = React.useContext(RealtimeContext)
	return socket as Socket<{}, RoomSocketInterface<RoomNames>>
}
