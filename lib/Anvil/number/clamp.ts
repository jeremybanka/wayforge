import type { Modifier } from "Anvil"

export const clampInto =
  ([min, max]: [number, number]): Modifier<number> =>
  (value) =>
    value < min ? min : value > max ? max : value
