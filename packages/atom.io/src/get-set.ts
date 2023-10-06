import * as Internal from "atom.io/internal"
import type { ReadonlySelectorToken, StateToken } from "."

export const capitalize = (str: string): string =>
	str[0].toUpperCase() + str.slice(1)

export const getState = <T>(
	token: ReadonlySelectorToken<T> | StateToken<T>,
	store: Internal.Store = Internal.IMPLICIT.STORE,
): T => {
	const state =
		Internal.withdraw(token, store) ??
		Internal.withdrawNewFamilyMember(token, store)
	if (state === null) {
		throw new Error(
			`${capitalize(token.type)} "${token.key}" not found in store "${
				store.config.name
			}".`,
		)
	}
	return Internal.getState__INTERNAL(state, store)
}

export const setState = <T, New extends T>(
	token: StateToken<T>,
	value: New | ((oldValue: T) => New),
	store: Internal.Store = Internal.IMPLICIT.STORE,
): void => {
	try {
		Internal.openOperation(token, store)
	} catch (thrown) {
		if (!(typeof thrown === `symbol`)) {
			throw thrown
		}
		return
	}
	const state =
		Internal.withdraw(token, store) ??
		Internal.withdrawNewFamilyMember(token, store)
	if (state === null) {
		throw new Error(
			`${capitalize(token.type)} "${token.key}" not found in store "${
				store.config.name
			}".`,
		)
	}
	Internal.setState__INTERNAL(state, value, store)
	Internal.closeOperation(store)
}
