export type NullSafeUnion<Base, Extension> = Extension extends null
  ? Base
  : Base & Extension

export type NullSafeRest<MaybeArg> = MaybeArg extends null
  ? [] | [undefined]
  : [MaybeArg]
