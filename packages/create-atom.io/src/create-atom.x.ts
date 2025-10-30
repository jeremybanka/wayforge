#!/usr/bin/env node

import type { OptionsGroup } from "comline"
import { cli, helpOption, optional, parseBooleanOption } from "comline"
import { z } from "zod/v4"

import type { CreateAtomOptionsPreloaded } from "./create-atom.ts"
import { createAtom } from "./create-atom.ts"

const helper = helpOption()

const CREATE_ATOM_OPTS = {
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
		routes: optional({ $projectName: null }),
		routeOptions: {
			"": CREATE_ATOM_OPTS,
			$projectName: CREATE_ATOM_OPTS,
		},
	},
	{
		error: console.error.bind(console),
		info: () => {},
	},
)
const { inputs } = parse(process.argv)

await createAtom(inputs.path[0], inputs.opts)
