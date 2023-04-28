import HAMT from "hamt_plus"

import type { KeyedStateUpdate, TransactionUpdate, Store } from "."
import { target, IMPLICIT, withdraw } from "."
import type { AtomToken, TimelineOptions, TimelineToken, ƒn } from ".."

export type Timeline = {
  key: string
  type: `timeline`
  next: () => void
  prev: () => void
}

export type TimelineAtomUpdate = KeyedStateUpdate<unknown> & {
  type: `atom_update`
}
export type TimelineSelectorUpdate = {
  key: string
  type: `selector_update`
  atomUpdates: TimelineAtomUpdate[]
}
export type TimelineTransactionUpdate = TransactionUpdate<ƒn> & {
  type: `transaction_update`
}

export type TimelineData = {
  at: number
  timeTraveling: boolean
  history: (
    | TimelineAtomUpdate
    | TimelineSelectorUpdate
    | TimelineTransactionUpdate
  )[]
  selectorTime: number | null
  transactionKey: string | null
}

export function timeline__INTERNAL(
  options: TimelineOptions,
  store: Store = IMPLICIT.STORE
): TimelineToken {
  const timelineData: TimelineData = {
    at: 0,
    timeTraveling: false,
    history: [],
    selectorTime: null,
    transactionKey: null,
  }

  const subscribeToAtom = (token: AtomToken<any>) => {
    const state = withdraw(token, store)
    state.subject.subscribe((update) => {
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
        `⏳ timeline "${options.key}" saw atom "${token.key}" go (`,
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
        if (timelineData.transactionKey !== storeCurrentTransactionKey) {
          if (timelineData.transactionKey) {
            store.config.logger?.error(
              `Timeline "${options.key}" was unable to resolve transaction "${timelineData.transactionKey}. This is probably a bug.`
            )
          }
          timelineData.transactionKey = storeCurrentTransactionKey
          const subscription = currentTransaction.subject.subscribe((update) => {
            if (timelineData.timeTraveling === false) {
              if (timelineData.at !== timelineData.history.length) {
                timelineData.history.splice(timelineData.at)
              }
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
            timelineData.transactionKey = null
            store.config.logger?.info(
              `⌛ timeline "${options.key}" got a transaction_update "${update.key}"`
            )
          })
        }
      } else if (storeCurrentSelectorKey) {
        if (timelineData.timeTraveling === false) {
          if (storeCurrentSelectorTime !== timelineData.selectorTime) {
            const newSelectorUpdate: TimelineSelectorUpdate = {
              type: `selector_update`,
              key: storeCurrentSelectorKey,
              atomUpdates: [],
            }
            newSelectorUpdate.atomUpdates.push({
              key: token.key,
              type: `atom_update`,
              ...update,
            })
            if (timelineData.at !== timelineData.history.length) {
              timelineData.history.splice(timelineData.at)
            }
            timelineData.history.push(newSelectorUpdate)

            store.config.logger?.info(
              `⌛ timeline "${options.key}" got a selector_update "${storeCurrentSelectorKey}" with`,
              newSelectorUpdate.atomUpdates.map((atomUpdate) => atomUpdate.key)
            )
            timelineData.at = timelineData.history.length
            timelineData.selectorTime = storeCurrentSelectorTime
          } else {
            const latestUpdate = timelineData.history.at(-1)
            if (latestUpdate?.type === `selector_update`) {
              latestUpdate.atomUpdates.push({
                key: token.key,
                type: `atom_update`,
                ...update,
              })
              store.config.logger?.info(
                `   ⌛ timeline "${options.key}" set selector_update "${storeCurrentSelectorKey}" to`,
                latestUpdate?.atomUpdates.map((atomUpdate) => atomUpdate.key)
              )
            }
          }
        }
      } else {
        if (timelineData.timeTraveling === false) {
          timelineData.selectorTime = null
          if (timelineData.at !== timelineData.history.length) {
            timelineData.history.splice(timelineData.at)
          }
          timelineData.history.push({
            type: `atom_update`,
            key: token.key,
            oldValue: update.oldValue,
            newValue: update.newValue,
          })
          store.config.logger?.info(
            `⌛ timeline "${options.key}" got a state_update to "${token.key}"`
          )
          timelineData.at = timelineData.history.length
        }
      }
    })
  }
  const core = target(store)
  for (const tokenOrFamily of options.atoms) {
    const timelineKey = core.timelineAtoms.getRelatedId(tokenOrFamily.key)
    if (timelineKey) {
      store.config.logger?.error(
        `❌ Failed to add atom "${tokenOrFamily.key}" to timeline "${options.key}" because it belongs to timeline "${timelineKey}"`
      )
      continue
    }
    if (tokenOrFamily.type === `atom_family`) {
      const family = tokenOrFamily
      family.subject.subscribe((token) => subscribeToAtom(token))
    } else {
      const token = tokenOrFamily
      if (`family` in token && token.family) {
        const familyTimelineKey = core.timelineAtoms.getRelatedId(
          token.family.key
        )
        if (familyTimelineKey) {
          store.config.logger?.error(
            `❌ Failed to add atom "${token.key}" to timeline "${options.key}" because its family "${token.family.key}" belongs to timeline "${familyTimelineKey}"`
          )
          continue
        }
      }
      subscribeToAtom(token)
    }
    core.timelineAtoms = core.timelineAtoms.set(tokenOrFamily.key, options.key)
  }

  store.timelineStore = HAMT.set(options.key, timelineData, store.timelineStore)
  const token: TimelineToken = {
    key: options.key,
    type: `timeline`,
  }
  store.subject.timelineCreation.next(token)
  return token
}
