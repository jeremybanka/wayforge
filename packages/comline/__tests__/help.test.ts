import { type } from "arktype"

import {
	cli,
	noOptions,
	optional,
	options,
	parseNumberOption,
	parseStringOption,
	required,
} from "../src/cli"
import type { TerminalColors } from "../src/help"
import { help, helpOption, renderTable } from "../src/help"
import type { JsonSchema, OptionsSchema } from "../src/schema"
import { argv } from "./fixtures/argv"

describe(`renderTable`, () => {
	it(`aligns uneven rows with fill and outer padding`, () => {
		expect(
			renderTable(
				[[`a`, `long`], [`wide`, `b`], [``, `xy`], [`last`]],
				({ x }) => ({
					align: x === 0 ? `right` : `left`,
					fill: `.`,
					padLeft: `[`,
					padRight: `]`,
				}),
				false,
			),
		).toBe(`[.. a][long]\n[wide][b ..]\n[....][xy .]\n[last]\n`)
	})

	it(`applies custom foreground and background colors inside padding`, () => {
		const colors = {
			green: (text: string) => `<green>${text}</green>`,
			bgBlue: (text: string) => `<blue>${text}</blue>`,
		} as TerminalColors
		expect(
			renderTable(
				[[`hello`]],
				() => ({
					align: `left`,
					foregroundColor: `green`,
					backgroundColor: `blue`,
					padLeft: `[`,
					padRight: `]`,
				}),
				colors,
			),
		).toBe(`[<blue><green>hello</green></blue>]\n`)
	})

	it(`renders an empty table without formatting any cells`, () => {
		const format = vi.fn(() => ({ align: `left` as const }))
		expect(renderTable([], format)).toBe(``)
		expect(format).not.toHaveBeenCalled()
		expect(
			help({ cliName: `empty`, routeOptions: {} }, { forceColor: false }),
		).toBe(`empty cli \n\nUSAGE\n`)
	})
})

describe(`help`, () => {
	const testCli = cli({
		cliName: `greasy-hands`,
		cliDescription: `...when your hands are greasy, they leave streaks everywhere`,
		routes: optional({
			"apply-more-grease": null,
			touch: required({
				$target: null,
			}),
		}),
		routeOptions: {
			"": helpOption(`rub your greasy hands together`),
			"apply-more-grease": options(
				`put grease on your hands`,
				type({ type: `string`, "amount?": `number` }),
				{
					type: {
						description: `the type of grease to apply`,
						example: `--grease-type=motor-oil`,
						flag: `t`,
						parse: parseStringOption,
						required: true,
					},
					amount: {
						description: `the amount of grease to apply`,
						example: `--amount=1`,
						flag: `m`,
						parse: parseNumberOption,
						required: false,
					},
				},
			),
			"touch/$target": noOptions(`touch the target and get it all greased up`),
		},
	})
	it(`represents the help text for a cli`, () => {
		const manual = help(testCli.definition, { forceColor: true })
		expect(manual).toMatchInlineSnapshot(
			`"` +
				`\x1B[1mgreasy-hands\x1B[22m ...when your hands are greasy, they leave streaks everywhere \n` +
				`\n` +
				`USAGE\n` +
				`\x1B[35m$\x1B[39m \x1B[35mgreasy-hands\x1B[39m \x1B[35m...........................\x1B[39m rub your greasy hands together                 \n` +
				`               \x1B[35m-h, --help ................\x1B[39m boolean: show this help text                   \n` +
				`\x1B[35m$\x1B[39m \x1B[35mgreasy-hands\x1B[39m \x1B[35mapply-more-grease .........\x1B[39m put grease on your hands                       \n` +
				`               \x1B[35m-t, --grease-type=motor-oil\x1B[39m string (required): the type of grease to apply \n` +
				`               \x1B[35m-m, --amount=1 ............\x1B[39m number: the amount of grease to apply          \n` +
				`\x1B[35m$\x1B[39m \x1B[35mgreasy-hands\x1B[39m \x1B[35mtouch <target> ............\x1B[39m touch the target and get it all greased up     \n` +
				`"`,
		)
	})

	it.each<[string, JsonSchema | undefined, string]>([
		[`nullable types`, { type: [`string`, `null`] }, `string | null`],
		[`enumerated values`, { enum: [`fast`, `slow`] }, `"fast" | "slow"`],
		[`constant values`, { const: 0 }, `0`],
		[
			`complex schemas`,
			{ anyOf: [{ type: `string` }, { type: `number` }] },
			`unknown`,
		],
		[`missing property schemas`, undefined, `unknown`],
	])(`describes %s in plain help text`, (_label, propertySchema, expected) => {
		const jsonSchema = {
			type: `object`,
			properties: propertySchema ? { value: propertySchema } : {},
		}
		const schema: OptionsSchema<{ value?: string }> = {
			"~standard": {
				version: 1,
				vendor: `test`,
				validate: () => ({ value: {} }),
				jsonSchema: { input: () => jsonSchema, output: () => jsonSchema },
			},
		}
		const manual = help(
			{
				cliName: `schema-cli`,
				routeOptions: {
					"": options(``, schema, {
						value: {
							required: false,
							description: `value to use`,
							example: `--value=example`,
						},
					}),
				},
			},
			{ forceColor: false },
		)
		expect(manual).toContain(`--value=example`)
		expect(manual).toContain(`${expected}: value to use`)
		expect(manual).not.toContain(`\x1B[`)
	})

	it(`keeps help available when a schema cannot export JSON Schema`, () => {
		const schema = type({
			value: type(`string`).narrow((value) => value.startsWith(`x`)),
		})
		const manual = help(
			{
				cliName: `refined-cli`,
				routeOptions: {
					"": options(``, schema, {
						value: {
							required: true,
							description: `value to use`,
							example: `--value=example`,
						},
					}),
				},
			},
			{ forceColor: false },
		)
		expect(manual).toContain(`--value=example`)
		expect(manual).toContain(`unknown (required): value to use`)
	})
})

describe(`helpOption`, () => {
	const testCli = cli({
		cliName: `help-cli`,
		routeOptions: { "": helpOption() },
	})
	it.each([
		{ args: [], expected: {} },
		{ args: [`-h`], expected: { help: true } },
		{ args: [`--help=false`], expected: { help: false } },
	])(`parses $args as $expected`, ({ args, expected }) => {
		expect(testCli(argv(...args)).inputs.opts).toEqual(expected)
	})
})
