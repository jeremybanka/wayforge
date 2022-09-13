import { isUndefined } from "."

export const key =
  <T extends object>(k: keyof T) =>
  (obj: Exclude<object, null>): unknown =>
    (obj as Record<keyof any, any>)[k]

export type Entries<K extends keyof any, V> = [key: K, value: V][]

export const recordToEntries = <K extends keyof any, V>(
  obj: Record<K, V>
): Entries<K, V> => Object.entries(obj) as Entries<K, V>

export const entriesToRecord = <K extends keyof any, V>(
  entries: Entries<K, V>
): Record<K, V> => Object.fromEntries(entries) as Record<K, V>

export const treeShake =
  (shouldDiscard: (value: unknown) => boolean = isUndefined) =>
  <T>(obj?: T): Partial<T> => {
    if (!obj) return {}
    const newObj = {} as Partial<T>
    const entries = Object.entries(obj) as [keyof T, any][]
    entries.forEach(([key, val]) =>
      !shouldDiscard(val) ? (newObj[key] = val) : null
    )
    return newObj
  }
