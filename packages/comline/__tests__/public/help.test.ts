import { cli } from "../../src/cli"
import type { TerminalColors } from "../../src/help"
import { help, helpOption, renderTable } from "../../src/help"
import { argv } from "../fixtures/argv"
import {
	createHelpCli,
	propertySchemas,
	renderPropertyHelp,
	renderRefinedSchemaHelp,
} from "../fixtures/help-cases"

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
		const rendered = renderTable(
			[[`hello`]],
			() => ({
				align: `left`,
				foregroundColor: `green`,
				backgroundColor: `blue`,
				padLeft: `[`,
				padRight: `]`,
			}),
			colors,
		)
		expect(rendered.replace(/<\/?(?:blue|green)>/g, ``)).toBe(`[hello]\n`)
		expect(rendered).toContain(`<blue>`)
		expect(rendered).toContain(`<green>`)
		expect(rendered).toMatch(/^\[.*\]\n$/)
	})

	it(`renders an empty table without formatting any cells`, () => {
		const format = vi.fn(() => ({ align: `left` as const }))
		expect(renderTable([], format)).toBe(``)
		expect(format).not.toHaveBeenCalled()
		expect(
			help({ cliName: `empty`, routeOptions: {} }, { forceColor: false }),
		).toContain(`empty`)
	})
})

describe(`help`, () => {
	const testCli = createHelpCli()
	it(`represents the help text for a cli`, () => {
		const manual = help(testCli.definition, { forceColor: true })
		for (const content of [
			`greasy-hands`,
			testCli.definition.cliDescription,
			`apply-more-grease`,
			`touch`,
			`target`,
			`--help`,
			`--grease-type=motor-oil`,
			`--amount=1`,
			`the type of grease to apply`,
			`the amount of grease to apply`,
		])
			expect(manual).toContain(content)
		expect(manual).toMatch(/required/i)
	})

	it.each(propertySchemas)(
		`describes %s in plain help text`,
		(_label, propertySchema, expected) => {
			const manual = renderPropertyHelp(propertySchema)
			expect(manual).toContain(`--value=example`)
			expect(manual).toContain(`value to use`)
			if (expected !== `unknown`) {
				for (const value of expected.split(` | `))
					expect(manual).toContain(value.replaceAll(`"`, ``))
			}
			expect(manual).not.toContain(`\x1B[`)
		},
	)

	it(`keeps help available when a schema cannot export JSON Schema`, () => {
		const manual = renderRefinedSchemaHelp()
		expect(manual).toContain(`--value=example`)
		expect(manual).toContain(`value to use`)
		expect(manual).toMatch(/required/i)
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
