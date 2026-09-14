import type { TerminalColors } from "../../src/help"
import { help, renderTable } from "../../src/help"
import {
	createHelpCli,
	propertySchemas,
	renderPropertyHelp,
	renderRefinedSchemaHelp,
} from "../fixtures/help-cases"

describe(`renderTable`, () => {
	it(`nests foreground inside background color markers`, () => {
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

	it(`uses the exact empty-command help layout`, () => {
		expect(
			help({ cliName: `empty`, routeOptions: {} }, { forceColor: false }),
		).toBe(`empty cli \n\nUSAGE\n`)
	})
})

describe(`help`, () => {
	const testCli = createHelpCli()
	it(`matches the complete colored help snapshot`, () => {
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

	it.each(propertySchemas)(
		`formats %s with the exact type-label punctuation`,
		(_label, propertySchema, expected) => {
			const manual = renderPropertyHelp(propertySchema)

			expect(manual).toContain(`${expected}: value to use`)
		},
	)

	it(`labels an unexportable schema as unknown in help`, () => {
		const manual = renderRefinedSchemaHelp()

		expect(manual).toContain(`unknown (required): value to use`)
	})
})
