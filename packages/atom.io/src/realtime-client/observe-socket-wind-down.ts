import type { Socket } from "atom.io/realtime"

import { getSubMap } from "./create-subscriber"

export async function observeSocketWindDown(socket: Socket): Promise<string[]> {
	const pendingSubscriptions = [...getSubMap(socket)].flatMap(([key, sub]) =>
		sub.refcount === 0 ? [[key, sub.timer] as const] : [],
	)
	await Promise.all(pendingSubscriptions.map(([, timer]) => timer))
	return pendingSubscriptions.map(([key]) => key)
}
