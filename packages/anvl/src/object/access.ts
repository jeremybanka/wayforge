export const key =
	<T extends object>(k: keyof T) =>
	(obj: Exclude<object, null>): unknown =>
		(obj as Record<keyof any, any>)[k]

export const access = <V, T extends Record<keyof any, V>>(
	k: keyof any,
): {
	(obj: T): T[keyof T] | undefined
	in: (obj: T) => T[keyof T] | undefined
} =>
	Object.assign((obj: T) => obj[k as keyof T], {
		in: (obj: T) => obj[k as keyof T],
	})
