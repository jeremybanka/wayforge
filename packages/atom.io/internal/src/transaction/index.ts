import type { ActorToolkit, TransactionUpdate } from "atom.io"

import type { Junction } from "../junction"
import type { Func } from "../utility-types"

export * from "./abort-transaction"
export * from "./act-upon-store"
export * from "./apply-transaction"
export * from "./assign-transaction-to-continuity"
export * from "./build-transaction"
export * from "./create-transaction"
export * from "./get-epoch-number"
export * from "./is-root-store"
export * from "./set-epoch-number"

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = (typeof TRANSACTION_PHASES)[number]

export type TransactionProgress<F extends Func> = {
	phase: `applying` | `building`
	update: TransactionUpdate<F>
	toolkit: ActorToolkit
}

export type TransactionEpoch = {
	epoch: Map<string, number>
	actionContinuities: Junction<`continuity`, `action`>
}
