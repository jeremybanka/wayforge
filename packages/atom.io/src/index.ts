import {
  IMPLICIT,
  configure,
  finishAction,
  getState__INTERNAL,
  setState__INTERNAL,
  startAction,
  withdraw,
} from "./internal"
import * as __INTERNAL__ from "./internal"
import type { Store } from "./internal/store"

export * from "./atom"
export * from "./selector"
export * from "./transaction"
export { __INTERNAL__, configure }

export type AtomToken<_> = {
  key: string
  type: `atom`
}
export type SelectorToken<_> = {
  key: string
  type: `selector`
}
export type StateToken<T> = AtomToken<T> | SelectorToken<T>

export type ReadonlyValueToken<_> = {
  key: string
  type: `readonly_selector`
}

export const getState = <T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store = IMPLICIT.STORE
): T => {
  const state = withdraw<T>(token, store)
  return getState__INTERNAL(state, store)
}

export const setState = <T, New extends T>(
  state: StateToken<T>,
  value: New | ((oldValue: T) => New),
  store: Store = IMPLICIT.STORE
): void => {
  startAction(store)
  setState__INTERNAL(state, value, store)
  finishAction(store)
}

export type Observe<T> = (change: { newValue: T; oldValue: T }) => void

export const subscribe = <T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  observe: Observe<T>,
  store: Store = IMPLICIT.STORE
): (() => void) => {
  const state = withdraw<T>(token, store)
  const subscription = state.subject.subscribe(observe)
  return () => subscription.unsubscribe()
}
