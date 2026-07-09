import { styleText } from "node:util"

import { type CommandLineInterface, options, type OptionsGroup } from "./cli"
import { parseBooleanOption } from "./option-parsers"
import {
	type JsonSchema,
	type OptionsSchema,
	retrieveInputJsonSchema,
} from "./schema"

const capitalize = <T extends string>(str: T): Capitalize<T> =>
	(str[0].toUpperCase() + str.slice(1)) as Capitalize<T>

export type TerminalColor =
	| `black`
	| `blue`
	| `bold`
	| `cyan`
	| `green`
	| `magenta`
	| `red`
	| `reset`
	| `white`
	| `yellow`
export type TerminalBackgroundColor =
	`bg${Capitalize<Exclude<TerminalColor, `bold` | `reset`>>}`
export type TerminalColors = Record<
	TerminalBackgroundColor | TerminalColor,
	(text: string) => string
>
export type CellFormat = {
	fill?: string
	align: `left` | `right`
	padLeft?: string
	padRight?: string
	foregroundColor?: TerminalColor
	backgroundColor?: Exclude<TerminalColor, `bold` | `reset`>
}
export type CellContext = {
	x: number
	y: number
	xMax: number
	yMax: number
	cell: string
	row: string[]
	table: string[][]
}
export type FormatCell = (ctx: CellContext) => CellFormat

function formatText(
	format: TerminalBackgroundColor | TerminalColor,
	text: string,
	colors?: TerminalColors | boolean,
): string {
	if (typeof colors === `object`) {
		return colors[format](text)
	}
	if (colors === false) {
		return text
	}
	if (colors === true) {
		return styleText(format, text, {
			validateStream: false,
		})
	}
	return styleText(format, text)
}

export function renderTable(
	table: string[][],
	format: FormatCell,
	colors?: TerminalColors | boolean,
): string {
	const longestRow = table.reduce(
		(acc, row) => (acc.length > row.length ? acc : row),
		table[0],
	)
	const columnWidths = longestRow.map((cell) => cell.length)
	for (const row of table) {
		for (const [index, cell] of row.entries()) {
			columnWidths[index] = Math.max(columnWidths[index], cell.length)
		}
	}
	const rows = table.map((row, y) => {
		const cells = row.map((cell: string, x) => {
			const xMax = row.length - 1
			const yMax = table.length - 1
			const cellFormat = format({
				x,
				y,
				xMax,
				yMax,
				cell,
				row,
				table,
			})
			return {
				cell,
				cellFormat,
			}
		})
		return cells
	})
	return rows.reduce((acc, row) => {
		const rowText = row.reduce((a, { cell, cellFormat }, x) => {
			const columnWidth = columnWidths[x]
			const { padLeft = ``, padRight = `` } = cellFormat
			let cellText = cell

			switch (cellFormat.align) {
				case `left`: {
					if (cellText && cellText.length < columnWidth) {
						cellText = `${cellText} `
					}
					cellText = `${cellText}`.padEnd(columnWidth, cellFormat.fill)
					break
				}
				case `right`: {
					if (cellText && cellText.length < columnWidth) {
						cellText = ` ${cellText}`
					}
					cellText = `${cellText}`.padStart(columnWidth, cellFormat.fill)
					break
				}
			}
			const { foregroundColor, backgroundColor } = cellFormat
			if (foregroundColor) {
				cellText = formatText(foregroundColor, cellText ?? ``, colors)
			}
			if (backgroundColor) {
				cellText = formatText(
					`bg${capitalize(backgroundColor)}`,
					cellText,
					colors,
				)
			}
			cellText = `${padLeft}${cellText}${padRight}`

			return `${a}${cellText}`
		}, ``)
		return `${acc}${rowText}\n`
	}, ``)
}

export type HelpOptions = {
	forceColor?: boolean
}

