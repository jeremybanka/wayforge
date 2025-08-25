export type Modify<T> = (thing: T) => T

export function become<T>(
	nextVersionOfThing: Modify<T> | T,
	originalThing: T,
): T {
	if (nextVersionOfThing instanceof Function) {
		return nextVersionOfThing(originalThing)
	}
	return nextVersionOfThing
}
