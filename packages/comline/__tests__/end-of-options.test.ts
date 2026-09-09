import { required } from "treetrunks"
import z from "zod"

import { cli, options, parseNumberOption } from "../src/cli"

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

const rootCli = cli({
	cliName: `probe`,
	discoverConfigPath: () => undefined,
	routeOptions: { "": optionGroup },
})

test.each([
	[`--name=after`],
	[`--name`, `after`],
	[`-n=after`],
	[`-n`, `after`],
	[`-ncc`],
	[`--`, `--name=after`],
])(`ignores options after the delimiter: %j`, (...tokens) => {
	expect(rootCli([`probe`, `--`, ...tokens]).inputs.opts).toEqual({})
	expect(
		rootCli([`probe`, `--name=before`, `-c`, `--`, ...tokens]).inputs.opts,
	).toEqual({ name: `before`, count: 1 })
})

test(`the delimiter is not consumed as a separated value`, () => {
	expect(rootCli([`probe`, `--name`, `--`, `after`]).inputs.opts).toEqual({
		name: ``,
	})
})

test.each([`--name=--`, `-n=--`])(
	`keeps an inline delimiter value: %s`,
	(token) => {
		expect(rootCli([`probe`, token]).inputs.opts).toEqual({ name: `--` })
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
			routedCli([`probe`, `--name`, `before`, `run`, `--`, token]).inputs,
		).toEqual({
			case: `run/$value`,
			path: [`run`, token],
			opts: { name: `before` },
		})
	},
)

test(`a trailing delimiter does not discard a complete route`, () => {
	const routedCli = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: required({ run: null }),
		routeOptions: { run: optionGroup },
	})
	expect(routedCli([`probe`, `run`, `--`]).inputs.case).toBe(`run`)
})

test(`a literal containing the CLI name is not mistaken for the invocation`, () => {
	const routedCli = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: required({ $value: null }),
		routeOptions: { $value: optionGroup },
	})
	expect(routedCli([`--`, `probe`]).inputs.path).toEqual([`probe`])
})
