import type React from "react"

import type { Modifier } from "~/packages/anvl/src/function"

import { composeSubjectHook } from "./useSubject"
import type { ReadonlyValueToken, StateToken } from ".."
import { setState, __INTERNAL__ } from ".."
import { withdraw } from "../internal"

export type AtomStoreReactConfig = {
  useState: typeof React.useState
  useEffect: typeof React.useEffect
  store?: __INTERNAL__.Store
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const composeStoreHook = ({
  useState,
  useEffect,
  store = __INTERNAL__.IMPLICIT.STORE,
}: AtomStoreReactConfig) => {
  const useSubject = composeSubjectHook(useState, useEffect)

  function useStore<T>(
    token: StateToken<T>
  ): [T, (next: Modifier<T> | T) => void]
  function useStore<T>(token: ReadonlyValueToken<T>): T
  function useStore<T>(
    token: ReadonlyValueToken<T> | StateToken<T>
  ): T | [T, (next: Modifier<T> | T) => void] {
    const { type } = token
    const state = withdraw(token, store)
    const initialValue = __INTERNAL__.getState__INTERNAL(state, store)
    const [value] = useSubject<T>(state.subject, initialValue)

    if (type === `readonly_selector`) {
      return value
    }

    const updateState = (next: Modifier<T> | T) => setState(token, next, store)

    return [value, updateState]
  }
  return { useStore }
}
