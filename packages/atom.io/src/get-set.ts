import * as Internal from "atom.io/internal"
import type { ReadonlySelectorToken, StateToken } from "."

export const getState = <T>(
	token: ReadonlySelectorToken<T> | StateToken<T>,
	store: Internal.Store = Internal.IMPLICIT.STORE,
): T => {
	const state =
		Internal.withdraw(token, store) ??
		Internal.withdrawNewFamilyMember(token, store)
	if (state === undefined) {
		throw new NotFoundError(token, store)
	}
	return Internal.readOrComputeCurrentState(state, store)
}

export const setState = <T, New extends T>(
	token: StateToken<T>,
	value: New | ((oldValue: T) => New),
	store: Internal.Store = Internal.IMPLICIT.STORE,
): void => {
	const rejection = Internal.openOperation(token, store)
	if (rejection) {
		return
	}
	const state =
		Internal.withdraw(token, store) ??
		Internal.withdrawNewFamilyMember(token, store)
	if (state === undefined) {
		throw new NotFoundError(token, store)
	}
	Internal.setAtomOrSelector(state, value, store)
	Internal.closeOperation(store)
}

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)
export class NotFoundError extends Error {
	public constructor(
		token: ReadonlySelectorToken<any> | StateToken<any>,
		store: Internal.Store,
	) {
		super(
			`${capitalize(token.type)} "${token.key}" not found in store "${
				store.config.name
			}".`,
		)
	}
}
