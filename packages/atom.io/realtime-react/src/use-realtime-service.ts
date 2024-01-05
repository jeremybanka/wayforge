import * as React from "react"
import { onMount } from "./on-mount"
import { RealtimeContext } from "./realtime-context"

export function useRealtimeService(key: string, create: () => () => void): void {
	const { socket, services } = React.useContext(RealtimeContext)
	onMount(() => {
		let service = services?.get(key)
		if (service) {
			service[0]++
		} else {
			const dispose = create()
			service = [1, dispose]
			services?.set(key, service)
		}
		return () => {
			if (service) {
				service[0]--
				if (service[0] === 0) {
					service[1]()
					services?.delete(key)
				}
			}
		}
	}, [socket?.id])
}
