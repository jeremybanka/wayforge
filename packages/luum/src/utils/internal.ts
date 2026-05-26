export type Refinement<Input, Output extends Input> = (
	input: Input,
) => input is Output

export type Modifier<T> = (thing: T) => T
export type Applicator<X, Y> = (next: Modifier<X> | X) => Modifier<Y>
export type OneOrMany<T> = T | T[]

export function pipe<A>(a: A): A
export function pipe<A, B>(a: A, ab: (a: A) => B): B
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C
export function pipe<A, B, C, D>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
): D
export function pipe<A, B, C, D, E>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
): E
export function pipe(
	a: unknown,
	...fns: Array<(value: unknown) => unknown>
): unknown {
	return fns.reduce((value, fn) => fn(value), a)
}

export const become =
	<T>(nextVersionOfThing: Modifier<T> | T) =>
	(originalThing: T | (() => T)): T =>
		nextVersionOfThing instanceof Function
			? nextVersionOfThing(
					originalThing instanceof Function ? originalThing() : originalThing,
				)
			: nextVersionOfThing

export const isModifier =
	<T>(validate: Refinement<unknown, T>) =>
	(sample: T): Refinement<unknown, Modifier<T>> => {
		const sampleIsValid = validate(sample)
		if (!sampleIsValid) {
			throw new Error(`Invalid test case: ${JSON.stringify(sample)}`)
		}
		return (input: unknown): input is Modifier<T> => {
			if (typeof input !== `function`) return false
			const testResult = input(sample)
			return validate(testResult)
		}
	}

export const clampInto =
	(min: number, max: number): Modifier<number> =>
	(value) =>
		value < min ? min : value > max ? max : value

export const wrapInto =
	(min: number, max: number): Modifier<number> =>
	(value) =>
		value < min
			? max - ((min - value) % (max - min))
			: min + ((value - min) % (max - min))

export const each =
	<T>(isType: Refinement<unknown, T>) =>
	(input: unknown): T[] =>
		isType(input) ? [input] : Array.isArray(input) ? input.filter(isType) : []

export const isArray =
	<T>(isType: Refinement<unknown, T>) =>
	(input: unknown): input is T[] =>
		Array.isArray(input) && input.every((item) => isType(item))

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

export const isUndefined = (input: unknown): input is undefined =>
	input === undefined

export const key =
	<T extends object>(k: keyof T) =>
	(obj: Exclude<object, null>): unknown =>
		(obj as Record<PropertyKey, unknown>)[k]

export const isString = (input: unknown): input is string =>
	typeof input === `string`
