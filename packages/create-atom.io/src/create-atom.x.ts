#!/usr/bin/env node

import { type } from "arktype"
import type { OptionsGroup } from "comline"
import { cli, optional, options, parseBooleanOption } from "comline"

import type { CreateAtomOptionsPreloaded } from "./create-atom.ts"
import { createAtom } from "./create-atom.ts"

const CREATE_ATOM_OPTS = options(
	`Create a new project with atom.io.`,
	type({
		"packageManager?": `"bun" | "npm" | "pnpm" | "yarn"`,
		"templateName?": `"base"`,
		"skipHints?": `boolean`,
	}),
	{
		packageManager: {
			flag: `m`,
			required: false,
			description: `The package manager to use.`,
			example: `--packageManager="npm"`,
		},
		templateName: {
			flag: `t`,
			required: false,
			description: `The template to use.`,
			example: `--templateName="base"`,
		},
		skipHints: {
			flag: `k`,
			required: false,
			description: `Silences the 'Getting Started' info, mainly for use in other initializers that may wrap this one but provide their own scripts/instructions.`,
			example: `--skipHints`,
			parse: parseBooleanOption,
		},
	},
) satisfies OptionsGroup<CreateAtomOptionsPreloaded>

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
