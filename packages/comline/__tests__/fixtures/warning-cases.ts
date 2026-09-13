import z from "zod"

import {
	cli,
	noOptions,
	optional,
	options,
	parseBooleanOption,
	required,
} from "../../src/cli"

export function createWarningFixture() {
	const runOptions = options(
		`run options`,
		z.object({ name: z.string().optional(), verbose: z.boolean().optional() }),
		{
			name: {
				description: `name`,
				example: `--name=value`,
				required: false,
				flag: `n`,
				aliases: [`label`],
			},
			verbose: {
				description: `verbose`,
				example: `--verbose`,
				required: false,
				flag: `v`,
				aliases: [`chatty`],
				parse: parseBooleanOption,
			},
		},
	)
	const otherOptions = options(
		`other options`,
		z.object({ dry: z.boolean().optional() }),
		{
			dry: {
				description: `dry run`,
				example: `--dry`,
				required: false,
				flag: `d`,
				aliases: [`dry-run`],
				parse: parseBooleanOption,
			},
		},
	)
	const definition = {
		cliName: `probe`,
		discoverConfigPath: () => undefined,
		routes: optional({
			run: null,
			other: null,
			duplicate: null,
			empty: null,
			show: required({ $name: null }),
		}),
		routeOptions: {
			"": noOptions(),
			run: runOptions,
			other: otherOptions,
			duplicate: otherOptions,
			empty: null,
			"show/$name": noOptions(),
		},
	}
	const testCli = cli(definition)
	return { runOptions, otherOptions, definition, testCli }
}

export function createWarningPresentationCli() {
	const testCli = cli({
		cliName: `probe`,
		routes: optional({ run: null, show: required({ $name: null }) }),
		routeOptions: {
			"": noOptions(),
			run: noOptions(),
			"show/$name": noOptions(),
		},
	})
	return testCli
}
