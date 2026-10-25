import z from "zod"

import { cli, options } from "../../src/cli"

const parse = cli({
	cliName: `config-probe`,
	discoverConfigPath: () => process.env[`COMLINE_CONFIG_PATH`] ?? `config.ts`,
	routeOptions: {
		"": options(`probe`, z.object({ foo: z.string() }), {
			foo: { description: `foo`, example: `--foo=hello`, required: true },
		}),
	},
})

const result = process.env[`COMLINE_ASYNC`]
	? await parse.async(process.argv)
	: parse(process.argv)
console.log(JSON.stringify(result.inputs.opts))
