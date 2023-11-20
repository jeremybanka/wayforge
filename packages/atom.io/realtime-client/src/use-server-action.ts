import * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import type { Socket } from "socket.io-client"

const TX_SUBS = new Map<string, number>()
export function synchronizeTransactionResults(
	token: AtomIO.TransactionToken<any>,
	socket: Socket,
	store: Store,
): () => void {
	const count = TX_SUBS.get(token.key) ?? 0
	TX_SUBS.set(token.key, count + 1)
	const unsubscribe =
		count === 0
			? AtomIO.subscribeToTransaction(
					token,
					(clientUpdate) => {
						const transactionId = Math.random().toString(36).slice(2)
						const clientResult = JSON.stringify(clientUpdate)
						const topic = `tx:sync:${transactionId}`
						const sync = (serverUpdate: typeof clientUpdate) => {
							store.logger.info(`♻️ Transaction "${token.key}" synced`)
							socket.off(topic, sync)
							const serverResult = JSON.stringify(serverUpdate)
							if (clientResult !== serverResult) {
								store.logger.error(
									`❗ Transaction "${token.key}" produced different results on client and server`,
								)
								store.logger.error(
									`❗ Client result for "${token.key}":`,
									clientResult,
								)
								store.logger.error(
									`❗ Server result for "${token.key}:`,
									serverResult,
								)
							} else {
								store.logger.info(`✅ Transaction "${token.key}" results match`)
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
