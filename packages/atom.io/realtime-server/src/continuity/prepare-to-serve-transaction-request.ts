import type { TransactionUpdate } from "atom.io"
import type { Store } from "atom.io/internal"
import { actUponStore } from "atom.io/internal"
import type { JsonIO } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

export function prepareToServeTransactionRequest(
	store: Store,
	continuity: ContinuityToken,
	userKey: string,
): (update: Pick<TransactionUpdate<JsonIO>, `id` | `key` | `params`>) => void {
	const continuityKey = continuity.key
	return function serveTransactionRequest(update) {
		store.logger.info(`🛎️`, `continuity`, continuityKey, `received`, update)
		const transactionKey = update.key
		const updateId = update.id
		const performanceKey = `tx-run:${transactionKey}:${updateId}`
		const performanceKeyStart = `${performanceKey}:start`
		const performanceKeyEnd = `${performanceKey}:end`
		performance.mark(performanceKeyStart)
		try {
			actUponStore(
				{ type: `transaction`, key: transactionKey },
				updateId,
				store,
			)(...update.params)
		} catch (thrown) {
			if (thrown instanceof Error) {
				store.logger.error(
					`❌`,
					`continuity`,
					continuityKey,
					`failed to run transaction ${transactionKey} from ${userKey} with update ${updateId}`,
					thrown.message,
				)
			}
		}
		performance.mark(performanceKeyEnd)
		const metric = performance.measure(
			performanceKey,
			performanceKeyStart,
			performanceKeyEnd,
		)
		store?.logger.info(
			`🚀`,
			`transaction`,
			transactionKey,
			updateId,
			userKey,
			metric.duration,
		)
	}
}
