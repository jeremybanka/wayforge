import { OpenAiSafeGenerator } from "safegen/openai"

import { env } from "../../library/env"

export function logsToPrompt(logs: string[]): string {
	let p = ``
	p += `As the chief network security adjudicator unit,`
	p += `your responsibility is to determine whether an IP address should be blocked.\n`
	p += `\n`
	p += `The IP address in question created the following logs on our server today:\n`
	// eslint-disable-next-line quotes
	p += "```nginx.log\n"
	for (const log of logs) {
		p += `${log}\n`
	}
	// eslint-disable-next-line quotes
	p += "```\n"
	return p
}

export const gpt4Gen = new OpenAiSafeGenerator(
	`gpt-4o`,
	// biome-ignore lint/style/noNonNullAssertion: We'll handle this on the following lines
	env.OPENAI_API_KEY!,
)
if (env.OPENAI_API_KEY === undefined && !(`VITEST` in import.meta.env)) {
	throw new Error(`OPENAI_API_KEY is not set and vitest is not running.`)
}

export function makeRulingOnEvidence(
	logger: Pick<Console, `error` | `info`>,
	evidence: string,
): void {}
