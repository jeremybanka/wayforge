import { useI } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"
import type { Socket } from "socket.io-client"

export const RealtimeContext = React.createContext<{ socket: Socket | null }>({
	socket: null,
})

export const RealtimeProvider: React.FC<{
	children: React.ReactNode
	socket: Socket | null
}> = ({ children, socket }) => {
	const setMyId = useI(RTC.myIdState__INTERNAL)
	React.useEffect(() => {
		if (socket) {
			setMyId(socket.id)
		}
		socket?.on(`connect`, () => {
			setMyId(socket.id)
		})
		socket?.on(`disconnect`, () => {
			setMyId(null)
		})
	}, [socket, setMyId])
	return (
		<RealtimeContext.Provider value={{ socket }}>
			{children}
		</RealtimeContext.Provider>
	)
}
