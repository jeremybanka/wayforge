import type { Refinement } from "fp-ts/Refinement"

import { isArray } from "."
import { canExist, isUnion } from "../refinement"

export type FractalArrayItems<T> = FractalArrayItems<T>[] | T
export type FractalArray<T> = FractalArrayItems<T>[]
export const isFractalArray =
	<T>(isContent: Refinement<unknown, T>) =>
	(value: unknown, depth = 0): value is FractalArray<T> =>
		isUnion
			.or((v0): v0 is T => depth > 0 && isContent(v0))
			.or((v1): v1 is FractalArray<T> =>
				isArray((v2): v2 is FractalArrayItems<T> =>
					isFractalArray(isContent)(v2, depth + 1),
				)(v1),
			)(value)

export const fractalMap = <T, U>(
	array: FractalArray<T>,
	mapper: (value: T, indices: number[]) => U,
	indices: number[] = [],
): FractalArray<U> =>
	array.map((value, index) => {
		if (isArray(canExist)(value)) {
			return fractalMap(value, mapper, [...indices, index])
		}
		return mapper(value, [...indices, index])
	})

export const prune = <T>(
	array: FractalArray<T>,
	predicate: (value: FractalArrayItems<T>, indices: number[]) => boolean,
	indices: number[] = [],
): FractalArray<T> =>
	array
		.filter((value, index) => predicate(value, [...indices, index]))
		.map((value, index) => {
			if (isArray(canExist)(value)) {
				return prune(value, predicate, [...indices, index])
			}
			return value
		})
