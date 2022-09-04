import { pipe } from "fp-ts/lib/function"
import type { AtomEffect } from "recoil"

import type { Json, Primitive } from "~/lib/json"

import type { SerializationInterface } from "."

export const localStorageSerializationEffect: <T>(
  key: string,
  serializationInterface: SerializationInterface<T>
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

export const localStorageEffect: <T extends Json | Primitive>(
  key: string
) => AtomEffect<T> = (key) =>
  localStorageSerializationEffect(key, {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  })
