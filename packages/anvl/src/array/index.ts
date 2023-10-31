import type { Refinement } from "../refinement"

export * from "./match"
export * from "./venn"

export const each =
	<T>(isType: Refinement<unknown, T>) =>
	(input: unknown): T[] =>
		isType(input) ? [input] : Array.isArray(input) ? input.filter(isType) : []

export const lastOf = <T>(input: ReadonlyArray<T>): T | undefined =>
	input[input.length - 1]

export const isArray =
	<T>(isType: Refinement<unknown, T>) =>
	(input: unknown): input is T[] =>
		Array.isArray(input) && input.every((item) => isType(item))

export const at =
	<T>(index: number) =>
	(input: T[]): T | undefined =>
		input.at(index)

export const content =
	<T>(isType: Refinement<unknown, T>) =>
	(input: unknown): input is T | T[] =>
		isType(input) || isArray(isType)(input)

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

export const slice =
	(start: number, end?: number) =>
	<I>(a: I[]): I[] =>
		a.slice(start, end)

export const using =
	<I, O>(a: I[]) =>
	(f: (acc: O, value: I, index: number, array: I[]) => O) =>
	(initial: O): O =>
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

export const every =
	<I>(f: (value: I, index: number, array: I[]) => boolean = Boolean) =>
	(a: I[]): boolean =>
		a.every(f)

export const allTrue = every((x: boolean) => x === true)

export const addTo =
	<I>(a: I[]) =>
	(x: I): I[] =>
		a.includes(x) ? a : [...a, x]

export const isEmptyArray = (input: unknown): input is [] =>
	Array.isArray(input) && input.length === 0

export const isOneOf =
	<T>(...args: ReadonlyArray<T>) =>
	(input: unknown): input is T =>
		args.includes(input as T)

export const filter =
	<I, O extends I>(f: (value: I, index: number, array: I[]) => value is O) =>
	(a: I[]): O[] =>
		a.filter(f)
