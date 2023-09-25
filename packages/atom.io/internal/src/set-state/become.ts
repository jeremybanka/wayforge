export type Modify<T> = (thing: T) => T

export const become =
	<T>(nextVersionOfThing: Modify<T> | T) =>
	(originalThing: T): T =>
		nextVersionOfThing instanceof Function
			? nextVersionOfThing(
					originalThing instanceof Function ? originalThing() : originalThing,
			  )
			: nextVersionOfThing
