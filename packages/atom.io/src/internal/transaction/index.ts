import type { StoreCore } from ".."
import type { TransactionUpdate, ƒn } from "../.."

export * from "./transaction-internal"

export * from "./abort-transaction"
export * from "./apply-transaction"
export * from "./build-transaction"
export * from "./redo-transaction"
export * from "./undo-transaction"

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = typeof TRANSACTION_PHASES[number]

export type TransactionUpdateInProgress<ƒ extends ƒn> = TransactionUpdate<ƒ> & {
	phase: `applying` | `building`
	time: number
	core: StoreCore
}
export type TransactionIdle = {
	phase: `idle`
}
export type TransactionStatus<ƒ extends ƒn> =
	| TransactionIdle
	| TransactionUpdateInProgress<ƒ>
