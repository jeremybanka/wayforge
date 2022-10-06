import type { Modifier } from ".."

export const wrapInto =
  ([min, max]: [number, number]): Modifier<number> =>
  (value) =>
    value < min
      ? max - ((min - value) % (max - min))
      : min + ((value - min) % (max - min))
