import * as AtomIO from "atom.io"
import type { TimelineTransactionUpdate } from "atom.io/internal"

import { Join } from "~/packages/anvl/src/join"

import type { ServerConfig } from "."

export type TransactionRequest = {
	key: string
	params: unknown[]
	transactionId: string
}

export const useExposeTimeline__UNSTABLE = ({
	socket,
	store,
}: ServerConfig): ((tl: AtomIO.TimelineToken) => () => void) => {
	const timestampsOfTransactionsState = AtomIO.__INTERNAL__.atom__INTERNAL(
		{
			key: `timestampsOfTransactions`,
			default: new Join<null, `transactionId`, `timestamp`>({
				relationType: `1:1`,
			})
				.from(`transactionId`)
				.to(`timestamp`),
		},
		undefined,
		store,
	)
	return function exposeTimeline(tl: AtomIO.TimelineToken): () => void {
		const handleTransactionRequest = (update: TransactionRequest) => {
			AtomIO.runTransaction(
				{ key: update.key, type: `transaction` },
				store,
			)(...update.params)
		}

		socket.on(`txr:${tl.key}`, handleTransactionRequest)

		const unsubscribeFromTimeline = AtomIO.subscribeToTimeline(
			tl,
			(update: TimelineTransactionUpdate) => {
				// const timestamp = update.timestamp.toString()
				// AtomIO.setState(
				//   timestampsOfTransactionsState,
				//   (j) => j.set(update),
				//   store
				// )
				if (update.type === `transaction_update`) {
					socket.emit(`tl:${tl.key}`, update)
				}
			},
		)

		return () => {
			socket.off(`tlu:${tl.key}`, handleTransactionRequest)
			unsubscribeFromTimeline()
		}
	}
}
