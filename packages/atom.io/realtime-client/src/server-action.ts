import type * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import type { Socket } from "socket.io-client"

const TX_SUBS = new Map<string, number>()
export function synchronizeTransactionResults(
	token: AtomIO.TransactionToken<any>,
	socket: Socket,
	store: Internal.Store,
): () => void {
	if (!socket) {
		return () => null
	}
	const count = TX_SUBS.get(token.key) ?? 0
	TX_SUBS.set(token.key, count + 1)
	const unsubscribe =
		count === 0
			? Internal.subscribeToTransaction(
					token,
					(clientUpdate) => {
						const transactionId = Math.random().toString(36).slice(2)
						const clientResult = JSON.stringify(clientUpdate)
						const topic = `tx:sync:${transactionId}`
						const sync = (serverUpdate: typeof clientUpdate) => {
							socket.off(topic, sync)
							store.logger.info(
								`🔄`,
								`transaction`,
								token.key,
								`syncing client and server`,
							)
							const serverResult = JSON.stringify(serverUpdate)
							if (clientResult !== serverResult) {
								store.logger.error(
									`❌`,
									`transaction`,
									token.key,
									`results do not match between client and server`,
								)
								store.logger.error(
									`❌`,
									`transaction`,
									token.key,
									`client:`,
									clientResult,
								)
								store.logger.error(
									`❌`,
									`transaction`,
									token.key,
									`server:`,
									serverResult,
								)
							} else {
								store.logger.info(
									`✅`,
									`transaction`,
									token.key,
									`results match between client and server`,
								)
							}
						}
						socket.on(topic, sync)
						socket.emit(`tx:${token.key}`, clientUpdate, transactionId)
					},
					`use-server-action`,
					store,
			  )
			: () => null
	return () => {
		const newCount = TX_SUBS.get(token.key) ?? 0
		TX_SUBS.set(token.key, newCount - 1)
		unsubscribe()
	}
}
