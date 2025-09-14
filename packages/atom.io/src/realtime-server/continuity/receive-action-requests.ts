import type { TransactionOutcomeEvent, TransactionToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { actUponStore } from "atom.io/internal"
import type { Json, JsonIO } from "atom.io/json"
import type { ContinuityToken, Socket } from "atom.io/realtime"
import { employSocket } from "atom.io/realtime"

export function receiveActionRequests(
	store: Store,
	socket: Socket,
	continuity: ContinuityToken,
	userKey: string,
): () => void {
	const continuityKey = continuity.key

	return employSocket(
		socket,
		`tx-run:${continuityKey}`,
		function serveTransactionRequest(
			txOutcome: Json.Serializable &
				Pick<
					TransactionOutcomeEvent<TransactionToken<JsonIO>>,
					`id` | `params` | `token`
				>,
		) {
			store.logger.info(`🛎️`, `continuity`, continuityKey, `received`, txOutcome)
			const transactionKey = txOutcome.token.key
			const updateId = txOutcome.id
			const performanceKey = `tx-run:${transactionKey}:${updateId}`
			const performanceKeyStart = `${performanceKey}:start`
			const performanceKeyEnd = `${performanceKey}:end`
			performance.mark(performanceKeyStart)
			try {
				actUponStore(
					store,
					{ type: `transaction`, key: transactionKey },
					updateId,
				)(...txOutcome.params)
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
			store.logger.info(
				`🚀`,
				`transaction`,
				transactionKey,
				updateId,
				userKey,
				metric.duration,
			)
		},
	)
}
