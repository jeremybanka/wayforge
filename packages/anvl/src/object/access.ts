export const key =
	<T extends object>(k: keyof T) =>
	(obj: Exclude<object, null>): unknown =>
		(obj as Record<PropertyKey, any>)[k]

export const access = <V, T extends Record<PropertyKey, V>>(
	k: PropertyKey,
): {
	(obj: T): T[keyof T] | undefined
	in: (obj: T) => T[keyof T] | undefined
} =>
	Object.assign((obj: T) => obj[k as keyof T], {
		in: (obj: T) => obj[k as keyof T],
	})
