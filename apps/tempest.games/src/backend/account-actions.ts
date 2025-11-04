import type { AccountActionTypeActual } from "../database/tempest-db-schema"
import { digitRand } from "../library/rand"

export function genAccountActionCode(): string {
	return digitRand(6)
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
}: SummarizeAccountActionData): {
	subjectExternal: string
	subjectInternal: string
	summary: string
} {
	let subjectInternal: string
	let summary: string
	switch (action) {
		case `confirmEmail`:
			subjectInternal = `Welcome to Tempest!`
			summary = `Your one-time code to set up your account.`
			break
		case `resetPassword`:
			subjectInternal = `Approve password reset?`
			summary = `Your one-time code to make a new password.`

			break
		case `signIn`:
			subjectInternal = `Welcome back, ${username}!`
			summary = `Your one-time code to get signed in.`
	}
	const subjectExternal = `${oneTimeCode} ← ${subjectInternal}`
	return { subjectExternal, subjectInternal, summary }
}
