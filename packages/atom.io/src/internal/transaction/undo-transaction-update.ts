import type { ƒn } from "~/packages/anvl/src/function"

import type { Store, TransactionUpdate } from ".."
import { withdraw } from ".."
import type { AtomToken } from "../.."
import { setState } from "../.."

export const undoTransactionUpdate = <ƒ extends ƒn>(
  update: TransactionUpdate<ƒ>,
  store: Store
): void => {
  store.config.logger?.info(` ⏮ undo transaction "${update.key}" (undo)`)
  for (const { key, oldValue } of update.atomUpdates) {
    const token: AtomToken<unknown> = { key, type: `atom` }
    const state = withdraw(token, store)
    if (state === null) {
      throw new Error(
        `State "${token.key}" not found in this store. This is surprising, because we are navigating the history of the store.`
      )
    }
    setState(state, oldValue, store)
  }
}
