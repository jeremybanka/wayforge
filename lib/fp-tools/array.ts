import type { Refinement } from "fp-ts/lib/Refinement"

export const each =
  <T>(isType: Refinement<unknown, T>) =>
  (input: unknown): T[] =>
    isType(input) ? [input] : Array.isArray(input) ? input.filter(isType) : []

export const doesEachElementMatch =
  <T>(isType: Refinement<unknown, T>) =>
  (input: unknown): input is T[] =>
    Array.isArray(input) && input.every((item) => isType(item))

export const content =
  <T>(isType: Refinement<unknown, T>) =>
  (input: unknown): input is T | T[] =>
    isType(input) || doesEachElementMatch(isType)(input)

export const join =
  (separator?: string) =>
  (a: string[]): string =>
    a.join(separator)

export const map =
  <I, O>(f: (value: I, index: number, array: I[]) => O) =>
  (a: I[]): O[] =>
    a.map(f)

export const reduce =
  <I, O>(f: (acc: O, value: I, index: number, array: I[]) => O, initial: O) =>
  (a: I[]): O =>
    a.reduce(f, initial)

export const reduceRight =
  <I, O>(f: (acc: O, value: I, index: number, array: I[]) => O, initial: O) =>
  (a: I[]): O =>
    a.reduceRight(f, initial)

export const reverse = <I>(a: I[]): I[] => a.reverse()

export const sort =
  <I>(a: I[]) =>
  (f?: (x: I, y: I) => number): I[] =>
    f ? a.sort(f) : a.sort()

export const sortBy =
  <I>(f: (value: I) => number) =>
  (a: I[]): I[] =>
    a.sort((x, y) => f(x) - f(y))

export const sortByDesc =
  <I>(f: (value: I) => number) =>
  (a: I[]): I[] =>
    a.sort((x, y) => f(y) - f(x))
