import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import type { Socket } from "socket.io-client"

import {
	optimisticUpdateQueueState,
	serverConfirmedUpdateQueueState,
} from "./realtime-client-stores"

export function syncAction<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
	socket: Socket,
	updateQueue: AtomIO.TransactionUpdate<any>[],
	store: Internal.Store,
): () => void {
	const unsubscribeFromLocalUpdates = Internal.subscribeToTransaction(
		token,
		(clientUpdate) => {
			AtomIO.setState(optimisticUpdateQueueState, (queue) => {
				queue.push(clientUpdate)
				return queue
			})
			socket.emit(`tx-run:${token.key}`, clientUpdate)
		},
		`tx-run:${token.key}:${socket.id}`,
		store,
	)

	const applyIncomingUpdate = (serverUpdate: AtomIO.TransactionUpdate<ƒ>) => {
		const clientUpdate = updateQueue[0]
		// AtomIO.setState(serverConfirmedUpdateQueueState, (queue) => {
		// 	queue.push(serverUpdate.)
		// 	return queue
		// })
		if (clientUpdate) {
			if (clientUpdate.id !== serverUpdate.id) {
				store.logger.error(
					`❌`,
					`transaction`,
					serverUpdate.key,
					`did not match position 0 in queue of updates awaiting sync:`,
					updateQueue,
				)
			}
			const clientResult = JSON.stringify(clientUpdate.updates)
			const serverResult = JSON.stringify(serverUpdate.updates)
			if (clientResult !== serverResult) {
				store.logger.error(
					`❌`,
					`transaction`,
					token.key,
					`results do not match between client and server:`,
					{ clientResult, serverResult },
				)
				Internal.ingestTransactionUpdate(`oldValue`, clientUpdate, store)
				Internal.ingestTransactionUpdate(`newValue`, serverUpdate, store)
			} else {
				store.logger.info(
					`✅`,
					`transaction`,
					token.key,
					`results match between client and server`,
				)
			}
			AtomIO.setState(optimisticUpdateQueueState, (queue) => {
				queue.shift()
				return queue
			})
		}
	}
	socket.on(`tx-new:${token.key}`, applyIncomingUpdate)
	socket.emit(`tx-sub:${token.key}`)
	const unsubscribeFromIncomingUpdates = () => {
		socket.off(`tx-new:${token.key}`, applyIncomingUpdate)
		socket.emit(`tx-unsub:${token.key}`)
	}
	return () => {
		unsubscribeFromLocalUpdates()
		unsubscribeFromIncomingUpdates()
	}
}
