import type { AccountAction } from "../database/tempest-db-schema"
import { alphaRand } from "../library/alpha-rand"

export function genAccountActionCode(): string {
	return alphaRand(4) + `_` + alphaRand(4)
}

export function prettyPrintAccountAction(
	action: Exclude<AccountAction[`action`], `cooldown`>,
	username: string,
): [header: string, summary: string] {
	switch (action) {
		case `confirmEmail`:
			return [`Welcome`, `Here's a one-time code to set up your new account.`]
		case `resetPassword`:
			return [
				`Approve password reset?`,
				`Here's a one-time code that will let you make a new password.`,
			]
		case `signIn`:
			return [
				`Welcome back, ${username}`,
				`Here's a one-time code to sign into your account.`,
			]
	}
}
