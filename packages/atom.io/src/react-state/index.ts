import type Preact from "preact/hooks"

import type React from "react"

import { subscribe, setState, __INTERNAL__ } from "atom.io"
import type { ReadonlySelectorToken, StateToken } from "atom.io"

import type { Modifier } from "~/packages/anvl/src/function"

export type AtomStoreReactConfig = {
  useState: typeof Preact.useState | typeof React.useState
  useEffect: typeof Preact.useEffect | typeof React.useEffect
  store?: __INTERNAL__.Store
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const composeStoreHooks = ({
  useState,
  useEffect,
  store = __INTERNAL__.IMPLICIT.STORE,
}: AtomStoreReactConfig) => {
  function useI<T>(token: StateToken<T>): (next: Modifier<T> | T) => void {
    const updateState = (next: Modifier<T> | T) => setState(token, next, store)
    return updateState
  }

  function useO<T>(token: ReadonlySelectorToken<T> | StateToken<T>): T {
    const state = __INTERNAL__.withdraw(token, store)
    const initialValue = __INTERNAL__.getState__INTERNAL(state, store)
    const [current, dispatch] = useState(initialValue)
    useEffect(() => {
      const unsubscribe = subscribe(
        token,
        ({ newValue, oldValue }) => {
          if (oldValue !== newValue) {
            dispatch(newValue)
          }
        },
        store
      )
      return unsubscribe
    }, [])

    return current
  }

  function useIO<T>(token: StateToken<T>): [T, (next: Modifier<T> | T) => void] {
    return [useO(token), useI(token)]
  }

  function useStore<T>(
    token: StateToken<T>
  ): [T, (next: Modifier<T> | T) => void]
  function useStore<T>(token: ReadonlySelectorToken<T>): T
  function useStore<T>(
    token: ReadonlySelectorToken<T> | StateToken<T>
  ): T | [T, (next: Modifier<T> | T) => void] {
    if (token.type === `readonly_selector`) {
      return useO(token)
    }
    return useIO(token)
  }
  return { useI, useO, useIO, useStore, useEffect, useState }
}
