import HAMT from "hamt_plus"

import type { ƒn } from "~/packages/anvl/src/function"

import type { Store } from ".."
import { withdraw } from ".."
import type { AtomToken } from "../.."
import { setState } from "../.."

export const applyTransaction = <ƒ extends ƒn>(
  output: ReturnType<ƒ>,
  store: Store
): void => {
  if (store.transactionStatus.phase !== `building`) {
    store.config.logger?.warn(
      `abortTransaction called outside of a transaction. This is probably a bug.`
    )
    return
  }
  store.config.logger?.info(
    `🛃 apply transaction "${store.transactionStatus.key}"`
  )
  store.transactionStatus.phase = `applying`
  store.transactionStatus.output = output
  const { atomUpdates } = store.transactionStatus

  for (const { key, newValue } of atomUpdates) {
    const token: AtomToken<unknown> = { key, type: `atom` }
    if (!HAMT.has(token.key, store.valueMap)) {
      const newAtom = HAMT.get(token.key, store.transactionStatus.core.atoms)
      store.atoms = HAMT.set(newAtom.key, newAtom, store.atoms)
      store.valueMap = HAMT.set(newAtom.key, newAtom.default, store.valueMap)
      store.config.logger?.info(`🔧`, `add atom "${newAtom.key}"`)
    }
    setState(token, newValue, store)
  }
  const myTransaction = withdraw<ƒ>(
    { key: store.transactionStatus.key, type: `transaction` },
    store
  )
  if (myTransaction === null) {
    throw new Error(
      `Transaction "${store.transactionStatus.key}" not found. Absurd. How is this running?`
    )
  }
  myTransaction.subject.next({
    key: store.transactionStatus.key,
    atomUpdates,
    output,
    params: store.transactionStatus.params as Parameters<ƒ>,
  })
  store.transactionStatus = { phase: `idle` }
  store.config.logger?.info(`🛬`, `transaction done`)
}
