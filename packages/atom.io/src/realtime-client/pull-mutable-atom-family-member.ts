import type * as AtomIO from "atom.io"
import type { AsJSON, SignalFrom, Store, Transceiver } from "atom.io/internal"
import {
	findInStore,
	getJsonToken,
	getUpdateToken,
	setIntoStore,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { employSocket, type Socket } from "atom.io/realtime"

import { createSubscriber } from "./create-subscriber"

const SOCKET_REFS = new Set<Socket>()

export function pullMutableAtomFamilyMember<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
>(
	store: Store,
	socket: Socket,
	family: AtomIO.MutableAtomFamilyToken<T, K>,
	key: NoInfer<K>,
): () => void {
	SOCKET_REFS.add(socket)
	const token = findInStore(store, family, key)

	// socket.on(`init:${token.key}`, (data: AsJSON<T>) => {
	// 	const jsonToken = getJsonToken(store, token)
	// 	setIntoStore(store, jsonToken, data)
	// })
	// socket.on(`next:${token.key}`, (data: SignalFrom<T>) => {
	// 	const trackerToken = getUpdateToken(token)
	// 	setIntoStore(store, trackerToken, data)
	// })
	// socket.emit(`sub:${family.key}`, key)
	// return () => {
	// 	console.log(`👺👺👺👺👺👺👺👺👺👺👺👺👺👺👺`, token.key)
	// 	console.log(`👺👺👺👺👺👺👺👺👺👺👺👺👺👺👺❗`, SOCKET_REFS.size)
	// 	socket.off(`next:${token.key}`)
	// 	socket.off(`init:${token.key}`)
	// 	socket.emit(`unsub:${token.key}`)
	// }

	// return createSubscriber(socket, token.key, () => {
	// 	socket.on(`init:${token.key}`, (data: AsJSON<T>) => {
	// 		const jsonToken = getJsonToken(store, token)
	// 		setIntoStore(store, jsonToken, data)
	// 	})
	// 	socket.on(`next:${token.key}`, (data: SignalFrom<T>) => {
	// 		const trackerToken = getUpdateToken(token)
	// 		setIntoStore(store, trackerToken, data)
	// 	})
	// 	return () => {
	// 		console.log(`👺👺👺👺👺👺👺👺👺👺👺👺👺👺👺`, token.key)
	// 		console.log(`👺👺👺👺👺👺👺👺👺👺👺👺👺👺👺❗`, SOCKET_REFS.size)
	// 		socket.off(`next:${token.key}`)
	// 		socket.off(`init:${token.key}`)
	// 		socket.emit(`unsub:${token.key}`)
	// 	}
	// })

	const jsonToken = getJsonToken(store, token)
	const trackerToken = getUpdateToken(token)
	return createSubscriber(socket, token.key, () => {
		const stopWatchingForInit = employSocket(
			socket,
			`init:${token.key}`,
			(data: AsJSON<T>) => {
				setIntoStore(store, jsonToken, data)
			},
		)
		const stopWatchingForUpdate = employSocket(
			socket,
			`next:${token.key}`,
			(data: SignalFrom<T>) => {
				setIntoStore(store, trackerToken, data)
			},
		)
		socket.emit(`sub:${family.key}`, key)
		return () => {
			// console.log(`👺👺👺`, `done with`, token.key)
			socket.emit(`unsub:${token.key}`)
			stopWatchingForInit()
			stopWatchingForUpdate()
		}
	})
}
