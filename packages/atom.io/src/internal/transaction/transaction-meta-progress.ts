import type {
	ActorToolkit,
	TransactionOutcomeEvent,
	TransactionToken,
} from "atom.io"

import type { Junction } from "../junction"
import type { Fn } from "../utility-types"

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = (typeof TRANSACTION_PHASES)[number]

export type TransactionProgress<F extends Fn> = {
	phase: `applying` | `building`
	update: TransactionOutcomeEvent<TransactionToken<F>>
	toolkit: ActorToolkit
}

export type TransactionEpoch = {
	epoch: Map<string, number>
	actionContinuities: Junction<`continuity`, string, `action`, string>
}
