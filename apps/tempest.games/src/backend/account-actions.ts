import type { AccountAction } from "../database/tempest-db-schema"
import { alphaRand } from "../library/alpha-rand"

export function genAccountActionToken(): string {
	return alphaRand(4) + `_` + alphaRand(4)
}

export function prettyPrintAccountAction(
	action: Exclude<AccountAction[`action`], `cooldown`>,
): string {
	switch (action) {
		case `confirmEmail`:
			return `Confirm your email address`
		case `resetPassword`:
			return `Reset your password`
		case `login`:
			return `Login`
	}
}
