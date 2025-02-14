import { z } from "zod"

import type { OptionsGroup } from "../src/cli"
import {
	cli,
	optional,
	parseNumberOption,
	parseStringOption,
	required,
} from "../src/cli"
import type { CellFormat } from "../src/help"
import { help, renderTable } from "../src/help"

function noOptions(description?: string): OptionsGroup<Record<string, never>> {
	const optionsGroup: OptionsGroup<Record<string, never>> = {
		optionsSchema: z.object({}),
		options: {},
	}
	if (description) {
		Object.assign(optionsGroup, { description })
	}
	return optionsGroup
}

test(`renderTable`, () => {
	console.log(
		renderTable(
			[
				[`foo`, `bar`],
				[`fooooooooooooooooooooooo`, `baaaaaaaaaaaaaaaaaaaaaar`],
			],
			({ x }) => {
				const base: CellFormat = {
					align: `left`,
					foregroundColor: `green`,
					fill: ` `,
				}
				if (x === 0) {
					Object.assign(base, {
						align: `right`,
						padRight: ` `,
					})
				}
				return base
			},
		),
	)
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
			"": noOptions(`rub your greasy hands together`),
			"apply-more-grease": {
				description: `put grease on your hands`,
				optionsSchema: z.object({
					type: z.string(),
					amount: z.number().optional(),
				}),
				options: {
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
			},
			"touch/$target": noOptions(`touch the target and get it all greased up`),
		},
	})
	it(`represents the help text for a cli`, () => {
		const manual = help(testCli.definition)
		console.log(manual)
		expect(manual).toMatchInlineSnapshot(
			`"` +
				`\x1B[1mgreasy-hands\x1B[22m ...when your hands are greasy, they leave streaks everywhere \n` +
				`\n` +
				`USAGE\n` +
				`\x1B[35m$\x1B[39m \x1B[35mgreasy-hands\x1B[39m \x1B[35m...........................\x1B[39m rub your greasy hands together                 \n` +
				`\x1B[35m$\x1B[39m \x1B[35mgreasy-hands\x1B[39m \x1B[35mapply-more-grease .........\x1B[39m put grease on your hands                       \n` +
				`               \x1B[35m-t, --grease-type=motor-oil\x1B[39m string (required): the type of grease to apply \n` +
				`               \x1B[35m-m, --amount=1 ............\x1B[39m number: the amount of grease to apply          \n` +
				`\x1B[35m$\x1B[39m \x1B[35mgreasy-hands\x1B[39m \x1B[35mtouch <target> ............\x1B[39m touch the target and get it all greased up     \n` +
				`"`,
		)
	})
})
