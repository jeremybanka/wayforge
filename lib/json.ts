/* eslint-disable quotes */
/* eslint-enable quotes */

export type Primitive = boolean | number | string | null

export type Serializable =
  | Primitive
  | Readonly<{ [key: string]: Serializable }>
  | ReadonlyArray<Serializable>
  | { toJSON: () => string }

export type JsonObj<
  Key extends string = string,
  Value extends Serializable = Serializable
> = Record<Key, Value>

export type JsonArr<Element extends Serializable = Serializable> =
  ReadonlyArray<Element>

export type Json = JsonArr | JsonObj

export type Empty = Record<string, never>
