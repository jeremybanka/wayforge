import type { ƒn } from "~/packages/anvl/src/function"

import type { StoreCore } from ".."
import type { StateUpdate, TransactionUpdate } from "../.."

export * from "./abort-transaction"
export * from "./apply-transaction"
export * from "./build-transaction"
export * from "./redo-transaction-update"
export * from "./undo-transaction-update"

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = (typeof TRANSACTION_PHASES)[number]

export type KeyedStateUpdate<T> = StateUpdate<T> & {
  key: string
}

export type TransactionUpdateInProgress<ƒ extends ƒn> = TransactionUpdate<ƒ> & {
  phase: `applying` | `building`
  core: StoreCore
}
export type TransactionIdle = {
  phase: `idle`
}
export type TransactionStatus<ƒ extends ƒn> =
  | TransactionIdle
  | TransactionUpdateInProgress<ƒ>
