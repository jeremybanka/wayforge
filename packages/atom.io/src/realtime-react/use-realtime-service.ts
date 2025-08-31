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
			++service.consumerCount
		} else {
			let dispose: (() => void) | undefined
			if (socket) {
				dispose = create(socket)
			} else {
				dispose = undefined
			}
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
	})
}
