import { pipe } from "fp-ts/lib/function"

export const serializeSet = <T>(set: Set<T>): string =>
  pipe(set, Array.from, JSON.stringify)

export const deserializeSet = <T>(str: string): Set<T> =>
  pipe(str, JSON.parse, Array.from, (a) => new Set(a as T[]))

export type Primitive = boolean | number | string | null

export type Serializable =
  | Primitive
  | Readonly<{ [key: string]: Serializable }>
  | ReadonlyArray<Serializable>

export type JsonObj<
  Key extends string = string,
  Value extends Serializable = Serializable
> = Record<Key, Value>

export type JsonArr<Element extends Serializable = Serializable> =
  ReadonlyArray<Element>

export type Json = JsonArr | JsonObj | Primitive

export const parseJson = (str: string): Json => JSON.parse(str)

export type Empty = Record<string, never>

export type JsonTypeName =
  | `array`
  | `boolean`
  | `null`
  | `number`
  | `object`
  | `string`

export interface JsonTypes extends Record<JsonTypeName, Json> {
  array: JsonArr
  boolean: boolean
  null: null
  number: number
  object: JsonObj
  string: string
}

export const JSON_DEFAULTS: JsonTypes = {
  array: [],
  boolean: false,
  null: null,
  number: 0,
  object: {},
  string: ``,
}
