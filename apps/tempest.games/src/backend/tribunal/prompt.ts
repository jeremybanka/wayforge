import { type } from "arktype"
import { arktypeToJsonSchema } from "safegen/arktype"
const NETWORK_SECURITY_ADJUDICATOR_BRIEF = [
	`Network security adjudicator, your job is to determine if an IP address should be banned.`,
	`The IP address in question created the following logs on our server today:`,
	// eslint-disable-next-line quotes
	"```nginx.log\n",
].join(`\n`)

export function logsToPrompt(logs: string[]): string {
	return NETWORK_SECURITY_ADJUDICATOR_BRIEF + logs.join(`\n\n`)
}

export const banRulingSpec = {
	schema: type([
		{ shouldBanIp: `false` },
		`|`,
		{ shouldBanIp: `true`, veryConciseReason: `string` },
	]),
	toJsonSchema: arktypeToJsonSchema,
	fallback: {
		shouldBanIp: false,
	} as const,
}
export type BanRuling = typeof banRulingSpec.schema.infer
