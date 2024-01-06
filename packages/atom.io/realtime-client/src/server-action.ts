import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import type { Socket } from "socket.io-client"
import { updateQueueAtoms } from "./realtime-state"

export function synchronizeTransactionResults<ƒ extends AtomIO.ƒn>(
	token: AtomIO.TransactionToken<ƒ>,
	socket: Socket,
	updateQueue: AtomIO.TransactionUpdate<any>[],
	store: Internal.Store,
): () => void {
	const updateQueueState = AtomIO.findState(updateQueueAtoms, token)

	const unsubscribeFromLocalUpdates = Internal.subscribeToTransaction(
		token,
		(clientUpdate) => {
			AtomIO.setState(updateQueueState, (queue) => {
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
			const clientResult = JSON.stringify(clientUpdate)
			const serverResult = JSON.stringify(serverUpdate)
			if (clientResult !== serverResult) {
				store.logger.error(
					`❌`,
					`transaction`,
					token.key,
					`results do not match between client and server:`,
					{ clientResult, serverResult },
				)
				Internal.ingestTransactionUpdate(`oldValue`, clientUpdate, store)
			} else {
				store.logger.info(
					`✅`,
					`transaction`,
					token.key,
					`results match between client and server`,
				)
			}
			AtomIO.setState(updateQueueState, (queue) => {
				queue.shift()
				return queue
			})
		}
		Internal.ingestTransactionUpdate(`newValue`, serverUpdate, store)
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
