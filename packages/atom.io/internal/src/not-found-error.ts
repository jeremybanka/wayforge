import type { ReadonlySelectorToken, StateToken } from "atom.io"

import type { Store } from "./store"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

function prettyPrintTokenType(
	token: ReadonlySelectorToken<any> | StateToken<any>,
) {
	if (token.type === `readonly_selector`) {
		return `Readonly Selector`
	}
	return capitalize(token.type)
}

export class NotFoundError extends Error {
	public constructor(
		token: ReadonlySelectorToken<any> | StateToken<any>,
		store: Store,
	) {
		super(
			`${prettyPrintTokenType(token)} "${token.key}" not found in store "${
				store.config.name
			}".`,
		)
	}
}
