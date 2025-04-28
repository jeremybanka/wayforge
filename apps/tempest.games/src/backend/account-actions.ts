import type { AccountAction } from "../database/tempest-db-schema"
import { alphaRand } from "../library/alpha-rand"

export function genAccountActionToken(): string {
	return alphaRand(4) + `_` + alphaRand(4)
}

export function prettyPrintAccountAction(
	action: Exclude<AccountAction[`action`], `cooldown`>,
): [header: string, summary: string] {
	switch (action) {
		case `confirmEmail`:
			return [
				`Welcome to Tempest`,
				`Here's a one-time code to set up your account.`,
			]
		case `resetPassword`:
			return [
				`Reset your password`,
				`Here's a one-time code to set up a new password`,
			]
		case `signIn`:
			return [
				`Welcome Back to Tempest`,
				`Here's a one-time code to sign into your account`,
			]
	}
}
