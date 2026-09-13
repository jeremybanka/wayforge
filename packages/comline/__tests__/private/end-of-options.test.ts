import { required } from "treetrunks"
import z from "zod"

import { cli, options, parseNumberOption } from "../../src/cli"
import { argv } from "../fixtures/argv"

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

test.each([`--name=after`, `-n`, `-ncc`, `--`])(
	`preserves routes before the delimiter and literal positionals after it: %s`,
	(token) => {
		const routedCli = cli({
			cliName: `probe`,
			discoverConfigPath: () => undefined,
			routes: required({ run: required({ $value: null }) }),
			routeOptions: { "run/$value": optionGroup },
		})
		expect(
			routedCli(argv(`--name`, `before`, `run`, `--`, token)).inputs,
		).toEqual({
			case: `run/$value`,
			path: [`run`, token],
			opts: { name: `before` },
		})
	},
)
