import { pipe } from "fp-ts/function"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import { allTrue, every, reduce } from "../array"
import { pass } from "../function"
import { ifNullish, isUndefined } from "../nullish"

export const key =
  <T extends object>(k: keyof T) =>
  (obj: Exclude<object, null>): unknown =>
    (obj as Record<keyof any, any>)[k]

export const access = <V, T extends Record<keyof any, V>>(
  k: keyof any
): {
  (obj: T): T[keyof T] | undefined
  in: (obj: T) => T[keyof T] | undefined
} =>
  Object.assign((obj: T) => obj[k as keyof T], {
    in: (obj: T) => obj[k as keyof T],
  })

export const redact =
  <K extends keyof any>(...args: K[]) =>
  <O extends Record<K, any>>(obj: O): Omit<O, K> =>
    reduce<K, O>((acc, key) => (delete acc[key], acc), obj)(args)

type MappedC<A, B> = {
  [K in keyof A & keyof B]: A[K] extends B[K] ? never : K
}

type OptionalKeys<T> = MappedC<T, Required<T>>[keyof T]

export const select =
  <Key extends keyof any>(...args: Key[]) =>
  // @ts-expect-error fuk u
  <Obj extends object>(obj: Obj): Pick<Obj, Key> =>
    // @ts-expect-error fuk u ts
    reduce<Key, Pick<Obj, Key>>(
      // @ts-expect-error i will fite u
      (acc, key) => (key in obj ? (acc[key] = obj[key as keyof Obj]) : acc, acc),
      // @ts-expect-error fuk u
      {} as Pick<Obj, Key>
    )(args)

export const modify =
  <Mod extends Record<keyof any, any>>(modifications: Mod) =>
  <
    Obj extends {
      [Key in keyof Mod]: Key extends keyof Mod
        ? Mod[Key] extends (v: any) => any
          ? Parameters<Mod[Key]>[0]
          : Obj[Key]
        : Obj[Key]
    }
  >(
    obj: Obj
  ): {
    [Key in keyof Obj]: Key extends keyof Mod
      ? Mod[Key] extends (v: any) => any
        ? ReturnType<Mod[Key]>
        : Mod[Key]
      : Obj[Key]
  } =>
    Object.entries(modifications).reduce(
      (acc, [key, mod]) => ((acc[key as keyof Obj] = mod?.(obj[key])), acc),
      { ...obj } as Obj
    ) as any

export const isPlainObject = (
  input: unknown
): input is Record<keyof any, unknown> =>
  typeof input === `object` &&
  input !== null &&
  Object.getPrototypeOf(input) === Object.prototype

export type HasPropertiesOptions = {
  readonly allowExtraProperties?: boolean
}

export const hasProperties = <OBJ extends object>(
  isValue: {
    [K in keyof OBJ]: Refinement<unknown, OBJ[K]>
  },
  options?: HasPropertiesOptions
): Refinement<unknown, OBJ> => {
  const name = `{${recordToEntries(
    isValue as Record<keyof any, Refinement<any, any>>
  )
    .map(([k, v]) => String(k) + `:` + v.name)
    .join(`,`)}}`

  const _ = {
    [name]: (input: unknown): input is OBJ =>
      isPlainObject(input) &&
      pipe(
        isValue,
        Object.entries,
        every(([key, val]) => key in input || val(undefined))
      ) &&
      pipe(
        input,
        mob((val, key) =>
          pipe(
            isValue,
            access(key),
            ifNullish(() => options?.allowExtraProperties ?? false),
            pass(val)
          )
        ),
        Object.values,
        allTrue
      ),
  }
  return _[name]
}

export const doesExtend /* alias for hasProperties with allowExtraProperties */ =
  <OBJ extends object>(isValue: {
    [K in keyof OBJ]: Refinement<unknown, OBJ[K]>
  }): Refinement<unknown, OBJ> =>
    hasProperties(isValue, { allowExtraProperties: true })

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

export type Entries<K extends keyof any, V> = [key: K, value: V][]

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

// export type Mixed<T> = {
//   [K in keyof T]:
// }
