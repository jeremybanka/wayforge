import { Resend } from "resend"

import CompleteAccountAction from "../../emails/CompleteAccountAction"
import type { AccountActionTypeActual } from "../database/tempest-db-schema"
import { env } from "../library/env"
import { summarizeAccountAction } from "./account-actions"

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
	const { subject, summary } = summarizeAccountAction({
		username,
		action,
		oneTimeCode,
	})
	await resend.emails.send({
		from: `Tempest Games <noreply@tempest.games>`,
		to,
		subject,
		react: (
			<CompleteAccountAction
				subject={subject}
				summary={summary}
				oneTimeCode={oneTimeCode}
				baseUrl={baseUrl}
			/>
		),
	})
}
