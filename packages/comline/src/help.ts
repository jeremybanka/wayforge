import pc from "picocolors"
import type { Colors } from "picocolors/types"
import { z } from "zod"

import type { CommandLineInterface, OptionsGroup } from "./cli"
import { parseBooleanOption } from "./option-parsers"

const capitalize = <T extends string>(str: T): Capitalize<T> =>
	(str[0].toUpperCase() + str.slice(1)) as Capitalize<T>

const lower = <T extends string>(str: T): Lowercase<T> =>
	(str[0].toLowerCase() + str.slice(1)) as Lowercase<T>

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

export function renderTable(
	table: string[][],
	format: FormatCell,
	// chalk: InstanceType<typeof Chalk>,
	pico: Colors,
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
				cellText = pico[foregroundColor](cellText ?? ``)
			}
			if (backgroundColor) {
				cellText = pico[`bg${capitalize(backgroundColor)}`](cellText)
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

export function help(
	cli: CommandLineInterface<any>,
	options?: HelpOptions,
): string {
	const pico = pc.createColors(options?.forceColor)
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
			pico,
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
				if (value?.options) {
					rows.push(
						...Object.entries(value.options).map(([key, option]) => {
							const flag = option.flag ? `-${option.flag}` : ` . `
							const optionsSchema = value.optionsSchema as z.ZodObject<any>
							const optionDef = optionsSchema.shape[key]._def
							let type = optionDef.typeName as string

							if (type === `ZodOptional`) {
								type = optionDef.innerType._def.typeName as string
							}
							type = lower(type.replaceAll(`Zod`, ``))
							if (option.required) {
								type = `${type} (required)`
							}
							return [
								``,
								``,
								`${flag}, ${option.example}`,
								`${type}: ${option.description ?? ``}`,
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

			pico,
		),
	].join(`\n`)
}

function assemble<T extends Object>(
	base: T,
	...overrides: [cond: boolean, ext: Partial<T>][]
) {
	return overrides.reduce(
		(acc, [cond, ext]) => (cond ? Object.assign(acc, ext) : acc),
		base,
	)
}

export function helpOption(
	description = ``,
): OptionsGroup<{ help?: boolean | undefined }> {
	return {
		optionsSchema: z.object({
			help: z.boolean().optional(),
		}),
		options: {
			help: {
				description: `show this help text`,
				example: `--help`,
				flag: `h`,
				parse: parseBooleanOption,
				required: false,
			},
		},
		description,
	}
}
