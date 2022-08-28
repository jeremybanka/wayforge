import { pipe } from "fp-ts/lib/function"
import type { AtomEffect } from "recoil"

import type { Json, Primitive } from "~/lib/json"

export const localStorageEffect: <T extends Json | Primitive>(
  key: string
) => AtomEffect<T> =
  (key) =>
  ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key)
    if (savedValue != null) {
      setSelf(JSON.parse(savedValue))
    }

    onSet((newValue, _, isReset) => {
      isReset
        ? localStorage.removeItem(key)
        : localStorage.setItem(key, JSON.stringify(newValue))
    })
  }

export const localStorageSerializationEffect: <T>(
  key: string,
  storageInterface: {
    serialize: (t: T) => string
    deserialize: (j: string) => T
  }
) => AtomEffect<T> =
  (key, { serialize, deserialize }) =>
  ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key)

    if (savedValue != null) setSelf(pipe(savedValue, deserialize))

    onSet((newValue, _, isReset) => {
      isReset
        ? localStorage.removeItem(key)
        : pipe(newValue, serialize, (s) => localStorage.setItem(key, s))
    })
  }
