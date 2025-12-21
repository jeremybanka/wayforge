import { Future } from "atom.io/internal"
import type { Socket } from "atom.io/realtime"

const subscriptions: WeakMap<Socket, Map<string, Future<void>>> = new WeakMap()
const socketIds: WeakMap<Socket, string> = new WeakMap()

function getSubMap(socket: Socket): Map<string, Future<void>> {
	let subMap = subscriptions.get(socket)
	if (subMap === undefined) {
		subMap = new Map()
		subscriptions.set(socket, subMap)
	}
	return subMap
}

function validateSocket(socket: Socket): boolean {
	const knownSocketId = socketIds.get(socket)
	console.log(`👺👺👺👺👺👺👺👺👺👺👺👺👺👺👺`, knownSocketId, socket.id)
	if (knownSocketId === undefined) {
		socketIds.set(socket, socket.id!)
		return true
	}
	return knownSocketId === socket.id
}

export function createSubscriber<K extends string>(
	socket: Socket,
	key: K,
	open: (key: K) => () => void,
): () => void {
	const unsubTimers = getSubMap(socket)
	const socketIdIsValid = validateSocket(socket)
	let timer = unsubTimers.get(key)
	if (timer && socketIdIsValid) {
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
			setTimeout(() => {
				resolve()
			}, 50)
		})
		timer.use(timeout)
	}
}
