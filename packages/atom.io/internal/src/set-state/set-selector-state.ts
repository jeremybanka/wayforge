import type { Selector } from "../selector"

export const setSelectorState = <T>(
	selector: Selector<T>,
	next: T | ((oldValue: T) => T),
): void => {
	selector.set(next)
}
