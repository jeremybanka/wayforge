import { Resend } from "resend"

import ConfirmAccountAction from "../../emails/ConfirmAccountAction"
import type { AccountActionTypeActual } from "../database/tempest-db-schema"
import { env } from "../library/env"
import { summarizeAccountAction } from "./account-actions"
import { logger } from "./logger"

export const resend = new Resend(env.API_KEY_RESEND)

interface sendEmailToConfirmAccountActionData {
	to: string
	username: string
	action: AccountActionTypeActual
	oneTimeCode: string
	baseUrl: string
}

export async function sendEmailToConfirmAccountAction({
	to,
	username,
	action,
	oneTimeCode,
	baseUrl,
}: sendEmailToConfirmAccountActionData): Promise<void> {
	const { subjectExternal, subjectInternal, summary } = summarizeAccountAction({
		username,
		action,
		oneTimeCode,
	})
	try {
		await resend.emails.send({
			from: `Tempest Games <noreply@tempest.games>`,
			to,
			subject: subjectExternal,
			react: (
				<ConfirmAccountAction
					subjectInternal={subjectInternal}
					summary={summary}
					oneTimeCode={oneTimeCode}
					baseUrl={baseUrl}
				/>
			),
		})
	} catch (thrown) {
		if (Error.isError(thrown)) {
			logger.error(thrown.message)
		}
	}
}
