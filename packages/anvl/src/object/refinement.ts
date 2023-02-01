import { pipe } from "fp-ts/function"
import type { Refinement } from "fp-ts/Refinement"

import { access } from "./access"
import { recordToEntries } from "./entries"
import { mob } from "./mapObject"
import { allTrue, every } from "../array"
import { pass } from "../function"
import { ifNullish } from "../nullish"

export type PlainObject = Record<keyof any, unknown>
export type EmptyObject = Record<keyof any, never>

export const isPlainObject = (input: unknown): input is PlainObject =>
  typeof input === `object` &&
  input !== null &&
  Object.getPrototypeOf(input) === Object.prototype

export const isEmptyObject = (input: unknown): input is EmptyObject =>
  isPlainObject(input) && Object.keys(input).length === 0

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

export type HasPropertiesOptions = {
  readonly allowExtraProperties?: boolean
}
export const hasProperties = <OBJ extends object>(
  isValue: {
    [K in keyof OBJ]: Refinement<unknown, OBJ[K]>
  },
  options: HasPropertiesOptions = { allowExtraProperties: false }
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
            ifNullish(() => options.allowExtraProperties),
            pass(val)
          )
        ),
        Object.values,
        allTrue
      ),
  }
  return _[name]
}

export const doesExtend =
  /* alias for hasExactProperties with allowExtraProperties */
  <OBJ extends object>(isValue: {
    [K in keyof OBJ]: Refinement<unknown, OBJ[K]>
  }): Refinement<unknown, OBJ> =>
    hasProperties(isValue, { allowExtraProperties: true })

export const hasExactProperties =
  /* alias for hasProperties without allowExtraProperties */
  <OBJ extends object>(isValue: {
    [K in keyof OBJ]: Refinement<unknown, OBJ[K]>
  }): Refinement<unknown, OBJ> =>
    hasProperties(isValue, { allowExtraProperties: false })
