import type * as AtomIO from "atom.io"
import { actUponStore, IMPLICIT } from "atom.io/internal"
import type { JsonIO } from "atom.io/json"

import type { ServerConfig } from "."

export type ActionReceiver = ReturnType<typeof realtimeActionReceiver>
export function realtimeActionReceiver({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function actionReceiver<F extends JsonIO>(
		tx: AtomIO.TransactionToken<F>,
	): () => void {
		const fillTransactionRequest = (
			update: Pick<AtomIO.TransactionUpdate<F>, `id` | `params`>,
		) => {
			const performanceKey = `tx-run:${tx.key}:${update.id}`
			const performanceKeyStart = `${performanceKey}:start`
			const performanceKeyEnd = `${performanceKey}:end`
			performance.mark(performanceKeyStart)
			actUponStore<F>(tx, update.id, store)(...update.params)
			performance.mark(performanceKeyEnd)
			const metric = performance.measure(
				performanceKey,
				performanceKeyStart,
				performanceKeyEnd,
			)
			store?.logger.info(`🚀`, `transaction`, tx.key, update.id, metric.duration)
		}
		socket.on(`tx-run:${tx.key}`, fillTransactionRequest)

		return () => {
			socket.off(`tx-run:${tx.key}`, fillTransactionRequest)
		}
	}
}
