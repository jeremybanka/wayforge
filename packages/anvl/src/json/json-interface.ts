import { pipe } from "fp-ts/function"
import { z } from "zod"

import type { Json, JsonArr } from "."

export type JsonInterface<T, J extends Json = Json> = {
  toJson: (t: T) => J
  fromJson: (json: J) => T
}

export const stringSetJsonInterface: JsonInterface<
  Set<string>,
  JsonArr<string>
> = {
  toJson: (stringSet) => Array.from(stringSet),
  fromJson: (input: unknown) =>
    pipe(input, z.array(z.string()).parse, (strings) => new Set(strings)),
}
