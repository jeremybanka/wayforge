import { useI } from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as React from "react"
import type { Socket } from "socket.io-client"
import { io } from "socket.io-client"

export const RealtimeContext = React.createContext<{ socket: Socket }>({
	socket: io(),
})

export const RealtimeProvider: React.FC<{
	children: React.ReactNode
	socket: Socket
}> = ({ children, socket }) => {
	const setMyId = useI(RTC.myIdState__INTERNAL)
	React.useEffect(() => {
		socket.on(`connect`, () => {
			setMyId(socket.id)
		})
		socket.on(`disconnect`, () => {
			setMyId(null)
		})
	}, [socket, setMyId])
	return (
		<RealtimeContext.Provider value={{ socket }}>
			{children}
		</RealtimeContext.Provider>
	)
}
