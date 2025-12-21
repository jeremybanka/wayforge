import { Future } from "atom.io/internal"
import type { Socket } from "atom.io/realtime"

const subscriptions: WeakMap<Socket, Map<string, Future<void>>> = new WeakMap()
const socketIds: WeakMap<Socket, string | undefined> = new WeakMap()

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
	const knownSocketId = socketIds.get(socket)
	if (knownSocketId !== socket.id) {
		socketIds.set(socket, socket.id)
		subscriptions.delete(socket)
	}
	const unsubTimers = getSubMap(socket)
	let timer = unsubTimers.get(key)
	if (timer) {
		timer.use(new Promise<void>(() => {}))
	} else {
		timer = new Future<void>(() => {})
		unsubTimers.set(key, timer)
		const close = open(key)
		void timer.then(() => {
			close()
			unsubTimers.delete(key)
		})
	}
	return () => {
		const timeout = new Promise<void>((resolve) => {
			setTimeout(resolve, 25)
		})
		timer.use(timeout)
	}
}
