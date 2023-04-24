import HAMT from "hamt_plus"

import type { KeyedStateUpdate, TransactionUpdate, Store } from "."
import { IMPLICIT, withdraw } from "."
import { setState } from ".."
import type { AtomToken, TimelineOptions, TimelineToken, ƒn } from ".."

export type Timeline = {
  key: string
  type: `timeline`
  next: () => void
  prev: () => void
}

export type TimelineStateUpdate = KeyedStateUpdate<unknown> & {
  type: `state_update`
}
export type TimelineTransactionUpdate = TransactionUpdate<ƒn> & {
  type: `transaction_update`
}

export type TimelineData = {
  at: number
  timeTraveling: boolean
  history: (TimelineStateUpdate | TimelineTransactionUpdate)[]
}

export function timeline__INTERNAL(
  options: TimelineOptions,
  store: Store = IMPLICIT.STORE
): TimelineToken {
  let incompleteTransactionKey: string | null = null
  const timelineData: TimelineData = {
    at: 0,
    timeTraveling: false,
    history: [],
  }

  const subscribeToAtom = (token: AtomToken<any>) => {
    const state = withdraw(token, store)
    state.subject.subscribe((update) => {
      const storeCurrentTransactionKey =
        store.transactionStatus.phase === `applying`
          ? store.transactionStatus.key
          : null
      store.config.logger?.info(
        `⏳ timeline "${options.key}" saw atom "${token.key}" go (`,
        update.oldValue,
        `->`,
        update.newValue,
        storeCurrentTransactionKey
          ? `) in "${storeCurrentTransactionKey}"`
          : `) independently`
      )

      if (
        storeCurrentTransactionKey &&
        store.transactionStatus.phase === `applying`
      ) {
        const currentTransaction = withdraw(
          { key: storeCurrentTransactionKey, type: `transaction` },
          store
        )
        if (incompleteTransactionKey !== storeCurrentTransactionKey) {
          if (incompleteTransactionKey) {
            store.config.logger?.error(
              `Timeline "${options.key}" was unable to resolve transaction "${incompleteTransactionKey}. This is probably a bug.`
            )
          }
          incompleteTransactionKey = storeCurrentTransactionKey
          const subscription = currentTransaction.subject.subscribe((update) => {
            if (timelineData.timeTraveling === false) {
              timelineData.history.push({
                type: `transaction_update`,
                ...update,
                atomUpdates: update.atomUpdates.filter((atomUpdate) =>
                  options.atoms.some((atom) => atom.key === atomUpdate.key)
                ),
              })
            }
            timelineData.at = timelineData.history.length
            subscription.unsubscribe()
            incompleteTransactionKey = null
            store.config.logger?.info(
              `⌛ timeline "${options.key}" pushed a transaction_update from "${update.key}"`
            )
          })
        }
      } else {
        if (timelineData.timeTraveling === false) {
          timelineData.history.push({
            type: `state_update`,
            key: token.key,
            oldValue: update.oldValue,
            newValue: update.newValue,
          })
          store.config.logger?.info(
            `⌛ timeline "${options.key}" pushed a state_update to "${token.key}"`
          )
          timelineData.at = timelineData.history.length
        }
      }
    })
  }

  for (const tokenOrFamily of options.atoms) {
    if (tokenOrFamily.type === `atom_family`) {
      const family = tokenOrFamily
      family.subject.subscribe((token) => subscribeToAtom(token))
    } else {
      const token = tokenOrFamily
      subscribeToAtom(token)
    }
  }

  store.timelineStore = HAMT.set(options.key, timelineData, store.timelineStore)

  return {
    key: options.key,
    type: `timeline`,
  }
}

export const redo__INTERNAL = (
  token: TimelineToken,
  store: Store = IMPLICIT.STORE
): void => {
  const timelineData = store.timelineStore.get(token.key)
  if (!timelineData) {
    store.config.logger?.error(
      `Tried to redo on timeline "${token.key}" has not been initialized.`
    )
    return
  }
  if (timelineData.at === timelineData.history.length) {
    store.config.logger?.warn(
      `Tried to redo on timeline "${token.key}" but there is nothing to redo.`
    )
    return
  }
  timelineData.timeTraveling = true
  const update = timelineData.history[timelineData.at]
  switch (update.type) {
    case `state_update`: {
      const { key, newValue } = update
      setState({ key, type: `atom` }, newValue)
      break
    }
    case `transaction_update`: {
      for (const atomUpdate of update.atomUpdates) {
        const { key, newValue } = atomUpdate
        setState({ key, type: `atom` }, newValue)
      }
      break
    }
  }
  ++timelineData.at
  timelineData.timeTraveling = false
}

export const undo__INTERNAL = (
  token: TimelineToken,
  store: Store = IMPLICIT.STORE
): void => {
  const timelineData = store.timelineStore.get(token.key)
  if (!timelineData) {
    store.config.logger?.error(
      `Tried to undo on timeline "${token.key}" has not been initialized.`
    )
    return
  }
  if (timelineData.at === 0) {
    store.config.logger?.warn(
      `Tried to undo on timeline "${token.key}" but there is nothing to undo.`
    )
    return
  }
  timelineData.timeTraveling = true
  --timelineData.at
  const update = timelineData.history[timelineData.at]
  switch (update.type) {
    case `state_update`: {
      const { key, oldValue } = update
      setState({ key, type: `atom` }, oldValue)
      break
    }
    case `transaction_update`: {
      for (const atomUpdate of update.atomUpdates) {
        const { key, oldValue } = atomUpdate
        setState({ key, type: `atom` }, oldValue)
      }
      break
    }
  }
  timelineData.timeTraveling = false
}
