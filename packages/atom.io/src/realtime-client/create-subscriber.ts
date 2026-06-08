import {
	type CoalescedSubscriberData,
	createCoalescedSubscriber,
} from "atom.io/internal"
import type { Socket } from "atom.io/realtime"

const SUBSCRIPTION_COALESCE_MS = 50

const subscriptions: WeakMap<
	Socket,
	Map<string, CoalescedSubscriberData>
> = new WeakMap()
const socketIds: WeakMap<Socket, string | undefined> = new WeakMap()

export function getSubMap(socket: Socket): Map<string, CoalescedSubscriberData> {
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
	const subMap = getSubMap(socket)
	return createCoalescedSubscriber(subMap, key, open, SUBSCRIPTION_COALESCE_MS)
}
