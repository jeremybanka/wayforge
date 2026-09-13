import { required } from "treetrunks"

import { cli } from "../../src/cli"
import { argv } from "../fixtures/argv"
import { inputValues } from "../fixtures/contract-values"
import {
	createDelimiterOptions,
	literalOptionTokens,
} from "../fixtures/invocation-cases"

const optionGroup = createDelimiterOptions()

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
	expect(rootCli(argv(`--`, ...tokens)).inputs.opts).toEqual({})
	expect(
		rootCli(argv(`--name=before`, `-c`, `--`, ...tokens)).inputs.opts,
	).toEqual({
		name: `before`,
		count: 1,
	})
})

test(`the delimiter is not consumed as a separated value`, () => {
	expect(rootCli(argv(`--name`, `--`, `after`)).inputs.opts).toEqual({
		name: ``,
	})
})

test.each([`--name=--`, `-n=--`])(
	`keeps an inline delimiter value: %s`,
	(token) => {
		expect(rootCli(argv(token)).inputs.opts).toEqual({
			name: `--`,
		})
	},
)

test.each(literalOptionTokens)(
	`preserves routes before the delimiter and literal positionals after it: %s`,
	(token) => {
		const routedCli = cli({
			cliName: `probe`,
			discoverConfigPath: () => undefined,
			routes: required({ run: required({ $value: null }) }),
			routeOptions: { "run/$value": optionGroup },
		})
		expect(
			inputValues(
				routedCli(argv(`--name`, `before`, `run`, `--`, token)).inputs,
			),
		).toEqual(
			inputValues({
				case: `run/$value`,
				path: [`run`, token],
				opts: { name: `before` },
			}),
		)
	},
)

test(`a trailing delimiter does not discard a complete route`, () => {
	const routedCli = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: required({ run: null }),
		routeOptions: { run: optionGroup },
	})
	expect(routedCli(argv(`run`, `--`)).inputs.case).toBe(`run`)
})

test(`a literal containing the CLI name is not mistaken for the invocation`, () => {
	const routedCli = cli({
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: required({ $value: null }),
		routeOptions: { $value: optionGroup },
	})
	expect(routedCli(argv(`--`, `probe`)).inputs.path).toEqual([`probe`])
})
