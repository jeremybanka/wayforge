import { styleText } from "node:util"

import takua, { INTENTIONALLY_LEFT_BLANK } from "takua"

export function createLogger(
	...context: string[]
): Pick<typeof takua, `error` | `info`> {
	const logger = {
		info: (status: string, message: string, datum?: unknown) => {
			takua.info(
				[...context, styleText([`blue`], status)].join(`:`),
				message,
				datum === undefined ? INTENTIONALLY_LEFT_BLANK : datum,
			)
		},
		error: (status: string, message: string, datum?: unknown) => {
			takua.error(
				[...context, styleText([`blue`], status)].join(`:`),
				message,
				datum === undefined ? INTENTIONALLY_LEFT_BLANK : datum,
			)
		},
	}
	return logger
}
