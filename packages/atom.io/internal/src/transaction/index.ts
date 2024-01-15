import type { TransactionUpdate, TransactorsWithRunAndEnv, ƒn } from "atom.io"

export * from "./abort-transaction"
export * from "./apply-transaction"
export * from "./build-transaction"
export * from "./create-transaction"

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = (typeof TRANSACTION_PHASES)[number]

export type TransactionProgress<ƒ extends ƒn> = {
	phase: `applying` | `building`
	update: TransactionUpdate<ƒ>
	transactors: TransactorsWithRunAndEnv
}

export type TransactionEpoch = { epoch: number }
