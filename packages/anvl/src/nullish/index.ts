import type { Refinement } from "fp-ts/Refinement"

export const isUndefined = (input: unknown): input is undefined =>
  input === undefined

export const ifDefined = <T>(
  validate: Refinement<unknown, T>
): Refinement<unknown, T | undefined> =>
  ((input) => isUndefined(input) || validate(input)) as Refinement<
    unknown,
    T | undefined
  >

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
