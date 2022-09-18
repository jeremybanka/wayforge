import type { Refinement } from "fp-ts/lib/Refinement"
import { isString } from "fp-ts/lib/string"

import { isUndefined } from "."

export const key =
  <T extends object>(k: keyof T) =>
  (obj: Exclude<object, null>): unknown =>
    (obj as Record<keyof any, any>)[k]

export type Entries<K extends keyof any, V> = [key: K, value: V][]

export const isPlainObject = (
  input: unknown
): input is Record<keyof any, unknown> =>
  typeof input === `object` &&
  input !== null &&
  Object.getPrototypeOf(input) === Object.prototype

export const isRecord =
  <K extends keyof any, V>(
    isKey: Refinement<unknown, K>,
    isValue: Refinement<unknown, V>
  ) =>
  (input: unknown): input is Record<K, V> =>
    isPlainObject(input) &&
    Object.entries(input).every(([k, v]) => isKey(k) && isValue(v))

export const isDictionary =
  <V>(isValue: Refinement<unknown, V>) =>
  (input: unknown): input is Record<string, V> =>
    isRecord(isString, isValue)(input)

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

export const mapObject = <K extends keyof any, I, O>(
  obj: Record<K, I>,
  fn: (val: I, key: K) => O
): Record<K, O> => {
  const newObj = {} as Record<K, O>
  const entries = Object.entries(obj) as [K, I][]
  entries.forEach(([key, val]) => {
    newObj[key] = fn(val, key)
  })
  return newObj
}

export const mob =
  <K extends keyof any, I, O>(fn: (val: I, key: K) => O) =>
  (obj: Record<K, I>): Record<K, O> => {
    const newObj = {} as Record<K, O>
    const entries = Object.entries(obj) as [K, I][]
    entries.forEach(([key, val]) => {
      newObj[key] = fn(val, key)
    })
    return newObj
  }
