import { readFileSync } from "node:fs"

import { type } from "arktype"
import z from "zod"

import { cli, options, parseStringOption } from "../../src/cli"
import type { OptionsSchema } from "../../src/schema"
import { argv } from "./argv"

export const configSchemas = [
	{ name: `Arktype`, schema: type({ foo: `string` }) },
	{ name: `Zod`, schema: z.object({ foo: z.string() }) },
]

export function createConfigSchemaCli(schema: OptionsSchema<{ foo: string }>) {
	const optionConfigs = {
		foo: {
			description: `foo`,
			example: `--foo=hello`,
			flag: `f` as const,
			parse: parseStringOption,
			required: true,
		},
	}
	return cli({
		cliName: `my-cli`,
		routeOptions: { "": options(`blah`, schema, optionConfigs) },
	})
}

export function writeExampleSchema(
	testCli: ReturnType<typeof cli>,
	tempDir: string,
) {
	const { writeJsonSchema } = testCli(argv(`--foo=hello`))
	writeJsonSchema(tempDir)
	return JSON.parse(readFileSync(`${tempDir}/my-cli.main.schema.json`, `utf-8`))
}
