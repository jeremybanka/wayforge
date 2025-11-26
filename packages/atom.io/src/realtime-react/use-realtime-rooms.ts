import type { RoomSocketInterface } from "atom.io/realtime"
import * as React from "react"
import type { Socket } from "socket.io-client"

import { RealtimeContext } from "./realtime-context"

export function useRealtimeRooms<RoomNames extends string>(): Socket<
	{},
	RoomSocketInterface<RoomNames>
> {
	const { socket } = React.useContext(RealtimeContext)
	return socket as Socket<{}, RoomSocketInterface<RoomNames>>
}
