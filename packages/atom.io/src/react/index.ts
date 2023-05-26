import { useSyncExternalStore } from "react"

import { subscribe, setState, __INTERNAL__, getState } from "atom.io"
import type { ReadonlySelectorToken, StateToken } from "atom.io"

import type { Modifier } from "~/packages/anvl/src/function"

export type StoreHooks = {
  useI: <T>(token: StateToken<T>) => (next: Modifier<T> | T) => void
  useO: <T>(token: ReadonlySelectorToken<T> | StateToken<T>) => T
  useIO: <T>(token: StateToken<T>) => [T, (next: Modifier<T> | T) => void]
}

export const composeStoreHooks = (
  store: __INTERNAL__.Store = __INTERNAL__.IMPLICIT.STORE
): StoreHooks => {
  function useI<T>(token: StateToken<T>): (next: Modifier<T> | T) => void {
    const updateState = (next: Modifier<T> | T) => setState(token, next, store)
    return updateState
  }

  function useO<T>(token: ReadonlySelectorToken<T> | StateToken<T>): T {
    return useSyncExternalStore<T>(
      (observe) => subscribe(token, observe, store),
      () => getState(token, store)
    )
  }

  function useIO<T>(token: StateToken<T>): [T, (next: Modifier<T> | T) => void] {
    return [useO(token), useI(token)]
  }

  return { useI, useO, useIO }
}
