import { Future } from "atom.io/internal"
import type { Socket } from "atom.io/realtime"

type SubData = { refcount: number; timer: Future<void> }

const subscriptions: WeakMap<Socket, Map<string, SubData>> = new WeakMap()
const socketIds: WeakMap<Socket, string | undefined> = new WeakMap()

function getSubMap(socket: Socket): Map<string, SubData> {
	let subMap = subscriptions.get(socket)
	if (subMap === undefined) {
		subMap = new Map()
		subscriptions.set(socket, subMap)
	}
	return subMap
}

let refcount = 0

export function createSubscriber<K extends string>(
	socket: Socket,
	key: K,
	open: (key: K) => () => void,
): () => void {
	if (key === `gameTiles`) {
		console.log(`😽😽😽😽😽 createSubscriber`, key, refcount)
		refcount++
	}
	const knownSocketId = socketIds.get(socket)
	if (knownSocketId !== socket.id) {
		socketIds.set(socket, socket.id)
		subscriptions.delete(socket)
	}
	const subMap = getSubMap(socket)
	let sub = subMap.get(key)

	if (sub) {
		if (key === `gameTiles`) {
			console.log(`😽😽😽😽😽 renewing createSubscriber`, key, { refcount })
		}
		sub.timer.use(new Promise<void>(() => {}))
		sub.refcount++
	} else {
		sub = { refcount: 1, timer: new Future<void>(() => {}) }
		subMap.set(key, sub)
		const close = open(key)
		void sub.timer.then(() => {
			if (key === `gameTiles`) {
				console.log(`😽😽😽😽😽 💀 closing 💀`, key, { refcount })
				// debugger
			}
			close()
			subMap.delete(key)
		})
	}
	return () => {
		sub.refcount--
		if (key === `gameTiles`) {
			refcount--
			console.log(`😽😽😽😽😽 🐰 unsubscriber hook 🐰`, key, { refcount })
			// debugger
		}
		if (sub.refcount === 0) {
			const timeout = new Promise<void>((resolve) => {
				if (key === `gameTiles`)
					console.log(`😽😽😽😽😽 🐰 timeout start 🐰`, key, { refcount })
				setTimeout(() => {
					if (key === `gameTiles`)
						console.log(`😽😽😽😽😽 🔪 timeout done 🔪`, key, { refcount })
					resolve()
				}, 1000)
			})
			sub.timer.use(timeout)
		}
	}
}
