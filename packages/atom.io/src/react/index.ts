import type Preact from "preact/hooks"

import type React from "react"

import type { Modifier } from "~/packages/anvl/src/function"

import { composeSubjectHook } from "./useSubject"
import type { ReadonlyValueToken, StateToken } from ".."
import { setState, __INTERNAL__ } from ".."
import { withdraw } from "../internal"

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
  const { useSubject } = composeSubjectHook({ useState, useEffect })

  function useI<T>(token: StateToken<T>): (next: Modifier<T> | T) => void {
    const updateState = (next: Modifier<T> | T) => setState(token, next, store)
    return updateState
  }

  function useO<T>(token: ReadonlyValueToken<T> | StateToken<T>): T {
    const state = withdraw(token, store)
    const initialValue = __INTERNAL__.getState__INTERNAL(state, store)
    const [current] = useSubject<T>(state.subject, initialValue)
    return current
  }

  function useIO<T>(token: StateToken<T>): [T, (next: Modifier<T> | T) => void] {
    return [useO(token), useI(token)]
  }

  function useStore<T>(
    token: StateToken<T>
  ): [T, (next: Modifier<T> | T) => void]
  function useStore<T>(token: ReadonlyValueToken<T>): T
  function useStore<T>(
    token: ReadonlyValueToken<T> | StateToken<T>
  ): T | [T, (next: Modifier<T> | T) => void] {
    if (token.type === `readonly_selector`) {
      return useO(token)
    }
    return useIO(token)
  }
  return { useI, useO, useIO, useStore, useSubject }
}
