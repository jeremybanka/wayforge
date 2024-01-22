import type * as AtomIO from "atom.io"
import { IMPLICIT, actUponStore } from "atom.io/internal"

import type { ServerConfig } from "."

export type ActionReceiver = ReturnType<typeof realtimeActionReceiver>
export function realtimeActionReceiver({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function actionReceiver<ƒ extends AtomIO.ƒn>(
		tx: AtomIO.TransactionToken<ƒ>,
	): () => void {
		const fillTransactionRequest = (update: AtomIO.TransactionUpdate<ƒ>) => {
			const performanceKey = `tx-run:${tx.key}:${update.id}`
			const performanceKeyStart = `${performanceKey}:start`
			const performanceKeyEnd = `${performanceKey}:end`
			performance.mark(performanceKeyStart)
			actUponStore<ƒ>(tx, update.id, store)(...update.params)
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
