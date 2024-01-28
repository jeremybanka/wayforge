import type { Refinement } from "../refinement"

export * from "./refined"
export * from "./refinery"
export * from "./refinement"
export * from "./refine-json"

export * from "./can-exist"
export * from "./cannot-exist"

export * from "./is-class"
export * from "./is-union"
export * from "./is-intersection"

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
