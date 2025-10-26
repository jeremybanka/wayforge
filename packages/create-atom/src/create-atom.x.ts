#!/usr/bin/env node

import * as path from "node:path"

import type { OptionsGroup } from "comline"
import {
	cli,
	encapsulate,
	helpOption,
	optional,
	parseBooleanOption,
} from "comline"
import { z } from "zod/v4"

import type { CreateAtomOptionsPreloaded } from "./create-atom"
import { createAtom } from "./create-atom"

const helper = helpOption()

const BREAK_CHECK_MANUAL = {
	description: `Check for breaking changes in a package.`,
	optionsSchema: z.object({
		packageManager: z
			.union([
				z.literal(`bun`),
				z.literal(`npm`),
				z.literal(`pnpm`),
				z.literal(`yarn`),
			])
			.optional(),
		skipHints: z.boolean().optional(),
	}),
	options: {
		...helper.options,
		packageManager: {
			flag: `m`,
			required: false,
			description: `The package manager to use.`,
			example: `--packageManager="npm"`,
		},
		skipHints: {
			flag: `k`,
			required: false,
			description: `Silences the 'Getting Started' info, mainly for use in other initializers that may wrap this one but provide their own scripts/instructions.`,
			example: `--skipHints`,
			parse: parseBooleanOption,
		},
	},
} satisfies OptionsGroup<CreateAtomOptionsPreloaded>

const parse = cli(
	{
		cliName: `create-atom`,
		routes: optional({ projectName: null }),
		routeOptions: {
			"": BREAK_CHECK_MANUAL,
			projectName: BREAK_CHECK_MANUAL,
		},
		discoverConfigPath: (args) => {
			if (args[0] === `schema`) {
				return
			}
			const configPath =
				args[0] ?? path.join(process.cwd(), `create-atom.config.json`)
			return configPath
		},
	},
	console,
)
const { inputs } = parse(process.argv)

await encapsulate(() => createAtom(inputs.case, inputs.opts), {
	console: true,
	stdout: true,
})
