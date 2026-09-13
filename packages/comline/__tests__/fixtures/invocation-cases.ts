import { required } from "treetrunks"
import z from "zod"

import { cli, options, parseNumberOption } from "../../src/cli"

export function createInvocationCli() {
	const command = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: required({ run: null }),
		routeOptions: {
			run: options(`run`, z.object({ name: z.string().optional() }), {
				name: { description: `name`, example: ``, required: false },
			}),
		},
	})
	return command
}

export function createDelimiterOptions() {
	const optionGroup = options(
		`delimiter test`,
		z.object({ name: z.string().optional(), count: z.number().optional() }),
		{
			name: { description: `name`, example: ``, required: false, flag: `n` },
			count: {
				description: `count`,
				example: ``,
				required: false,
				flag: `c`,
				parse: parseNumberOption,
			},
		},
	)
	return optionGroup
}

export const invocationPrefixes = [
	[`/opt/probe-tools/bin/node`, `/work/probe.x.ts`],
	[`/home/probe/.bun/bin/bun`, `/work/entry.ts`],
	[`C:\\probe-tools\\custom-runtime.exe`, `C:\\work\\entry.js`],
	[`/arbitrary/runtime`, `/global/bin/renamed-command`],
	[`--name=runtime`, `--name=entrypoint`],
]

export const literalOptionTokens = [`--name=after`, `-n`, `-ncc`, `--`]
