import { pipe } from "fp-ts/lib/function"
import type { Refinement } from "fp-ts/lib/Refinement"
import { isString } from "fp-ts/lib/string"

import { allTrue, every, reduce } from "../array"
import { isUndefined } from "../nullish"

export const key =
  <T extends object>(k: keyof T) =>
  (obj: Exclude<object, null>): unknown =>
    (obj as Record<keyof any, any>)[k]

export const redact =
  <K extends keyof any>(...args: K[]) =>
  <O extends Record<K, any>>(obj: O): Omit<O, K> =>
    reduce<K, O>((acc, key) => (delete acc[key], acc), obj)(args)

// export const redactId = redact(`id`)
// const myUser: { name: string; id: string } = { id: `123`, name: `John` }
// const myUserWithoutId = redactId(myUser)
// const { name } = myUserWithoutId

export type Entries<K extends keyof any, V> = [key: K, value: V][]

export const isPlainObject = (
  input: unknown
): input is Record<keyof any, unknown> =>
  typeof input === `object` &&
  input !== null &&
  Object.getPrototypeOf(input) === Object.prototype

export const isObject =
  <OBJ extends object>(isValue: {
    [K in keyof OBJ]: Refinement<unknown, OBJ[K]>
  }): Refinement<unknown, OBJ> =>
  (input: unknown): input is OBJ =>
    isPlainObject(input) &&
    pipe(
      isValue,
      Object.keys,
      every((key) => key in input)
    ) &&
    pipe(
      input,
      mob((val, key) => isValue[key as keyof OBJ]?.(val) ?? false),
      Object.values,
      allTrue
    )
export const hasProperties = isObject

/* prettier-ignore */
export const isRecord = <
    KEY extends keyof any, 
    VAL
  >( 
    isKey: Refinement<keyof any, KEY>,
    isValue: Refinement<unknown, VAL>
  ) =>
  (input: unknown): input is Record<KEY, VAL> =>
    isPlainObject(input) &&
    Object.entries(input).every(([k, v]) => isKey(k) && isValue(v))
/* prettier-ignore-end */

export const isDictionary =
  <VAL>(isValue: Refinement<unknown, VAL>) =>
  (input: unknown): input is Record<string, VAL> =>
    isRecord(isString, isValue)(input)

export type EmptyObject = Record<keyof any, never>

export const isEmptyObject = (input: unknown): input is EmptyObject =>
  isPlainObject(input) && Object.keys(input).length === 0

export const recordToEntries = <K extends keyof any, V>(
  obj: Record<K, V>
): Entries<K, V> => Object.entries(obj) as Entries<K, V>

export const entriesToRecord = <K extends keyof any, V>(
  entries: Entries<K, V>
): Record<K, V> => Object.fromEntries(entries) as Record<K, V>

export const treeShake =
  (shouldDiscard: (val: unknown, key: keyof any) => boolean = isUndefined) =>
  <T extends object>(
    obj: T
  ): T extends Record<keyof any, unknown> ? T : Partial<T> => {
    const newObj = {} as T
    const entries = Object.entries(obj) as [keyof T, any][]
    entries.forEach(([key, val]) =>
      !shouldDiscard(val, key) ? (newObj[key] = val) : null
    )
    return newObj as T extends Record<keyof any, unknown> ? T : Partial<T>
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
  (obj: Record<K, I>): Record<K, O> =>
    mapObject(obj, fn)
