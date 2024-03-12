import * as React from "react"
import type { Socket } from "socket.io-client"
import { onMount } from "./on-mount"
import { RealtimeContext } from "./realtime-context"

export function useRealtimeService(
	key: string,
	create: (socket: Socket) => (() => void) | undefined,
): void {
	const { socket, services } = React.useContext(RealtimeContext)
	onMount(() => {
		let service = services?.get(key)
		if (service) {
			service[0]++
		} else {
			const dispose = socket ? create(socket) : undefined
			service = [1, dispose]
			services?.set(key, service)
		}
		return () => {
			service[0]--
			if (service[0] === 0) {
				service[1]?.()
				services?.delete(key)
			}
		}
	})
}
