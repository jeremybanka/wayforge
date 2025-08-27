import { isFn } from "../is-fn"

export function become<T>(
	nextVersionOfThing: T | ((prev: T) => T),
	originalThing: T,
): T {
	if (isFn(nextVersionOfThing)) {
		return nextVersionOfThing(originalThing)
	}
	return nextVersionOfThing
}
