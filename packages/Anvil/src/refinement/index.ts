import { isNumber } from "fp-ts/number"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

export const mustBe =
  <T>(...args: ReadonlyArray<T>) =>
  (input: unknown): input is T =>
    args.includes(input as T)

export type IsAmongTypes<A, B> = Refinement<unknown, A | B> & {
  or: <C>(isType: Refinement<unknown, C>) => IsAmongTypes<unknown, A | B | C>
}
export const couldBe = <A>(
  isTypeA: Refinement<unknown, A>
): {
  (input: unknown): input is A
  or: <B>(isTypeB: Refinement<unknown, B>) => IsAmongTypes<A, B>
} => {
  const refinements: Refinement<unknown, any>[] = [isTypeA]
  const checkTypes: {
    (input: unknown): input is A
    or: <B>(isTypeB: Refinement<unknown, B>) => IsAmongTypes<A, B>
  } = Object.assign(
    (input: unknown): input is A =>
      refinements.some((refinement) => refinement(input)),
    {
      or: <B>(isTypeB: Refinement<unknown, B>): IsAmongTypes<A, B> => {
        refinements.push(isTypeB)
        return checkTypes
      },
    }
  )
  return checkTypes
}

export const cannotExist = (input: unknown): input is never => input && false

export const ensure =
  <T>(isType: Refinement<unknown, T>) =>
  (input: unknown): T => {
    if (!isType(input)) {
      throw new TypeError(`Expected ${input} to be of type ${isType.name}`)
    }
    return input as T
  }

export const ensureAgainst =
  <A, B>(isType: Refinement<unknown, A>) =>
  (input: A | B): Exclude<A | B, A> => {
    if (isType(input)) {
      throw new TypeError(`Expected ${input} to not be of type ${isType.name}`)
    }
    return input as Exclude<A | B, A>
  }

// remove last element from tuple
export type Pop<T extends any[]> = T extends [...infer U, any] ? U : never

// remove last element from tuple if it is a function
export type PopIfFunction<T extends any[]> = T extends [
  ...infer U,
  (...args: any[]) => any
]
  ? U
  : T
