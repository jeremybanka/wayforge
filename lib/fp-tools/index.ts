export type Modifier<Anything> = (thing: Anything) => Anything
export type Applicator<X, Y> = (next: X | ((prev: X) => X)) => Transformer<Y>

/* eslint-disable prettier/prettier */
export const apply =

  <T>(nextVersionOfThing: Modifier<T> | T): ((originalThing: T) => T) =>

  (originalThing) =>
    nextVersionOfThing instanceof Function
      ? nextVersionOfThing(originalThing)
      : nextVersionOfThing
/* eslint-enable prettier/prettier */
