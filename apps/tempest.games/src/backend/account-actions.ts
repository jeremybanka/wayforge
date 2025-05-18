import type { AccountActionTypeActual } from "../database/tempest-db-schema"
import { alphaRand } from "../library/alpha-rand"

export function genAccountActionCode(): string {
	return alphaRand(4) + `_` + alphaRand(4)
}

export type SummarizeAccountActionData = {
	action: AccountActionTypeActual
	username: string
	oneTimeCode: string
}
export function summarizeAccountAction({
	action,
	username,
	oneTimeCode,
}: SummarizeAccountActionData): { subject: string; summary: string } {
	switch (action) {
		case `confirmEmail`:
			return {
				subject: `Welcome`,
				summary: `${oneTimeCode} is your one-time code to set up your account.`,
			}
		case `resetPassword`:
			return {
				subject: `Approve password reset?`,
				summary: `${oneTimeCode} is your one-time code to make a new password.`,
			}
		case `signIn`:
			return {
				subject: `Welcome back, ${username}`,
				summary: `${oneTimeCode} is your one-time code to get signed in.`,
			}
	}
}
