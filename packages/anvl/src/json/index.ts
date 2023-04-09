import { pipe } from "fp-ts/function"

export * from "./refine"

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

export const parseJson = <J extends Json, S extends Stringified<J> | string>(
  str: S | string
): S extends Stringified<J> ? J : Json => JSON.parse(str)

export type Stringified<J extends Json> = string & { __json: J }

export const stringifyJson = <J extends Json>(json: J): Stringified<J> =>
  JSON.stringify(json) as Stringified<J>

export type Empty = Record<string, never>

export const JSON_TYPE_NAMES = [
  `array`,
  `boolean`,
  `null`,
  `number`,
  `object`,
  `string`,
] as const

export type JsonTypeName = (typeof JSON_TYPE_NAMES)[number]

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

export type JsonInterface<T, J extends Json = Json> = {
  toJson: (t: T) => J
  fromJson: (json: J) => T
}
