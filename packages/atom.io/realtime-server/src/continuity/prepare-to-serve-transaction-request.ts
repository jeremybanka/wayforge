import type {
	KeyedStateUpdate,
	MoleculeCreationModern,
	MoleculeDisposalModern,
	TransactionUpdate,
} from "atom.io"
import type { Store } from "atom.io/internal"
import { actUponStore } from "atom.io/internal"
import type { JsonIO } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

export type JsonTxUpdate = TransactionUpdate<JsonIO>
export type TransactionResponse = Pick<
	JsonTxUpdate,
	`epoch` | `id` | `key` | `type`
> & {
	updates: (
		| MoleculeCreationModern
		| MoleculeDisposalModern
		| Pick<KeyedStateUpdate<any>, `family` | `key` | `newValue` | `type`>
		| TransactionResponse
	)[]
}
export type TransactionRequest = Pick<JsonTxUpdate, `id` | `key` | `params`>

export function prepareToServeTransactionRequest(
	store: Store,
	continuity: ContinuityToken,
	userKey: string,
): (request: TransactionRequest) => void {
	const continuityKey = continuity.key
	return function serveTransactionRequest(request) {
		store.logger.info(
			`🛎️`,
			`continuity`,
			continuityKey,
			`transaction request`,
			request,
		)
		const transactionKey = request.key
		const requestId = request.id
		const performanceKey = `tx-run:${transactionKey}:${requestId}`
		const performanceKeyStart = `${performanceKey}:start`
		const performanceKeyEnd = `${performanceKey}:end`
		performance.mark(performanceKeyStart)
		try {
			actUponStore(
				{ type: `transaction`, key: transactionKey },
				requestId,
				store,
			)(...request.params)
		} catch (thrown) {
			if (thrown instanceof Error) {
				store.logger.error(
					`❌`,
					`continuity`,
					continuityKey,
					`failed to run transaction ${transactionKey} from ${userKey} from request ${requestId}`,
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
			requestId,
			userKey,
			metric.duration,
		)
	}
}