function shallowlyStringifyJsonSchema(
	jsonSchema: JsonSchema | undefined,
): string {
	if (jsonSchema === undefined) {
		return `unknown`
	}
	if (`type` in jsonSchema) {
		if (typeof jsonSchema.type === `string`) {
			return jsonSchema.type
		}
		return jsonSchema.type.join(` | `)
	}
	if (`enum` in jsonSchema) {
		return jsonSchema.enum.map((e) => JSON.stringify(e)).join(` | `)
	}
	if (`const` in jsonSchema) {
		return JSON.stringify(jsonSchema.const)
	}
	return `unknown`
}

export function help(
	cli: CommandLineInterface<any>,
	helpOptions?: HelpOptions,
): string {
	return [
		renderTable(
			[[cli.cliName, cli.cliDescription ?? `cli`]],
			({ x }) =>
				assemble<CellFormat>(
					{
						align: `left`,
						padRight: ` `,
					},
					[x === 0, { foregroundColor: `bold` }],
				),
			helpOptions?.forceColor,
		),
		`USAGE`,
		renderTable(
			Object.entries(cli.routeOptions).flatMap(([route, value]) => {
				const rows: string[][] = []
				const prettyRoute = route
					.split(`/`)
					.map((s) => (s.includes(`$`) ? `<${s.replaceAll(`$`, ``)}>` : s))
					.join(` `)
				rows.push([`$`, cli.cliName, prettyRoute, value?.description ?? ``])
				if (value?.optionConfigs) {
					rows.push(
						...Object.entries(value.optionConfigs).map(([key, option]) => {
							const flag = option.flag ? `-${option.flag}` : `  `
							const optionsSchema = value.optionsSchema

							let typeString = `unknown`
							try {
								const jsonSchema = retrieveInputJsonSchema(optionsSchema)
								const propertySchema = jsonSchema.properties?.[key]
								typeString = shallowlyStringifyJsonSchema(propertySchema)
							} catch {}
							if (option.required) {
								typeString = `${typeString} (required)`
							}

							return [
								``,
								``,
								`${flag}, ${option.example}`,
								`${typeString}: ${option.description ?? ``}`,
							]
						}),
					)
				}
				return rows
			}),

			({ x, xMax, cell, row }) => {
				return assemble<CellFormat>(
					{ align: `left`, padRight: ` ` },
					[
						(x < xMax && row[1] === cli.cliName) || cell.startsWith(`-`),
						{ foregroundColor: `magenta` },
					],
					[x > 1 && x < xMax && Boolean(row[x + 1]), { fill: `.` }],
				)
			},

			helpOptions?.forceColor,
		),
	].join(`\n`)
}

function assemble<T extends Object>(
	base: T,
	...overrides: [cond: boolean, ext: Partial<T>][]
) {
	return overrides
		.filter(([cond]) => cond)
		.reduce((acc, [, ext]) => Object.assign(acc, ext), base)
}

const helpOptionsJsonSchema: JsonSchema = {
	$schema: `https://json-schema.org/draft/2020-12/schema`,
	additionalProperties: false,
	type: `object`,
	properties: {
		help: {
			type: `boolean`,
		},
	},
}

const helpOptionsSchema: OptionsSchema<{ help?: boolean | undefined }> = {
	"~standard": {
		version: 1,
		vendor: `comline`,
		validate: (value) => {
			if (typeof value !== `object` || value === null || Array.isArray(value)) {
				return { issues: [{ message: `Expected an object.` }] }
			}
			const helpValue = (value as { help?: unknown }).help
			if (helpValue !== undefined && typeof helpValue !== `boolean`) {
				return {
					issues: [{ message: `Expected a boolean.`, path: [`help`] }],
				}
			}
			return { value: helpValue === undefined ? {} : { help: helpValue } }
		},
		jsonSchema: {
			input: () => helpOptionsJsonSchema,
			output: () => helpOptionsJsonSchema,
		},
	},
}

export function helpOption(
	description = ``,
): OptionsGroup<{ help?: boolean | undefined }> {
	return options(description, helpOptionsSchema, {
		help: {
			description: `show this help text`,
			example: `--help`,
			flag: `h`,
			parse: parseBooleanOption,
			required: false,
		},
	})
}
