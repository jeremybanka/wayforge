import HAMT from "hamt_plus"
import type * as Rx from "rxjs"

import type { AtomFamily, AtomToken, ƒn } from "."
import type { Store, KeyedStateUpdate, TransactionUpdate } from "./internal"
import { target, IMPLICIT, withdraw } from "./internal"

export type TimelineToken = {
  key: string
  type: `timeline`
}

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
  history: (TimelineStateUpdate | TimelineTransactionUpdate)[]
}
export type TimelineOptions = {
  key: string
  atoms: (AtomFamily<any> | AtomToken<any>)[]
}

export const timeline = (options: TimelineOptions): TimelineToken => {
  return timeline__INTERNAL(options)
}

export function timeline__INTERNAL(
  options: TimelineOptions,
  store: Store = IMPLICIT.STORE
): TimelineToken {
  let incompleteTransactionKey: string | null = null
  const timelineData: TimelineData = {
    at: 0,
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
          ? `) in transaction "${storeCurrentTransactionKey}"`
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
            timelineData.history.push({
              type: `transaction_update`,
              ...update,
              atomUpdates: update.atomUpdates.filter((atomUpdate) =>
                options.atoms.some((atom) => atom.key === atomUpdate.key)
              ),
            })
            subscription.unsubscribe()
            incompleteTransactionKey = null
            store.config.logger?.info(
              `⌛ timeline "${options.key}" pushed a transaction_update from "${update.key}"`
            )
          })
        }
      } else {
        timelineData.history.push({
          type: `state_update`,
          key: token.key,
          oldValue: update.oldValue,
          newValue: update.newValue,
        })
        store.config.logger?.info(
          `⌛ timeline "${options.key}" pushed a state_update to "${token.key}"`
        )
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
