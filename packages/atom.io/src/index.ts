import {
  IMPLICIT,
  configure,
  finishAction,
  getState__INTERNAL,
  setState__INTERNAL,
  isAtomDefault,
  isSelectorDefault,
  startAction,
  subscribeToRootAtoms,
  withdraw,
} from "./internal"
import * as __INTERNAL__ from "./internal"
import type { Store } from "./internal/store"

export * from "./atom"
export * from "./selector"
export * from "./transaction"
export { __INTERNAL__, configure }
export type { Serializable } from "~/packages/anvl/json"

export type AtomToken<_> = {
  key: string
  type: `atom`
  family?: FamilyMetadata
}
export type SelectorToken<_> = {
  key: string
  type: `selector`
  family?: FamilyMetadata
}
export type StateToken<T> = AtomToken<T> | SelectorToken<T>

export type ReadonlyValueToken<_> = {
  key: string
  type: `readonly_selector`
  family?: FamilyMetadata
}

export type FamilyMetadata = {
  key: string
  subKey: string
}

export const getState = <T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store = IMPLICIT.STORE
): T => {
  const state = withdraw<T>(token, store)
  return getState__INTERNAL(state, store)
}

export const setState = <T, New extends T>(
  token: StateToken<T>,
  value: New | ((oldValue: T) => New),
  store: Store = IMPLICIT.STORE
): void => {
  startAction(store)
  const state = withdraw(token, store)
  setState__INTERNAL(state, value, store)
  finishAction(store)
}

export const isDefault = (
  token: ReadonlyValueToken<unknown> | StateToken<unknown>,
  store: Store = IMPLICIT.STORE
): boolean =>
  token.type === `atom`
    ? isAtomDefault(token.key, store)
    : isSelectorDefault(token.key, store)

export type ObserveState<T> = (change: { newValue: T; oldValue: T }) => void

export const subscribe = <T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  observe: ObserveState<T>,
  store: Store = IMPLICIT.STORE
): (() => void) => {
  const state = withdraw<T>(token, store)
  const subscription = state.subject.subscribe(observe)
  store.config.logger?.info(`👀 subscribe to "${state.key}"`)
  const dependencySubscriptions =
    `get` in state ? subscribeToRootAtoms(state, store) : null
  const unsubscribe =
    dependencySubscriptions === null
      ? () => {
          store.config.logger?.info(`🙈 unsubscribe from "${state.key}"`)
          subscription.unsubscribe()
        }
      : () => {
          store.config.logger?.info(
            `🙈 unsubscribe from "${state.key}" and its dependencies`
          )
          subscription.unsubscribe()
          for (const dependencySubscription of dependencySubscriptions) {
            dependencySubscription.unsubscribe()
          }
        }

  return unsubscribe
}
