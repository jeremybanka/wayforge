import * as React from "react"

import * as AtomIO from "atom.io"

import type { Modifier } from "~/packages/anvl/src/function"

import { storeContext } from "./context"

export * from "./context"

export type StoreHooks = {
  useI: <T>(token: AtomIO.StateToken<T>) => (next: Modifier<T> | T) => void
  useO: <T>(token: AtomIO.ReadonlySelectorToken<T> | AtomIO.StateToken<T>) => T
  useIO: <T>(token: AtomIO.StateToken<T>) => [T, (next: Modifier<T> | T) => void]
}

export const composeStoreHooks = (): StoreHooks => {
  function useI<T>(
    token: AtomIO.StateToken<T>
  ): (next: Modifier<T> | T) => void {
    const store = React.useContext(storeContext)
    const update = (next: Modifier<T> | T) => AtomIO.setState(token, next, store)
    return update
  }

  function useO<T>(
    token: AtomIO.ReadonlySelectorToken<T> | AtomIO.StateToken<T>
  ): T {
    const store = React.useContext(storeContext)
    return React.useSyncExternalStore<T>(
      (observe) => AtomIO.subscribe(token, observe, store),
      () => AtomIO.getState(token, store)
    )
  }

  function useIO<T>(
    token: AtomIO.StateToken<T>
  ): [T, (next: Modifier<T> | T) => void] {
    return [useO(token), useI(token)]
  }

  return { useI, useO, useIO }
}

export const { useI, useO, useIO } = composeStoreHooks()

export function useStore<T>(
  token: AtomIO.StateToken<T>
): [T, (next: Modifier<T> | T) => void]
export function useStore<T>(token: AtomIO.ReadonlySelectorToken<T>): T
export function useStore<T>(
  token: AtomIO.ReadonlySelectorToken<T> | AtomIO.StateToken<T>
): T | [T, (next: Modifier<T> | T) => void] {
  return token.type === `readonly_selector` ? useO(token) : useIO(token)
}
