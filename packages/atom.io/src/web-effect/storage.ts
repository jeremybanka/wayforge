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
      storage.setItem(key, stringify(newValue))
    })
  }
