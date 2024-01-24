import type { TransactionUpdate, TransactorsWithRunAndEnv, ƒn } from "atom.io"
import type { Junction } from "rel8/junction"

export * from "./abort-transaction"
export * from "./act-upon-store"
export * from "./apply-transaction"
export * from "./assign-transaction-to-continuity"
export * from "./build-transaction"
export * from "./create-transaction"
export * from "./get-epoch-number"
export * from "./set-epoch-number"

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = (typeof TRANSACTION_PHASES)[number]

export type TransactionProgress<ƒ extends ƒn> = {
	phase: `applying` | `building`
	update: TransactionUpdate<ƒ>
	transactors: TransactorsWithRunAndEnv
}

export type TransactionEpoch = {
	epoch: Map<string, number>
	epochActions: Junction<`epoch`, `action`>
}
