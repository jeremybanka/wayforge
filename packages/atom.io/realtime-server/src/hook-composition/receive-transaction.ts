import * as AtomIO from "atom.io"

import type { ServerConfig } from "."

export const useReceiveTransaction = ({ socket, store }: ServerConfig) => {
	return function receiveTransaction<ƒ extends AtomIO.ƒn>(
		tx: AtomIO.TransactionToken<ƒ>,
	): () => void {
		const fillTransactionRequest = (update: AtomIO.TransactionUpdate<ƒ>) => {
			const performanceKey = `tx-run:${tx.key}:${update.id}`
			const performanceKeyStart = `${performanceKey}:start`
			const performanceKeyEnd = `${performanceKey}:end`
			console.log(`running transaction`, tx.key, update.id)
			performance.mark(performanceKeyStart)
			AtomIO.runTransaction<ƒ>(tx, store)(...update.params)
			performance.mark(performanceKeyEnd)
			const metric = performance.measure(
				performanceKey,
				performanceKeyStart,
				performanceKeyEnd,
			)
			store?.logger.info(`🚀`, `transaction`, tx.key, update.id, metric.duration)
		}
		socket.on(`tx-run:${tx.key}`, fillTransactionRequest)

		return () => socket.off(`tx-run:${tx.key}`, fillTransactionRequest)
	}
}
