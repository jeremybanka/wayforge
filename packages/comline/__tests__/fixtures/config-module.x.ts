import z from "zod"

import { cli, options } from "../../src/cli"

const parse = cli({
	cliName: `config-probe`,
	discoverConfigPath: () => `config.ts`,
	routeOptions: {
		"": options(`probe`, z.object({ foo: z.string() }), {
			foo: { description: `foo`, example: `--foo=hello`, required: true },
		}),
	},
})

console.log(JSON.stringify(parse(process.argv).inputs.opts))
