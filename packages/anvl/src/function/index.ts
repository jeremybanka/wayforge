import type { Refinement } from "fp-ts/Refinement"
export * from "./curry"

export type ƒn = (...parameters: any[]) => any

export const doNothing = (): void => undefined

/* eslint-disable prettier/prettier */
export const become =
  <T>
  (nextVersionOfThing: Modifier<T> | T) =>
  (originalThing: T | (() => T)): T =>
    nextVersionOfThing instanceof Function
      ? nextVersionOfThing(originalThing instanceof Function 
          ? originalThing() 
          : originalThing
        )
      : nextVersionOfThing
/* eslint-enable prettier/prettier */

export type Applicator<X, Y> = (next: Modifier<X> | X) => Modifier<Y>
export type Modifier<T> = (thing: T) => T

export type OneOrMany<T> = T | T[]

export const isModifier =
  <T>(validate: Refinement<unknown, T>) =>
  (sample: T): Refinement<unknown, Modifier<T>> => {
    const sampleIsValid = validate(sample)
    if (!sampleIsValid) {
      throw new Error(`Invalid test case: JSON.stringify(${sample})`)
    }
    return (input: unknown): input is Modifier<T> => {
      if (typeof input !== `function`) return false
      const testResult = input(sample)
      return validate(testResult)
    }
  }

export const pass =
  <Params extends ReadonlyArray<any>, Out>(...params: Params) =>
  (fn: (...params: Params) => Out): Out =>
    fn(...params)

export const typeOf =
  <T>(input: unknown) =>
  (isType: Refinement<unknown, T>): boolean =>
    isType(input)

export const raiseError = (message: string): never => {
  throw new Error(message)
}

export type Encapsulate<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void

export const attempt = (fn: () => void): boolean => {
  try {
    fn()
    return true
  } catch (_) {
    return false
  }
}
