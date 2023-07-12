import HAMT from "hamt_plus"

import type { ƒn } from "~/packages/anvl/src/function"

import type { KeyedStateUpdate, TransactionUpdate, Store } from "."
import { target, IMPLICIT, withdraw } from "."
import type { AtomToken, TimelineOptions, TimelineToken } from ".."

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

export type Timeline = {
  at: number
  timeTraveling: boolean
  history: (
    | TimelineAtomUpdate
    | TimelineSelectorUpdate
    | TimelineTransactionUpdate
  )[]
  selectorTime: number | null
  transactionKey: string | null
  install: (store: Store) => void
}

export function timeline__INTERNAL(
  options: TimelineOptions,
  store: Store = IMPLICIT.STORE,
  data: Timeline | null = null
): TimelineToken {
  const tl: Timeline = {
    at: 0,
    timeTraveling: false,
    selectorTime: null,
    transactionKey: null,
    ...data,
    history: data?.history.map((update) => ({ ...update })) ?? [],
    install: (store) => timeline__INTERNAL(options, store, tl),
  }

  const subscribeToAtom = (token: AtomToken<any>) => {
    const state = withdraw(token, store)
    if (state === null) {
      throw new Error(
        `Cannot subscribe to atom "${token.key}" because it has not been initialized in store "${store.config.name}"`
      )
    }
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
        if (currentTransaction === null) {
          throw new Error(
            `Transaction "${storeCurrentTransactionKey}" not found in store "${store.config.name}". This is surprising, because we are in the application phase of "${storeCurrentTransactionKey}".`
          )
        }
        if (tl.transactionKey !== storeCurrentTransactionKey) {
          if (tl.transactionKey) {
            store.config.logger?.error(
              `Timeline "${options.key}" was unable to resolve transaction "${tl.transactionKey}. This is probably a bug.`
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
                  options.atoms.some((atom) => atom.key === atomUpdate.key)
                ),
              })
            }
            tl.at = tl.history.length
            subscription.unsubscribe()
            tl.transactionKey = null
            store.config.logger?.info(
              `⌛ timeline "${options.key}" got a transaction_update "${update.key}"`
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
              key: token.key,
              type: `atom_update`,
              ...update,
            })
            if (tl.at !== tl.history.length) {
              tl.history.splice(tl.at)
            }
            tl.history.push(newSelectorUpdate)

            store.config.logger?.info(
              `⌛ timeline "${options.key}" got a selector_update "${storeCurrentSelectorKey}" with`,
              newSelectorUpdate.atomUpdates.map((atomUpdate) => atomUpdate.key)
            )
            tl.at = tl.history.length
            tl.selectorTime = storeCurrentSelectorTime
          } else {
            const latestUpdate = tl.history.at(-1)
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
        if (tl.timeTraveling === false) {
          tl.selectorTime = null
          if (tl.at !== tl.history.length) {
            tl.history.splice(tl.at)
          }
          tl.history.push({
            type: `atom_update`,
            key: token.key,
            oldValue: update.oldValue,
            newValue: update.newValue,
          })
          store.config.logger?.info(
            `⌛ timeline "${options.key}" got a state_update to "${token.key}"`
          )
          tl.at = tl.history.length
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
    core.timelineAtoms = core.timelineAtoms.set({
      atomKey: tokenOrFamily.key,
      timelineKey: options.key,
    })
  }

  store.timelines = HAMT.set(options.key, tl, store.timelines)
  const token: TimelineToken = {
    key: options.key,
    type: `timeline`,
  }
  store.subject.timelineCreation.next(token)
  return token
}
