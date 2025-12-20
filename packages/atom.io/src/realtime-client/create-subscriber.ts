import { Future } from "atom.io/internal"
import type { Socket } from "atom.io/realtime"

const subscriptions: WeakMap<Socket, Map<string, Future<void>>> = new WeakMap()

function getSubMap(socket: Socket): Map<string, Future<void>> {
	let subMap = subscriptions.get(socket)
	if (subMap === undefined) {
		subMap = new Map()
		subscriptions.set(socket, subMap)
	}
	return subMap
}

export function createSubscriber<K extends string>(
	socket: Socket,
	key: K,
	open: (key: K) => () => void,
): () => void {
	const unsubTimers = getSubMap(socket)
	const timer = unsubTimers.get(key)
	if (timer) {
		timer.use(new Promise<void>(() => {}))
	} else {
		const indefinite = new Future<void>(() => {})
		unsubTimers.set(key, indefinite)
		const close = open(key)
		void indefinite.then(() => {
			close()
			unsubTimers.delete(key)
		})
	}
	return () => {
		const unsubTimer = unsubTimers.get(key)
		if (unsubTimer) {
			const timeout = new Promise<void>((resolve) => {
				setTimeout(resolve, 1000)
			})
			unsubTimer.use(timeout)
		}
	}
}
