import { type } from "arktype"

import {
	cli,
	noOptions,
	optional,
	options,
	parseNumberOption,
	parseStringOption,
	required,
} from "../../src/cli"
import { help, helpOption } from "../../src/help"
import type { JsonSchema, OptionsSchema } from "../../src/schema"

export function createHelpCli() {
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
	return testCli
}

export const propertySchemas: [string, JsonSchema | undefined, string][] = [
	[`nullable types`, { type: [`string`, `null`] }, `string | null`],
	[`enumerated values`, { enum: [`fast`, `slow`] }, `"fast" | "slow"`],
	[`constant values`, { const: 0 }, `0`],
	[
		`complex schemas`,
		{ anyOf: [{ type: `string` }, { type: `number` }] },
		`unknown`,
	],
	[`missing property schemas`, undefined, `unknown`],
]

export function renderPropertyHelp(
	propertySchema: JsonSchema | undefined,
): string {
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
	return manual
}

export function renderRefinedSchemaHelp(): string {
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
	return manual
}
