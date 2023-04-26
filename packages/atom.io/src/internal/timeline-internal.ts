import HAMT from "hamt_plus"

import type { KeyedStateUpdate, TransactionUpdate, Store } from "."
import { target, IMPLICIT, withdraw } from "."
import { setState } from ".."
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
}

export function timeline__INTERNAL(
  options: TimelineOptions,
  store: Store = IMPLICIT.STORE
): TimelineToken {
  let incompleteSelectorTime: number | null = null
  let selectorAtomUpdates: TimelineAtomUpdate[] = []
  let incompleteTransactionKey: string | null = null
  const timelineData: TimelineData = {
    at: 0,
    timeTraveling: false,
    history: [],
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
              `⌛ timeline "${options.key}" got a transaction_update "${update.key}"`
            )
          })
        }
      } else if (storeCurrentSelectorKey) {
        if (timelineData.timeTraveling === false) {
          if (storeCurrentSelectorTime !== incompleteSelectorTime) {
            if (incompleteSelectorTime) {
              timelineData.history.push({
                type: `selector_update`,
                key: storeCurrentSelectorKey,
                atomUpdates: selectorAtomUpdates,
              })
            }
            store.config.logger?.info(
              `⌛ timeline "${options.key}" got a selector_update "${storeCurrentSelectorKey}" with`,
              selectorAtomUpdates.map((atomUpdate) => atomUpdate.key)
            )
            timelineData.at = timelineData.history.length
            selectorAtomUpdates = []
            incompleteSelectorTime = storeCurrentSelectorTime
          }
          selectorAtomUpdates.push({
            key: token.key,
            type: `atom_update`,
            ...update,
          })
        }
      } else {
        if (timelineData.timeTraveling === false) {
          selectorAtomUpdates = []
          incompleteSelectorTime = null
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
        `❌ failed to add atom "${tokenOrFamily.key}" to timeline "${options.key}" because it belongs to timeline "${timelineKey}"`
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
            `❌ failed to add atom "${token.key}" to timeline "${options.key}" because its family "${token.family.key}" belongs to timeline "${familyTimelineKey}"`
          )
          continue
        }
      }
      subscribeToAtom(token)
    }
    core.timelineAtoms = core.timelineAtoms.set(tokenOrFamily.key, options.key)
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
  store.config.logger?.info(`⏩ redo on "${token.key}"`)
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
    case `atom_update`: {
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
  store.config.logger?.info(`⏮️  undo on "${token.key}"`)
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
    case `atom_update`: {
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
