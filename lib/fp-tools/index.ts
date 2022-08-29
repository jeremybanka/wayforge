export type Applicator<X, Y> = (next: Modifier<X> | X) => Modifier<Y>
export type Modifier<T> = (thing: T) => T
export type ModifierMaker<X, Y> = (seed: X) => Modifier<Y>
export type Validator<T> = (input: unknown) => input is T

/* eslint-disable prettier/prettier */
export const to =
  <T>
  (nextVersionOfThing: Modifier<T> | T): ((originalThing: T) => T) =>
  (originalThing) =>
    nextVersionOfThing instanceof Function
      ? nextVersionOfThing(originalThing)
      : nextVersionOfThing
/* eslint-enable prettier/prettier */

export const clampInto =
  ([min, max]: [number, number]): Modifier<number> =>
  (value) =>
    value < min ? min : value > max ? max : value

export const wrapInto =
  ([min, max]: [number, number]): Modifier<number> =>
  (value) =>
    value < min
      ? max - ((min - value) % (max - min))
      : min + ((value - min) % (max - min))
