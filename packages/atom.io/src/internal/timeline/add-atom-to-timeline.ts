import { IMPLICIT, withdraw } from ".."
import type { TimelineSelectorUpdate, Timeline, Store } from ".."
import type { AtomFamily, AtomToken } from "../.."

export const addAtomToTimeline = (
  atomToken: AtomToken<any>,
  atoms: (AtomFamily<any> | AtomToken<any>)[],
  tl: Timeline,
  store: Store = IMPLICIT.STORE
): void => {
  const atom = withdraw(atomToken, store)
  if (atom === null) {
    throw new Error(
      `Cannot subscribe to atom "${atomToken.key}" because it has not been initialized in store "${store.config.name}"`
    )
  }
  atom.subject.subscribe((update) => {
    const storeCurrentSelectorKey =
      store.operation.open && store.operation.token.type === `selector`
        ? store.operation.token.key
        : null
    const storeCurrentSelectorTime =
      store.operation.open && store.operation.token.type === `selector`
        ? store.operation.time
        : null

    const storeCurrentTransactionKey =
      store.transactionStatus.phase === `applying`
        ? store.transactionStatus.key
        : null
    store.config.logger?.info(
      `⏳ timeline "${tl.key}" saw atom "${atomToken.key}" go (`,
      update.oldValue,
      `->`,
      update.newValue,
      storeCurrentTransactionKey
        ? `) in transaction "${storeCurrentTransactionKey}"`
        : storeCurrentSelectorKey
        ? `) in selector "${storeCurrentSelectorKey}"`
        : `)`
    )

    if (
      storeCurrentTransactionKey &&
      store.transactionStatus.phase === `applying`
    ) {
      const currentTransaction = withdraw(
        { key: storeCurrentTransactionKey, type: `transaction` },
        store
      )
      if (currentTransaction === null) {
        throw new Error(
          `Transaction "${storeCurrentTransactionKey}" not found in store "${store.config.name}". This is surprising, because we are in the application phase of "${storeCurrentTransactionKey}".`
        )
      }
      if (tl.transactionKey !== storeCurrentTransactionKey) {
        if (tl.transactionKey) {
          store.config.logger?.error(
            `Timeline "${tl.key}" was unable to resolve transaction "${tl.transactionKey}. This is probably a bug.`
          )
        }
        tl.transactionKey = storeCurrentTransactionKey
        const subscription = currentTransaction.subject.subscribe((update) => {
          if (tl.timeTraveling === false) {
            if (tl.at !== tl.history.length) {
              tl.history.splice(tl.at)
            }
            tl.history.push({
              type: `transaction_update`,
              ...update,
              atomUpdates: update.atomUpdates.filter((atomUpdate) =>
                atoms.some((atom) => atom.key === atomUpdate.key)
              ),
            })
          }
          tl.at = tl.history.length
          subscription.unsubscribe()
          tl.transactionKey = null
          store.config.logger?.info(
            `⌛ timeline "${tl.key}" got a transaction_update "${update.key}"`
          )
        })
      }
    } else if (storeCurrentSelectorKey) {
      if (tl.timeTraveling === false) {
        if (storeCurrentSelectorTime !== tl.selectorTime) {
          const newSelectorUpdate: TimelineSelectorUpdate = {
            type: `selector_update`,
            key: storeCurrentSelectorKey,
            atomUpdates: [],
          }
          newSelectorUpdate.atomUpdates.push({
            key: atom.key,
            type: `atom_update`,
            ...update,
          })
          if (tl.at !== tl.history.length) {
            tl.history.splice(tl.at)
          }
          tl.history.push(newSelectorUpdate)

          store.config.logger?.info(
            `⌛ timeline "${tl.key}" got a selector_update "${storeCurrentSelectorKey}" with`,
            newSelectorUpdate.atomUpdates.map((atomUpdate) => atomUpdate.key)
          )
          tl.at = tl.history.length
          tl.selectorTime = storeCurrentSelectorTime
        } else {
          const latestUpdate = tl.history.at(-1)
          if (latestUpdate?.type === `selector_update`) {
            latestUpdate.atomUpdates.push({
              key: atom.key,
              type: `atom_update`,
              ...update,
            })
            store.config.logger?.info(
              `   ⌛ timeline "${tl.key}" set selector_update "${storeCurrentSelectorKey}" to`,
              latestUpdate?.atomUpdates.map((atomUpdate) => atomUpdate.key)
            )
          }
        }
      }
    } else {
      if (tl.timeTraveling === false) {
        tl.selectorTime = null
        if (tl.at !== tl.history.length) {
          tl.history.splice(tl.at)
        }
        tl.history.push({
          type: `atom_update`,
          key: atom.key,
          oldValue: update.oldValue,
          newValue: update.newValue,
        })
        store.config.logger?.info(
          `⌛ timeline "${tl.key}" got a state_update to "${atom.key}"`
        )
        tl.at = tl.history.length
      }
    }
  })
}
