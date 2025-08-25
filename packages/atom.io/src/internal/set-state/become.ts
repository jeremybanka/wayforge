import { isFn } from "../is-fn"

export type Modify<T> = (thing: T) => T

export function become<T>(
	nextVersionOfThing: Modify<T> | T,
	originalThing: T,
): T {
	if (isFn(nextVersionOfThing)) {
		return nextVersionOfThing(originalThing)
	}
	return nextVersionOfThing
}
