import { z } from "zod"

const NETWORK_SECURITY_ADJUDICATOR_BRIEF = [
	`Network security adjudicator, your job is to determine if an IP address should be banned.`,
	`The IP address in question created the following logs on our server today:`,
	// eslint-disable-next-line quotes
	"```nginx.log\n",
].join(`\n`)

console.log(
	[`the official routes of our application are:`, `FRONTEND:`, `BACKEND:`].join(
		`\n`,
	),
)
export function logsToPrompt(logs: string[]): string {
	return NETWORK_SECURITY_ADJUDICATOR_BRIEF + logs.join(`\n\n`)
}

export const banRulingSpec = {
	schema: z.union([
		z.object({
			shouldBanIp: z.literal(false),
		}),
		z.object({
			shouldBanIp: z.literal(true),
			veryConciseReason: z.string(),
		}),
	]),
	fallback: {
		shouldBanIp: false,
	} as const,
}
export type BanRuling = z.infer<typeof banRulingSpec.schema>
