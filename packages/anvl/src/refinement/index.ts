import type { Refinement } from "../refinement"

export * from "./can-exist"
export * from "./cannot-exist"
export * from "./is-class"
export * from "./is-intersection"
export * from "./is-union"
export type * from "./refine-json"
export type * from "./refined"
export type * from "./refinement"

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
			throw new TypeError(
				`Expected ${JSON.stringify(input)} to be of type ${isType.name}`,
			)
		}
		return input
	}

export const ensureAgainst =
	<A, B>(isType: Refinement<unknown, A>) =>
	(input: A | B): Exclude<A | B, A> => {
		if (isType(input)) {
			throw new TypeError(
				`Expected ${JSON.stringify(input)} to not be of type ${isType.name}`,
			)
		}
		return input as Exclude<A | B, A>
	}
