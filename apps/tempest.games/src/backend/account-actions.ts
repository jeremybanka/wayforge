import type { AccountAction } from "../database/tempest-db-schema"
import { alphaRand } from "../library/alpha-rand"

export function genAccountActionToken(): string {
	return alphaRand(4) + `_` + alphaRand(4)
}

export function prettyPrintAccountAction(
	action: AccountAction[`action`],
): string {
	switch (action) {
		case `emailConfirm`:
			return `Confirm your email address`
		case `passwordReset`:
			return `Reset your password`
		case `emailChange`:
			return `Change your email address`
	}
}
