import type { Json } from "~/packages/anvl/src/json"

import type { AtomEffect } from "../index"

export type StringInterface<T> = {
  stringify: (t: T) => string
  parse: (s: string) => T
}

export const persistAtom =
  <T>(storage: Storage) =>
  ({ stringify, parse }: StringInterface<T>) =>
  (key: string): AtomEffect<T> =>
  ({ setSelf, onSet }) => {
    const savedValue = storage.getItem(key)

    if (savedValue != null) setSelf(parse(savedValue))

    onSet(({ newValue }) => {
      if (newValue == null) {
        storage.removeItem(key)
        return
      }
      storage.setItem(key, stringify(newValue))
    })
  }

export const lazyLocalStorageEffect: <J extends Json>(
  key: string
) => AtomEffect<J> = persistAtom(localStorage)(JSON)
