import type { TransactionUpdate, ƒn } from "atom.io"

export * from "./abort-transaction"
export * from "./apply-transaction"
export * from "./build-transaction"
export * from "./create-transaction"
export * from "./redo-transaction"
export * from "./undo-transaction"

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = (typeof TRANSACTION_PHASES)[number]

export type TransactionMeta<ƒ extends ƒn> = {
	phase: `applying` | `building`
	time: number
	update: TransactionUpdate<ƒ>
}
