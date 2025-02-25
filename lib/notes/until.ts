import { Loadable } from "atom.io/internal"

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
