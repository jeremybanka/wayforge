import { useSingleEffect } from "atom.io/react"
import * as React from "react"
import type { Socket } from "socket.io-client"

import { RealtimeContext } from "./realtime-context"

export function useRealtimeService(
	key: string,
	create: (socket: Socket) => () => void,
): void {
	const { socket, services } = React.useContext(RealtimeContext)
	useSingleEffect(() => {
		let service = services?.get(key)
		if (service) {
			++service.consumerCount
		} else if (socket) {
			const dispose = create(socket)
			service = { consumerCount: 1, dispose }
			services?.set(key, service)
		}
		return () => {
			if (service) {
				--service.consumerCount
				if (service.consumerCount === 0) {
					service.dispose?.()
					services?.delete(key)
				}
			}
		}
	}, [socket, key])
}
