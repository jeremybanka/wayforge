import { detokenize, getState__INTERNAL } from "./internal/get"
import { setState__INTERNAL } from "./internal/set"
import type { Store } from "./internal/store"
import { operationComplete, IMPLICIT } from "./internal/store"

export * from "./atom"
export * from "./selector"
export * from "./transact"

export interface AtomToken<_> {
  key: string
  type: `atom`
}
export interface SelectorToken<_> {
  key: string
  type: `selector`
}
export type StateToken<T> = AtomToken<T> | SelectorToken<T>

export interface ReadonlyValueToken<_> {
  key: string
  type: `readonly_selector`
}

export const getState = <T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store = IMPLICIT.STORE
): T => {
  const state = detokenize<T>(token, store)
  return getState__INTERNAL(state, store)
}

export const setState = <T>(
  state: StateToken<T>,
  value: T,
  store: Store = IMPLICIT.STORE
): void => {
  setState__INTERNAL(state, value, store)
  operationComplete(store)
}

export const subscribe = <T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  callback: (value: T) => void,
  store: Store = IMPLICIT.STORE
): (() => void) => {
  const state = detokenize<T>(token, store)
  const subscription = state.subject.subscribe(callback)
  return () => subscription.unsubscribe()
}
