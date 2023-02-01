import { pipe } from "fp-ts/function"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import { allTrue, every, reduce } from "../array"
import { pass } from "../function"
import { ifNullish, isUndefined } from "../nullish"

export const redact =
  <K extends keyof any>(...args: K[]) =>
  <O extends Record<K, any>>(obj: O): Omit<O, K> =>
    reduce<K, O>((acc, key) => (delete acc[key], acc), obj)(args)

export const select =
  <Key extends keyof any>(...args: Key[]) =>
  <Obj extends object>(
    obj: Obj
  ): {
    // @ts-expect-error fuk u
    [K in keyof Pick<Obj, Key>]: any extends Pick<Obj, Key>[K]
      ? undefined
      : // @ts-expect-error fuk u
        Pick<Obj, Key>[K]
  } =>
    // @ts-expect-error fuk u ts
    reduce<Key, Pick<Obj, Key>>(
      // @ts-expect-error i will fite u
      (acc, key) => (key in obj ? (acc[key] = obj[key as keyof Obj]) : acc, acc),
      // @ts-expect-error fuk u
      {} as Pick<Obj, Key>
    )(args)

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

export const delve = (
  obj: Record<keyof any, any>,
  path: ReadonlyArray<keyof any>
): Error | { found: unknown } => {
  const found = path.reduce((acc, key) => acc?.[key], obj)
  return found === undefined ? new Error(`Not found`) : { found }
}

export const tweak = (
  obj: Record<keyof any, any>,
  path: ReadonlyArray<keyof any>,
  value: unknown
): void =>
  path.reduce((acc, key, i) => {
    if (i === path.length - 1) {
      acc[key] = value
    }
    if (acc[key] === undefined) {
      acc[key] = typeof key === `number` ? [] : {}
    }
    return acc[key]
  }, obj)

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Partial<Pick<T, Exclude<keyof T, K>>> & Required<Pick<T, K>>
}[keyof T]
