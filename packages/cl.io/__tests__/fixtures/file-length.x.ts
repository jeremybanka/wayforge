#!/usr/bin/env node

import { z } from "zod"
import * as fs from "node:fs"

import { cli } from "../../src/cli"
import { parseStringArg } from "../../src/lib-public"

const parser = cli({
	positionalArgTree: [`optional`, {}],
	optionsSchema: z.object({
		file: z.string(),
	}),
	options: {
		file: {
			description: `file`,
			example: `--file="./example-file.md"`,
			flag: `f`,
			parse: parseStringArg,
			required: true,
		},
	},
})

const parsed = parser(process.argv)

const fileContent = fs.readFileSync(parsed.suppliedOptions.file, `utf-8`)

process.stdout.write(fileContent.length.toString())
