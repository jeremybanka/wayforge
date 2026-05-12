import type { Socket } from "atom.io/realtime"

import { getSubMap } from "./create-subscriber"

/**
 * Observe the current cleanup wave for a socket's pending subscriptions.
 *
 * @remarks
 * This is exported for internal framework coordination, especially test
 * teardown, and is not intended as a general-purpose public utility.
 */
export async function observeSocketWindDown(socket: Socket): Promise<string[]> {
	const pendingSubscriptions = [...getSubMap(socket)].flatMap(([key, sub]) =>
		sub.refcount === 0 ? [[key, sub.timer] as const] : [],
	)
	await Promise.all(pendingSubscriptions.map(([, timer]) => timer))
	return pendingSubscriptions.map(([key]) => key)
}
