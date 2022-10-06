export const isUndefined = (input: unknown): input is undefined =>
  typeof input === `undefined`

export const isNull = (input: unknown): input is null => input === null

export const isNullish = (input: unknown): input is null | undefined =>
  isUndefined(input) || isNull(input)

export type NullSafeUnion<Base, Extension> = Extension extends null
  ? Base
  : Base & Extension

export type NullSafeRest<MaybeArg> = MaybeArg extends null
  ? [] | [undefined]
  : [MaybeArg]

export interface Discard {
  readonly _discard: unique symbol
}
