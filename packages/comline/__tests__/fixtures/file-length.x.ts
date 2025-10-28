#!/usr/bin/env node

import * as fs from "node:fs"

import { type } from "arktype"

import { cli, options } from "../../src/cli"
import { parseStringOption } from "../../src/option-parsers"

const parser = cli({
	cliName: `read-file-length`,
	routeOptions: {
		"": options(`blah`, type({ file: `string` }), {
			file: {
				description: `file`,
				example: `--file="./example-file.md"`,
				flag: `f`,
				parse: parseStringOption,
				required: true,
			},
		}),
	},
})

const parsed = parser(process.argv)

const fileContent = fs.readFileSync(parsed.inputs.opts.file, `utf-8`)

process.stdout.write(fileContent.length.toString())
