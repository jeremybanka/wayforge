import type { Refinement } from "fp-ts/Refinement"

export * from "./refined"

export const canExist = (_: unknown): _ is unknown => true
export const cannotExist = (_: unknown): _ is never => false

export const isLiteral =
  <T extends boolean | number | string>(value: T): Refinement<unknown, T> =>
  (input: unknown): input is T =>
    input === value

export const isWithin =
  <Options extends ReadonlyArray<any>>(args: Options) =>
  (input: unknown): input is Options[number] =>
    args.includes(input as Options[number])

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

export type ExtendsSome<A, B> = Refinement<unknown, A | B> & {
  or: <C>(isType: Refinement<unknown, C>) => ExtendsSome<unknown, A | B | C>
}
export const couldBe = <A>(
  isTypeA: Refinement<unknown, A>,
  logging = false,
  refinements: Refinement<unknown, any>[] = [isTypeA]
): {
  (input: unknown): input is A
  or: <B>(isTypeB: Refinement<unknown, B>) => ExtendsSome<A, B>
} => {
  const name = `(${refinements.map((r) => r.name || `anon`).join(` | `)})`
  const _ = {
    [name]: (input: unknown): input is A =>
      refinements.some(
        (refinement) => (
          logging &&
            console.log(
              refinements.map((r) => r.name || `anon`).join(` | `),
              `>`,
              refinement.name ?? `anon`,
              `:`,
              refinement(input)
            ),
          refinement(input)
        )
      ),
  }
  const checkTypes: {
    (input: unknown): input is A
    or: <B>(isTypeB: Refinement<unknown, B>) => ExtendsSome<A, B>
  } = Object.assign(_[name], {
    or: <B>(isTypeB: Refinement<unknown, B>): ExtendsSome<A, B> =>
      couldBe(isTypeB, logging, [...refinements, isTypeB]),
  })
  return checkTypes
}

export const isUnion = couldBe(cannotExist)

export type ExtendsAll<A, B> = Refinement<unknown, A & B> & {
  and: <C>(isType: Refinement<unknown, C>) => ExtendsAll<A & B, C>
}

export const mustBe = <A>(
  isTypeA: Refinement<unknown, A>,
  logging = false,
  refinements: Refinement<unknown, any>[] = [isTypeA]
): {
  (input: unknown): input is A
  and: <B>(isTypeB: Refinement<unknown, B>) => ExtendsAll<A, B>
} => {
  const name = `(${refinements.map((r) => r.name || `anon`).join(` & `)})`
  const _ = {
    [name]: (input: unknown): input is A =>
      refinements.every(
        (refinement) => (
          logging &&
            console.log(
              refinements.map((r) => r.name || `anon`).join(` & `),
              `>`,
              refinement.name || `anon`,
              `:`,
              refinement(input)
            ),
          refinement(input)
        )
      ),
  }
  const checkTypes: {
    (input: unknown): input is A
    and: <B>(isTypeB: Refinement<unknown, B>) => ExtendsAll<A, B>
  } = Object.assign(_[name], {
    and: <B>(isTypeB: Refinement<unknown, B>): ExtendsAll<A, B> =>
      mustBe(isTypeB, logging, [...refinements, isTypeB]) as ExtendsAll<A, B>,
  })
  return checkTypes
}

export const isIntersection = mustBe(canExist)

/* eslint-disable @typescript-eslint/ban-types */
export const isClass =
  <ClassSignature extends abstract new (...args: any) => any>(
    C: ClassSignature
  ) =>
  (input: unknown): input is InstanceType<ClassSignature> =>
    input instanceof C
/* eslint-enable @typescript-eslint/ban-types */
