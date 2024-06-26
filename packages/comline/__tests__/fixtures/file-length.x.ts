#!/usr/bin/env node

import * as fs from "node:fs"

import { z } from "zod"

import { cli } from "../../src/cli"
import { parseStringOption } from "../../src/option-parsers"

const parser = cli({
	cliName: `read-file-length`,
	optionsSchema: z.object({
		file: z.string(),
	}),
	options: {
		file: {
			description: `file`,
			example: `--file="./example-file.md"`,
			flag: `f`,
			parse: parseStringOption,
			required: true,
		},
	},
})

const parsed = parser(process.argv)

const fileContent = fs.readFileSync(parsed.suppliedOptions.file, `utf-8`)

process.stdout.write(fileContent.length.toString())
