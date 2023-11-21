export type Loadable<T> = Promise<T> | T
export type Fated<T, E extends Error = Error> = Loadable<E | T>

/**
 * Utility for handling loadable values
 * @param loadable Loadable value
 * @param fallback Fallback value until Loadable is resolved
 * @returns Fallback value if your loadable is a promise, otherwise the loadable's resolved value
 */
export function until<T>(loadable: Loadable<T>, fallback: T): T {
	if (loadable instanceof Promise) {
		return fallback
	}
	return loadable
}
